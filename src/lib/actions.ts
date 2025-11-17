
'use server';

import { revalidatePath } from 'next/cache';
import type { ChangeRequest, ChangeRequestStatus, Document, Lead, Module, Part, Project, Requirement, TimelineEvent, ClientRequirements, ModuleStatus, User } from './definitions';
import { promises as fs } from 'fs';
import path from 'path';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { sendLeadFormNotification, sendClientConfirmationEmail } from './email';

const dataFilePath = (filename: string) => path.join(process.cwd(), 'src', 'data', filename);

async function readData<T>(filename: string): Promise<T[]> {
    try {
        const jsonString = await fs.readFile(dataFilePath(filename), 'utf-8');
        const data = JSON.parse(jsonString) as any[];
        // Convertir fechas de string a Date si es necesario
        return data.map(item => {
            if (item.createdAt && typeof item.createdAt === 'string') {
                return { ...item, createdAt: new Date(item.createdAt) };
            }
            return item;
        }) as T[];
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return []; // Retorna un array vacío si el archivo no existe
        }
        console.error(`Error reading ${filename}:`, error);
        throw error;
    }
}

async function writeData<T>(filename: string, data: T[]): Promise<void> {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        await fs.writeFile(dataFilePath(filename), jsonString, 'utf-8');
    } catch (error) {
        console.error(`Error writing to ${filename}:`, error);
        throw error;
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

    const users = await readData<User>('users.json');
    const user = users.find((u) => u.email === email);

    if (!user) {
      return { error: 'Usuario no encontrado.' };
    }

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
    const users = await readData<User>('users.json');
    const user = users.find((u) => u.id === sessionData.userId && u.active);
    
    return user || null;
  } catch (error) {
    return null;
  }
}

// --- USER MANAGEMENT ACTIONS ---

export async function getUsers(): Promise<Omit<User, 'password'>[]> {
  const users = await readData<User>('users.json');
  // No devolver las contraseñas por seguridad
  return users.map(({ password, ...user }) => user);
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

    const users = await readData<User>('users.json');
    
    // Verificar si el email ya existe
    if (users.some(u => u.email === email)) {
      return { error: 'El correo electrónico ya está en uso.' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      password,
      name,
      active,
      createdAt: new Date(),
    };

    users.push(newUser);
    await writeData('users.json', users);
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

    const users = await readData<User>('users.json');
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return { error: 'Usuario no encontrado.' };
    }

    // Verificar si el email ya está en uso por otro usuario
    if (users.some(u => u.email === email && u.id !== id)) {
      return { error: 'El correo electrónico ya está en uso.' };
    }

    const existingUser = users[userIndex];
    
    // Preservar el createdAt original, convirtiéndolo a Date si es string
    const createdAt = existingUser.createdAt instanceof Date 
      ? existingUser.createdAt 
      : new Date(existingUser.createdAt);

    const updatedUser: User = {
      id: existingUser.id,
      email,
      name,
      password: existingUser.password, // Mantener la contraseña actual por defecto
      active,
      createdAt,
    };

    // Solo actualizar la contraseña si se proporciona una nueva
    if (password && password.trim() !== '') {
      updatedUser.password = password;
    }

    users[userIndex] = updatedUser;
    await writeData('users.json', users);
    revalidatePath('/dashboard/configuracion');
    return { success: true, user: { ...updatedUser, password: '' } };
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { error: `Ocurrió un error al actualizar el usuario: ${errorMessage}` };
  }
}

export async function deleteUser(userId: string) {
  try {
    const users = await readData<User>('users.json');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return { error: 'Usuario no encontrado.' };
    }

    // No permitir eliminar el último usuario activo
    const activeUsers = users.filter(u => u.active && u.id !== userId);
    if (activeUsers.length === 0) {
      return { error: 'No se puede eliminar el último usuario activo.' };
    }

    const filteredUsers = users.filter(u => u.id !== userId);
    await writeData('users.json', filteredUsers);
    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Ocurrió un error al eliminar el usuario.' };
  }
}

export async function toggleUserActive(userId: string) {
  try {
    const users = await readData<User>('users.json');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return { error: 'Usuario no encontrado.' };
    }

    // No permitir desactivar el último usuario activo
    if (user.active) {
      const activeUsers = users.filter(u => u.active && u.id !== userId);
      if (activeUsers.length === 0) {
        return { error: 'No se puede desactivar el último usuario activo.' };
      }
    }

    user.active = !user.active;
    await writeData('users.json', users);
    revalidatePath('/dashboard/configuracion');
    return { success: true, user: { ...user, password: '' } };
  } catch (error) {
    console.error(error);
    return { error: 'Ocurrió un error al cambiar el estado del usuario.' };
  }
}


// --- PROJECT ACTIONS ---

export async function addProject(projectData: Omit<Project, 'id' | 'shareableLinkId' | 'modules' | 'timelineEvents' | 'changeRequests' | 'initialRequirements' | 'projectDocuments'>) {
    const projects = await readData<Project>('projects.json');
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
    
    projects.push(newProject);
    await writeData('projects.json', projects);
    revalidatePath('/dashboard');
    return { success: true, project: newProject };
}


// --- MODULE ACTIONS ---

export async function addModule(projectId: string, moduleData: Omit<Module, 'id' | 'parts' | 'stages' | 'requirements' | 'reviews' | 'deliverables' | 'documents'>) {
    const projects = await readData<Project>('projects.json');
    const project = projects.find(p => p.id === projectId);
    if (!project) return { error: 'Proyecto no encontrado.' };

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

    await writeData('projects.json', projects);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, module: newModule };
}

export async function addModulesFromAI(projectId: string, newModules: Omit<Module, 'id' | 'parts' | 'stages' | 'requirements' | 'reviews' | 'deliverables' | 'documents'>[]) {
    const projects = await readData<Project>('projects.json');
    const project = projects.find(p => p.id === projectId);
    if (!project) return { error: 'Proyecto no encontrado.' };
    
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

    await writeData('projects.json', projects);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, modules: modulesToAdd };
}

export async function editModule(projectId: string, updatedModule: Module) {
    const projects = await readData<Project>('projects.json');
    const project = projects.find(p => p.id === projectId);
    if (!project) return { error: 'Proyecto no encontrado.' };

    updatedModule.deadline = new Date(updatedModule.deadline);
    project.modules = project.modules.map(m => m.id === updatedModule.id ? updatedModule : m);
    project.timelineEvents.unshift({
        eventDescription: `Módulo actualizado: "${updatedModule.name}"`,
        eventDate: new Date(),
        actor: 'admin'
    });

    await writeData('projects.json', projects);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, module: updatedModule };
}

export async function deleteModule(projectId: string, moduleId: string) {
    const projects = await readData<Project>('projects.json');
    const project = projects.find(p => p.id === projectId);
    if (!project) return { error: 'Proyecto no encontrado.' };

    const moduleName = project.modules.find(m => m.id === moduleId)?.name || 'Desconocido';
    project.modules = project.modules.filter(m => m.id !== moduleId);
    project.timelineEvents.unshift({
        eventDescription: `Módulo eliminado: "${moduleName}"`,
        eventDate: new Date(),
        actor: 'admin'
    });
    
    await writeData('projects.json', projects);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
}

export async function updateModuleParts(projectId: string, moduleId: string, updatedParts: Part[]) {
    const projects = await readData<Project>('projects.json');
    const project = projects.find(p => p.id === projectId);
    if (!project) return { error: 'Proyecto no encontrado.' };

    const module = project.modules.find(m => m.id === moduleId);
    if (!module) return { error: 'Módulo no encontrado.' };
    
    module.parts = updatedParts;

    project.timelineEvents.unshift({
        eventDescription: `Tareas actualizadas para el módulo "${module.name}"`,
        eventDate: new Date(),
        actor: 'admin'
    });

    await writeData('projects.json', projects);
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath(`/client-view/${project.shareableLinkId}`);
    return { success: true };
}

export async function clientApproveModule(projectId: string, moduleId: string) {
    const projects = await readData<Project>('projects.json');
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) return { error: 'Proyecto no encontrado.' };

    const project = projects[projectIndex];
    const module = project.modules.find(m => m.id === moduleId);
    if (!module) return { error: 'Módulo no encontrado.' };
    
    module.status = 'Completado';

    project.timelineEvents.unshift({
        eventDescription: `El cliente ha aprobado el módulo: "${module.name}"`,
        eventDate: new Date(),
        actor: 'cliente'
    });
    await writeData('projects.json', projects);
    revalidatePath(`/client-view/${project.shareableLinkId}`);
    return { success: true, updatedProject: project };
}

export async function clientApprovePart(projectId: string, moduleId: string, partId: string) {
    const projects = await readData<Project>('projects.json');
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) return { error: 'Proyecto no encontrado.' };

    const project = projects[projectIndex];
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

    await writeData('projects.json', projects);
    revalidatePath(`/client-view/${project.shareableLinkId}`);
    return { success: true, updatedProject: project };
}

export async function approveModule(projectId: string, moduleId: string) {
    const projects = await readData<Project>('projects.json');
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) return { error: 'Proyecto no encontrado.' };

    const project = projects[projectIndex];
    const module = project.modules.find(m => m.id === moduleId);
    if (!module) return { error: 'Módulo no encontrado.' };
    
    module.status = 'Completado';

    project.timelineEvents.unshift({
        eventDescription: `El administrador ha aprobado el módulo: "${module.name}"`,
        eventDate: new Date(),
        actor: 'admin'
    });
    
    await writeData('projects.json', projects);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, updatedProject: project };
}

// --- CHANGE REQUEST ACTIONS ---

export async function addChangeRequest(projectId: string, formData: FormData) {
  const requestDetails = formData.get('requestDetails') as string;

  if (!requestDetails) {
    return { error: 'Los detalles de la solicitud son obligatorios.' };
  }

  const projects = await readData<Project>('projects.json');
  const project = projects.find(p => p.id === projectId);

  if (project) {
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

      await writeData('projects.json', projects);
      revalidatePath(`/client-view/${project.shareableLinkId}`);
      revalidatePath(`/dashboard/projects/${projectId}`);
  } else {
    return { error: 'Proyecto no encontrado.' };
  }

  return { success: 'Solicitud de cambio enviada con éxito.' };
}

export async function updateChangeRequestStatus(projectId: string, requestId: string, status: ChangeRequestStatus) {
    const projects = await readData<Project>('projects.json');
    const project = projects.find(p => p.id === projectId);
    if (!project) return { error: 'Proyecto no encontrado.' };

    const request = project.changeRequests.find(r => r.id === requestId);
    if (!request) return { error: 'Solicitud no encontrada.' };

    request.status = status;
    project.timelineEvents.unshift({
        eventDescription: `Solicitud de cambio #${requestId.slice(-4)} ha sido ${status.toLowerCase()}`,
        eventDate: new Date(),
        actor: 'admin'
    });
    
    await writeData('projects.json', projects);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
}


// --- REQUIREMENT ACTIONS ---

export async function addRequirement(projectId: string, requirementData: Omit<Requirement, 'id'>) {
    const projects = await readData<Project>('projects.json');
    const project = projects.find(p => p.id === projectId);
    if (!project) return { error: 'Proyecto no encontrado.' };

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

    await writeData('projects.json', projects);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, requirement: newRequirement };
}

export async function editRequirement(projectId: string, updatedRequirement: Requirement) {
    const projects = await readData<Project>('projects.json');
    const project = projects.find(p => p.id === projectId);
    if (!project) return { error: 'Proyecto no encontrado.' };

    project.initialRequirements = project.initialRequirements.map(r => r.id === updatedRequirement.id ? updatedRequirement : r);
    project.timelineEvents.unshift({
        eventDescription: `Requisito actualizado: "${updatedRequirement.title}"`,
        eventDate: new Date(),
        actor: 'admin'
    });
    
    await writeData('projects.json', projects);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, requirement: updatedRequirement };
}

export async function onDeleteRequirement(projectId: string, requirementId: string) {
    const projects = await readData<Project>('projects.json');
    const project = projects.find(p => p.id === projectId);
if (!project) return { error: 'Proyecto no encontrado.' };

    const requirementTitle = project.initialRequirements.find(r => r.id === requirementId)?.title || 'Desconocido';
    project.initialRequirements = project.initialRequirements.filter(r => r.id !== requirementId);

    project.timelineEvents.unshift({
        eventDescription: `Requisito eliminado: "${requirementTitle}"`,
        eventDate: new Date(),
        actor: 'admin'
    });
    
    await writeData('projects.json', projects);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
}

// --- DOCUMENT ACTIONS ---

export async function addDocument(projectId: string, documentData: Omit<Document, 'id'>) {
    const projects = await readData<Project>('projects.json');
    const project = projects.find(p => p.id === projectId);
    if (!project) return { error: 'Proyecto no encontrado.' };

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

    await writeData('projects.json', projects);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, document: newDocument };
}

// --- LEAD ACTIONS ---

export async function createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'formLink' | 'status'>) {
    if (!leadData.name || !leadData.email) {
        return { error: 'El nombre y el correo electrónico son obligatorios.' };
    }
    const leads = await readData<Lead>('leads.json');
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: leadData.name,
      email: leadData.email,
      company: leadData.company,
      status: 'Nuevo',
      createdAt: new Date(),
      formLink: `/leads/lead-${Date.now()}/form`,
    };
    leads.unshift(newLead);
    await writeData('leads.json', leads);
    revalidatePath('/dashboard/leads');
    return { success: true, lead: newLead };
}

export async function submitLeadForm(leadId: string, formData: any) {
    const leads = await readData<Lead>('leads.json');
    const requirements = await readData<ClientRequirements>('client-requirements.json');

    const lead = leads.find(l => l.id === leadId);
    if (lead) {
        lead.status = 'Propuesta Enviada';
        lead.name = formData.contactInfo.name;
        lead.company = formData.contactInfo.company;
        lead.email = formData.contactInfo.email;

        const requirementData: ClientRequirements = {
            leadId,
            submittedAt: new Date(),
            ...formData,
        };

        requirements.push(requirementData);
        
        await writeData('leads.json', leads);
        await writeData('client-requirements.json', requirements);

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

        revalidatePath('/dashboard/leads');
    } else {
        return { error: 'Lead no encontrado' };
    }

    return { success: true };
}
