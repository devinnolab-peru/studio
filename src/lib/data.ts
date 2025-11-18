
import type { Project, Lead, ClientRequirements } from './definitions';
import { getCollection, convertObjectIdToString, convertStringToObjectId } from './mongodb';
import { ObjectId } from 'mongodb';

// --- Data Fetching Functions ---

export async function getProjects(): Promise<Project[]> {
  const projectsCollection = await getCollection<Project & { _id?: ObjectId }>('projects');
  const projects = await projectsCollection.find({}).toArray();
  return projects.map(doc => convertObjectIdToString(doc));
}

export async function getLeads(): Promise<Lead[]> {
  try {
    const leadsCollection = await getCollection<Lead & { _id?: ObjectId }>('leads');
    const leads = await leadsCollection.find({}).toArray();
    return leads.map(doc => convertObjectIdToString(doc));
  } catch (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
}

export async function getClientRequirements(): Promise<ClientRequirements[]> {
  try {
    const requirementsCollection = await getCollection<ClientRequirements & { _id?: ObjectId }>('clientRequirements');
    const requirements = await requirementsCollection.find({}).toArray();
    return requirements.map(doc => convertObjectIdToString(doc));
  } catch (error) {
    console.error('Error fetching client requirements:', error);
    return [];
  }
}

export async function getProjectById(id: string, byShareableLink: boolean = false): Promise<Project[] | undefined> {
    const projectsCollection = await getCollection<Project & { _id?: ObjectId }>('projects');
    let projects;
    if (byShareableLink) {
        projects = await projectsCollection.find({ shareableLinkId: id }).toArray();
    } else {
        let project;
        try {
            project = await projectsCollection.findOne({ _id: convertStringToObjectId(id) });
        } catch {
            project = await projectsCollection.findOne({ id });
        }
        projects = project ? [project] : [];
    }
    return projects.map(doc => convertObjectIdToString(doc));
}


export async function getLeadById(leadId: string): Promise<Lead | undefined> {
    const leadsCollection = await getCollection<Lead & { _id?: ObjectId }>('leads');
    let leadDoc;
    
    // Intentar buscar por _id (ObjectId)
    try {
        leadDoc = await leadsCollection.findOne({ _id: convertStringToObjectId(leadId) });
        if (leadDoc) {
            return convertObjectIdToString(leadDoc);
        }
    } catch {
        // Si no es un ObjectId válido, continuar con otras búsquedas
    }
    
    // Intentar buscar por id
    leadDoc = await leadsCollection.findOne({ id: leadId });
    if (leadDoc) {
        return convertObjectIdToString(leadDoc);
    }
    
    // Si no se encuentra, intentar buscar por formLink (útil para leads antiguos con id sobrescrito)
    const formLink = `/leads/${leadId}/form`;
    leadDoc = await leadsCollection.findOne({ formLink });
    if (leadDoc) {
        // Si encontramos el lead por formLink pero el id está sobrescrito, corregirlo
        const lead = convertObjectIdToString(leadDoc);
        // Si el id no coincide con el leadId del formLink, actualizar el id
        if (lead.id !== leadId && lead.formLink === formLink) {
            await leadsCollection.updateOne(
                { _id: leadDoc._id },
                { $set: { id: leadId } }
            );
            lead.id = leadId;
        }
        return lead;
    }
    
    return undefined;
}

export async function getRequirementsByLeadId(leadId: string): Promise<ClientRequirements | undefined> {
    const requirementsCollection = await getCollection<ClientRequirements & { _id?: ObjectId }>('clientRequirements');
    const requirementDoc = await requirementsCollection.findOne({ leadId });
    return requirementDoc ? convertObjectIdToString(requirementDoc) : undefined;
}
