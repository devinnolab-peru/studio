
'use server';

import { revalidatePath } from 'next/cache';
import type { ChangeRequest, ChangeRequestStatus, Document, Lead, Module, Part, Project, Requirement, TimelineEvent, ClientRequirements, ModuleStatus, User } from './definitions';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { sendLeadFormNotification, sendClientConfirmationEmail } from './email';
import { getCollection, convertObjectIdToString, convertStringToObjectId } from './mongodb';
import { ObjectId } from 'mongodb';

// Helper functions para proyectos
async function getProjectById(projectId: string): Promise<(Project & { _id?: ObjectId }) | null> {
    const projectsCollection = await getCollection<Project & { _id?: ObjectId }>('projects');
    let project;
    try {
        project = await projectsCollection.findOne({ _id: convertStringToObjectId(projectId) });
    } catch {
        project = await projectsCollection.findOne({ id: projectId });
    }
    return project;
}

async function updateProject(projectId: string, updateData: Partial<Project>): Promise<void> {
    const projectsCollection = await getCollection<Project & { _id?: ObjectId }>('projects');
    try {
        await projectsCollection.updateOne(
            { _id: convertStringToObjectId(projectId) },
            { $set: updateData }
        );
    } catch {
        await projectsCollection.updateOne(
            { id: projectId },
            { $set: updateData }
        );
    }
}

// --- AUTH ACTIONS ---
export async function login(prevState: string | undefined, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return { error: 'Por favor, introduce el correo y la contraseña.' };
    }

    const usersCollection = await getCollection<User & { _id?: ObjectId }>('users');
    const userDoc = await usersCollection.findOne({ email });

    if (!userDoc) {
      return { error: 'Usuario no encontrado.' };
    }

    const user = convertObjectIdToString(userDoc);

    if (!user.active) {
      return { error: 'Usuario inactivo. Contacta al administrador.' };
    }

    if (user.password !== password) {
      return { error: 'Contraseña incorrecta.' };
    }

    // Establecer cookie de sesión
    const cookieStore = await cookies();
    cookieStore.set('session', JSON.stringify({ userId: user.id, email: user.email, name: user.name }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });
  } catch (error) {
    console.error(error);
    return { error: 'Ocurrió un error inesperado.' };
  }

  redirect('/dashboard');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/');
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    
    if (!session) {
      return null;
    }

    const sessionData = JSON.parse(session.value);
    const usersCollection = await getCollection<User & { _id?: ObjectId }>('users');
    
    // Intentar buscar por ObjectId primero, luego por string id
    let userDoc;
    try {
      userDoc = await usersCollection.findOne({ _id: convertStringToObjectId(sessionData.userId) });
    } catch {
      userDoc = await usersCollection.findOne({ id: sessionData.userId });
    }
    
    if (!userDoc) {
      return null;
    }

    const user = convertObjectIdToString(userDoc);
    
    if (!user.active) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

// --- USER MANAGEMENT ACTIONS ---

export async function getUsers(): Promise<Omit<User, 'password'>[]> {
  const usersCollection = await getCollection<User & { _id?: ObjectId }>('users');
  const users = await usersCollection.find({}).toArray();
  // No devolver las contraseñas por seguridad
  return users.map(doc => {
    const user = convertObjectIdToString(doc);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}

export async function createUser(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const active = formData.get('active') === 'true';

    if (!email || !password || !name) {
      return { error: 'Todos los campos son obligatorios.' };
    }

    const usersCollection = await getCollection<User & { _id?: ObjectId }>('users');
    
    // Verificar si el email ya existe
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return { error: 'El correo electrónico ya está en uso.' };
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      password,
      name,
      active,
      createdAt: new Date(),
    };

    await usersCollection.insertOne(newUser);
    revalidatePath('/dashboard/configuracion');
    return { success: true, user: { ...newUser, password: '' } };
  } catch (error) {
    console.error(error);
    return { error: 'Ocurrió un error al crear el usuario.' };
  }
}

export async function updateUser(prevState: any, formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const active = formData.get('active') === 'true';

    if (!id || !email || !name) {
      return { error: 'Los campos obligatorios están incompletos.' };
    }

    const usersCollection = await getCollection<User & { _id?: ObjectId }>('users');
    
    // Buscar el usuario por ObjectId o por id string
    let existingUserDoc;
    try {
      existingUserDoc = await usersCollection.findOne({ _id: convertStringToObjectId(id) });
    } catch {
      existingUserDoc = await usersCollection.findOne({ id });
    }

    if (!existingUserDoc) {
      return { error: 'Usuario no encontrado.' };
    }

    // Verificar si el email ya está en uso por otro usuario
    const emailUser = await usersCollection.findOne({ email });
    if (emailUser) {
      const emailUserId = emailUser._id ? emailUser._id.toString() : emailUser.id;
      if (emailUserId !== id) {
        return { error: 'El correo electrónico ya está en uso.' };
      }
    }

    const existingUser = convertObjectIdToString(existingUserDoc);
    
    // Preservar el createdAt original
    const createdAt = existingUser.createdAt instanceof Date 
      ? existingUser.createdAt 
      : new Date(existingUser.createdAt);

    const updateData: any = {
      email,
      name,
      active,
      createdAt,
    };

    // Solo actualizar la contraseña si se proporciona una nueva
    if (password && password.trim() !== '') {
      updateData.password = password;
    } else {
      updateData.password = existingUser.password;
    }

    // Actualizar usando ObjectId o id string
    try {
      await usersCollection.updateOne(
        { _id: convertStringToObjectId(id) },
        { $set: updateData }
      );
    } catch {
      await usersCollection.updateOne(
        { id },
        { $set: updateData }
      );
    }

    revalidatePath('/dashboard/configuracion');
    return { success: true, user: { ...updateData, id, password: '' } };
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { error: `Ocurrió un error al actualizar el usuario: ${errorMessage}` };
  }
}

export async function deleteUser(userId: string) {
  try {
    const usersCollection = await getCollection<User & { _id?: ObjectId }>('users');
    
    // Buscar el usuario
    let userDoc;
    try {
      userDoc = await usersCollection.findOne({ _id: convertStringToObjectId(userId) });
    } catch {
      userDoc = await usersCollection.findOne({ id: userId });
    }
    
    if (!userDoc) {
      return { error: 'Usuario no encontrado.' };
    }

    // No permitir eliminar el último usuario activo
    const activeUsers = await usersCollection.find({ active: true }).toArray();
    const activeUsersFiltered = activeUsers.filter(u => {
      const uid = u._id ? u._id.toString() : u.id;
      return uid !== userId;
    });
    
    if (activeUsersFiltered.length === 0) {
      return { error: 'No se puede eliminar el último usuario activo.' };
    }

    // Eliminar usando ObjectId o id string
    try {
      await usersCollection.deleteOne({ _id: convertStringToObjectId(userId) });
    } catch {
      await usersCollection.deleteOne({ id: userId });
    }
    
    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Ocurrió un error al eliminar el usuario.' };
  }
}

export async function toggleUserActive(userId: string) {
  try {
    const usersCollection = await getCollection<User & { _id?: ObjectId }>('users');
    
    // Buscar el usuario
    let userDoc;
    try {
      userDoc = await usersCollection.findOne({ _id: convertStringToObjectId(userId) });
    } catch {
      userDoc = await usersCollection.findOne({ id: userId });
    }
    
    if (!userDoc) {
      return { error: 'Usuario no encontrado.' };
    }

    const user = convertObjectIdToString(userDoc);

    // No permitir desactivar el último usuario activo
    if (user.active) {
      const activeUsers = await usersCollection.find({ active: true }).toArray();
      const activeUsersFiltered = activeUsers.filter(u => {
        const uid = u._id ? u._id.toString() : u.id;
        return uid !== userId;
      });
      
      if (activeUsersFiltered.length === 0) {
        return { error: 'No se puede desactivar el último usuario activo.' };
      }
    }

    const newActive = !user.active;
    
    // Actualizar usando ObjectId o id string
    try {
      await usersCollection.updateOne(
        { _id: convertStringToObjectId(userId) },
        { $set: { active: newActive } }
      );
    } catch {
      await usersCollection.updateOne(
        { id: userId },
        { $set: { active: newActive } }
      );
    }
    
    revalidatePath('/dashboard/configuracion');
    return { success: true, user: { ...user, active: newActive, password: '' } };
  } catch (error) {
    console.error(error);
    return { error: 'Ocurrió un error al cambiar el estado del usuario.' };
  }
}


// --- PROJECT ACTIONS ---

export async function addProject(projectData: Omit<Project, 'id' | 'shareableLinkId' | 'modules' | 'timelineEvents' | 'changeRequests' | 'initialRequirements' | 'projectDocuments'>) {
    const projectsCollection = await getCollection<Project & { _id?: ObjectId }>('projects');
    const newProject: Project = {
        ...projectData,
        id: `proj-${Date.now()}`,
        shareableLinkId: `client-link-${Date.now()}`,
        modules: [],
        timelineEvents: [{
            actor: 'sistema',
            eventDate: new Date(),
            eventDescription: `Proyecto "${projectData.name}" creado.`
        }],
        changeRequests: [],
        initialRequirements: [],
        projectDocuments: [],
        startDate: new Date(projectData.startDate),
        deadline: new Date(projectData.deadline),
    };
    
    await projectsCollection.insertOne(newProject);
    revalidatePath('/dashboard');
    return { success: true, project: newProject };
}


// --- MODULE ACTIONS ---

export async function addModule(projectId: string, moduleData: Omit<Module, 'id' | 'parts' | 'stages' | 'requirements' | 'reviews' | 'deliverables' | 'documents'>) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };

    const project = convertObjectIdToString(projectDoc);
    const newModule: Module = {
        ...moduleData,
        id: `mod-${Date.now()}`,
        status: 'Pendiente',
        deadline: new Date(moduleData.deadline),
        parts: [],
        stages: [],
        requirements: [],
        reviews: [],
        deliverables: [],
        documents: [],
    };
    
    project.modules.push(newModule);
    project.timelineEvents.unshift({
        eventDescription: `Nuevo módulo añadido: "${newModule.name}"`,
        eventDate: new Date(),
        actor: 'admin'
    });

    await updateProject(projectId, project);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, module: newModule };
}

export async function addModulesFromAI(projectId: string, newModules: Omit<Module, 'id' | 'parts' | 'stages' | 'requirements' | 'reviews' | 'deliverables' | 'documents'>[]) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };
    
    const project = convertObjectIdToString(projectDoc);
    const modulesToAdd: Module[] = newModules.map(m => ({
        ...m,
        id: `mod-${Date.now()}-${Math.random()}`,
        status: 'Pendiente',
        deadline: new Date(m.deadline),
        parts: [],
        stages: [],
        requirements: [],
        reviews: [],
        deliverables: [],
        documents: [],
    }));

    project.modules.push(...modulesToAdd);
    project.timelineEvents.unshift({
        eventDescription: `${modulesToAdd.length} módulos generados por IA`,
        eventDate: new Date(),
        actor: 'sistema'
    });

    await updateProject(projectId, project);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, modules: modulesToAdd };
}

export async function editModule(projectId: string, updatedModule: Module) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };

    const project = convertObjectIdToString(projectDoc);
    updatedModule.deadline = new Date(updatedModule.deadline);
    project.modules = project.modules.map(m => m.id === updatedModule.id ? updatedModule : m);
    project.timelineEvents.unshift({
        eventDescription: `Módulo actualizado: "${updatedModule.name}"`,
        eventDate: new Date(),
        actor: 'admin'
    });

    await updateProject(projectId, project);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, module: updatedModule };
}

export async function deleteModule(projectId: string, moduleId: string) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };

    const project = convertObjectIdToString(projectDoc);
    const moduleName = project.modules.find(m => m.id === moduleId)?.name || 'Desconocido';
    project.modules = project.modules.filter(m => m.id !== moduleId);
    project.timelineEvents.unshift({
        eventDescription: `Módulo eliminado: "${moduleName}"`,
        eventDate: new Date(),
        actor: 'admin'
    });
    
    await updateProject(projectId, project);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
}

export async function updateModuleParts(projectId: string, moduleId: string, updatedParts: Part[]) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };

    const project = convertObjectIdToString(projectDoc);
    const module = project.modules.find(m => m.id === moduleId);
    if (!module) return { error: 'Módulo no encontrado.' };
    
    module.parts = updatedParts;

    project.timelineEvents.unshift({
        eventDescription: `Tareas actualizadas para el módulo "${module.name}"`,
        eventDate: new Date(),
        actor: 'admin'
    });

    await updateProject(projectId, project);
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath(`/client-view/${project.shareableLinkId}`);
    return { success: true };
}

export async function clientApproveModule(projectId: string, moduleId: string) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };

    const project = convertObjectIdToString(projectDoc);
    const module = project.modules.find(m => m.id === moduleId);
    if (!module) return { error: 'Módulo no encontrado.' };
    
    module.status = 'Completado';

    project.timelineEvents.unshift({
        eventDescription: `El cliente ha aprobado el módulo: "${module.name}"`,
        eventDate: new Date(),
        actor: 'cliente'
    });
    await updateProject(projectId, project);
    revalidatePath(`/client-view/${project.shareableLinkId}`);
    return { success: true, updatedProject: project };
}

export async function clientApprovePart(projectId: string, moduleId: string, partId: string) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };

    const project = convertObjectIdToString(projectDoc);
    const module = project.modules.find(m => m.id === moduleId);
    if (!module) return { error: 'Módulo no encontrado.' };
    
    const part = module.parts.find(p => p.id === partId);
    if (!part) return { error: 'Tarea no encontrada.' };

    part.status = 'Completado';

     project.timelineEvents.unshift({
        eventDescription: `El cliente ha aprobado la tarea: "${part.name}" en el módulo "${module.name}"`,
        eventDate: new Date(),
        actor: 'cliente'
    });

    await updateProject(projectId, project);
    revalidatePath(`/client-view/${project.shareableLinkId}`);
    return { success: true, updatedProject: project };
}

export async function approveModule(projectId: string, moduleId: string) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };

    const project = convertObjectIdToString(projectDoc);
    const module = project.modules.find(m => m.id === moduleId);
    if (!module) return { error: 'Módulo no encontrado.' };
    
    module.status = 'Completado';

    project.timelineEvents.unshift({
        eventDescription: `El administrador ha aprobado el módulo: "${module.name}"`,
        eventDate: new Date(),
        actor: 'admin'
    });
    
    await updateProject(projectId, project);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, updatedProject: project };
}

// --- CHANGE REQUEST ACTIONS ---

export async function addChangeRequest(projectId: string, formData: FormData) {
  const requestDetails = formData.get('requestDetails') as string;

  if (!requestDetails) {
    return { error: 'Los detalles de la solicitud son obligatorios.' };
  }

  const projectDoc = await getProjectById(projectId);
  if (!projectDoc) {
    return { error: 'Proyecto no encontrado.' };
  }

  const project = convertObjectIdToString(projectDoc);
  const newRequest: ChangeRequest = {
      id: `cr-${Date.now()}`,
      requestDetails,
      status: 'Pendiente de Aprobación',
      submittedAt: new Date(),
  };
  project.changeRequests.push(newRequest);
  
  const timelineEvent: TimelineEvent = {
      eventDescription: `El cliente ha enviado una nueva solicitud de cambio.`,
      eventDate: new Date(),
      actor: 'cliente' as const
  };
  project.timelineEvents.unshift(timelineEvent);

  await updateProject(projectId, project);
  revalidatePath(`/client-view/${project.shareableLinkId}`);
  revalidatePath(`/dashboard/projects/${projectId}`);

  return { success: 'Solicitud de cambio enviada con éxito.' };
}

export async function updateChangeRequestStatus(projectId: string, requestId: string, status: ChangeRequestStatus) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };

    const project = convertObjectIdToString(projectDoc);
    const request = project.changeRequests.find(r => r.id === requestId);
    if (!request) return { error: 'Solicitud no encontrada.' };

    request.status = status;
    project.timelineEvents.unshift({
        eventDescription: `Solicitud de cambio #${requestId.slice(-4)} ha sido ${status.toLowerCase()}`,
        eventDate: new Date(),
        actor: 'admin'
    });
    
    await updateProject(projectId, project);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
}


// --- REQUIREMENT ACTIONS ---

export async function addRequirement(projectId: string, requirementData: Omit<Requirement, 'id'>) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };

    const project = convertObjectIdToString(projectDoc);
    const newRequirement: Requirement = {
        ...requirementData,
        id: `req-${Date.now()}`,
    };

    project.initialRequirements.push(newRequirement);
    project.timelineEvents.unshift({
        eventDescription: `Nuevo requisito añadido: "${newRequirement.title}"`,
        eventDate: new Date(),
        actor: 'admin'
    });

    await updateProject(projectId, project);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, requirement: newRequirement };
}

export async function editRequirement(projectId: string, updatedRequirement: Requirement) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };

    const project = convertObjectIdToString(projectDoc);
    project.initialRequirements = project.initialRequirements.map(r => r.id === updatedRequirement.id ? updatedRequirement : r);
    project.timelineEvents.unshift({
        eventDescription: `Requisito actualizado: "${updatedRequirement.title}"`,
        eventDate: new Date(),
        actor: 'admin'
    });
    
    await updateProject(projectId, project);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, requirement: updatedRequirement };
}

export async function onDeleteRequirement(projectId: string, requirementId: string) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };

    const project = convertObjectIdToString(projectDoc);
    const requirementTitle = project.initialRequirements.find(r => r.id === requirementId)?.title || 'Desconocido';
    project.initialRequirements = project.initialRequirements.filter(r => r.id !== requirementId);

    project.timelineEvents.unshift({
        eventDescription: `Requisito eliminado: "${requirementTitle}"`,
        eventDate: new Date(),
        actor: 'admin'
    });
    
    await updateProject(projectId, project);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
}

// --- DOCUMENT ACTIONS ---

export async function addDocument(projectId: string, documentData: Omit<Document, 'id'>) {
    const projectDoc = await getProjectById(projectId);
    if (!projectDoc) return { error: 'Proyecto no encontrado.' };

    const project = convertObjectIdToString(projectDoc);
    const newDocument: Document = {
        ...documentData,
        id: `doc-${Date.now()}`,
    };

    if (!project.projectDocuments) {
        project.projectDocuments = [];
    }

    project.projectDocuments.push(newDocument);
    project.timelineEvents.unshift({
        eventDescription: `Nuevo documento de proyecto añadido: "${newDocument.name}"`,
        eventDate: new Date(),
        actor: 'admin'
    });

    await updateProject(projectId, project);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, document: newDocument };
}

// --- LEAD ACTIONS ---

export async function createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'formLink' | 'status'>) {
    if (!leadData.name || !leadData.email) {
        return { error: 'El nombre y el correo electrónico son obligatorios.' };
    }
    const leadsCollection = await getCollection<Lead & { _id?: ObjectId }>('leads');
    const leadTimestamp = Date.now();
    const newLead: Lead = {
      id: `lead-${leadTimestamp}`,
      name: leadData.name,
      email: leadData.email,
      company: leadData.company,
      status: 'Nuevo',
      createdAt: new Date(),
      formLink: `/leads/lead-${leadTimestamp}/form`,
    };
    await leadsCollection.insertOne(newLead);
    revalidatePath('/dashboard/leads');
    return { success: true, lead: newLead };
}

export async function submitLeadForm(leadId: string, formData: any) {
    const leadsCollection = await getCollection<Lead & { _id?: ObjectId }>('leads');
    const requirementsCollection = await getCollection<ClientRequirements & { _id?: ObjectId }>('clientRequirements');

    let leadDoc;
    // Intentar buscar por _id (ObjectId)
    try {
        leadDoc = await leadsCollection.findOne({ _id: convertStringToObjectId(leadId) });
    } catch {
        // Si no es un ObjectId válido, continuar con otras búsquedas
    }
    
    // Si no se encontró, intentar buscar por id
    if (!leadDoc) {
        leadDoc = await leadsCollection.findOne({ id: leadId });
    }
    
    // Si aún no se encuentra, intentar buscar por formLink (útil para leads antiguos con id sobrescrito)
    if (!leadDoc) {
        const formLink = `/leads/${leadId}/form`;
        leadDoc = await leadsCollection.findOne({ formLink });
        // Si encontramos el lead por formLink pero el id está sobrescrito, corregirlo
        if (leadDoc && leadDoc.id !== leadId) {
            await leadsCollection.updateOne(
                { _id: leadDoc._id },
                { $set: { id: leadId } }
            );
            leadDoc.id = leadId;
        }
    }

    if (!leadDoc) {
        return { error: 'Lead no encontrado' };
    }

    const lead = convertObjectIdToString(leadDoc);
    
    // Verificar si ya existe un requirement para este lead
    const existingRequirement = await requirementsCollection.findOne({ leadId });
    
    const requirementData: ClientRequirements = {
        leadId,
        submittedAt: existingRequirement ? (existingRequirement.submittedAt || new Date()) : new Date(),
        ...formData,
    };

    // Actualizar lead - solo actualizar campos específicos, no el id ni formLink
    const leadUpdate: Partial<Lead> = {
        status: 'Propuesta Enviada',
        name: formData.contactInfo.name,
        company: formData.contactInfo.company,
        email: formData.contactInfo.email,
    };

    // Actualizar lead
    try {
        await leadsCollection.updateOne(
            { _id: convertStringToObjectId(leadId) },
            { $set: leadUpdate }
        );
    } catch {
        await leadsCollection.updateOne(
            { id: leadId },
            { $set: leadUpdate }
        );
    }

    // Actualizar o insertar requirement
    if (existingRequirement) {
        // Actualizar requirement existente
        try {
            await requirementsCollection.updateOne(
                { _id: existingRequirement._id },
                { $set: requirementData }
            );
        } catch {
            await requirementsCollection.updateOne(
                { leadId },
                { $set: requirementData }
            );
        }
    } else {
        // Insertar nuevo requirement
        await requirementsCollection.insertOne(requirementData);
    }

    // Enviar emails de notificación (no bloquean si fallan)
    try {
        // Email de notificación al administrador
        await sendLeadFormNotification(requirementData, leadId);
    } catch (error) {
        console.error('Error al enviar email de notificación al administrador:', error);
    }

    try {
        // Email de confirmación al cliente
        await sendClientConfirmationEmail(requirementData);
    } catch (error) {
        console.error('Error al enviar email de confirmación al cliente:', error);
    }

    // Revalidar rutas del dashboard para actualizar la lista de leads
    revalidatePath('/dashboard/leads');
    
    return { success: true };
}

// --- DELETE ACTIONS ---

export async function deleteProject(projectId: string) {
    try {
        const projectsCollection = await getCollection<Project & { _id?: ObjectId }>('projects');
        
        // Buscar el proyecto
        let projectDoc;
        try {
            projectDoc = await projectsCollection.findOne({ _id: convertStringToObjectId(projectId) });
        } catch {
            projectDoc = await projectsCollection.findOne({ id: projectId });
        }
        
        if (!projectDoc) {
            return { error: 'Proyecto no encontrado.' };
        }

        // Eliminar usando ObjectId o id string
        try {
            await projectsCollection.deleteOne({ _id: convertStringToObjectId(projectId) });
        } catch {
            await projectsCollection.deleteOne({ id: projectId });
        }
        
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/projects');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: 'Ocurrió un error al eliminar el proyecto.' };
    }
}

export async function deleteLead(leadId: string) {
    try {
        const leadsCollection = await getCollection<Lead & { _id?: ObjectId }>('leads');
        const requirementsCollection = await getCollection<ClientRequirements & { _id?: ObjectId }>('clientRequirements');
        
        // Buscar el lead
        let leadDoc;
        try {
            leadDoc = await leadsCollection.findOne({ _id: convertStringToObjectId(leadId) });
        } catch {
            leadDoc = await leadsCollection.findOne({ id: leadId });
        }
        
        if (!leadDoc) {
            return { error: 'Lead no encontrado.' };
        }

        // Eliminar el lead
        try {
            await leadsCollection.deleteOne({ _id: convertStringToObjectId(leadId) });
        } catch {
            await leadsCollection.deleteOne({ id: leadId });
        }

        // También eliminar los requerimientos asociados si existen
        await requirementsCollection.deleteMany({ leadId });
        
        revalidatePath('/dashboard/leads');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: 'Ocurrió un error al eliminar el lead.' };
    }
}
