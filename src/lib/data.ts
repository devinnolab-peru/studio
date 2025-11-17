
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
  const leadsCollection = await getCollection<Lead & { _id?: ObjectId }>('leads');
  const leads = await leadsCollection.find({}).toArray();
  return leads.map(doc => convertObjectIdToString(doc));
}

export async function getClientRequirements(): Promise<ClientRequirements[]> {
  const requirementsCollection = await getCollection<ClientRequirements & { _id?: ObjectId }>('clientRequirements');
  const requirements = await requirementsCollection.find({}).toArray();
  return requirements.map(doc => convertObjectIdToString(doc));
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
    try {
        leadDoc = await leadsCollection.findOne({ _id: convertStringToObjectId(leadId) });
    } catch {
        leadDoc = await leadsCollection.findOne({ id: leadId });
    }
    return leadDoc ? convertObjectIdToString(leadDoc) : undefined;
}

export async function getRequirementsByLeadId(leadId: string): Promise<ClientRequirements | undefined> {
    const requirementsCollection = await getCollection<ClientRequirements & { _id?: ObjectId }>('clientRequirements');
    const requirementDoc = await requirementsCollection.findOne({ leadId });
    return requirementDoc ? convertObjectIdToString(requirementDoc) : undefined;
}
