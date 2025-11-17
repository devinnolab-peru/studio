
export type ProjectStatus = "Planificación" | "En Progreso" | "En Revisión" | "Completado";
export type ModuleStatus = "Pendiente" | "En Progreso" | "Completado" | "En Revisión";
export type ChangeRequestStatus = "Pendiente de Aprobación" | "Aprobado" | "Rechazado";
export type PartStatus = "Pendiente" | "Completado" | "En Revisión";
export type LeadStatus = "Nuevo" | "Contactado" | "Propuesta Enviada" | "Convertido";

export interface Requirement {
  id: string;
  title: string;
  url: string;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: 'Brief' | 'Observaciones' | 'Acta de Reunión' | 'Otro';
}

export interface Deliverable {
    id: string;
    name: string;
    url: string;
    submittedDate: Date;
}

export interface ChangeRequest {
  id: string;
  requestDetails: string;
  status: ChangeRequestStatus;
  submittedAt: Date;
}

export interface TimelineEvent {
  eventDescription: string;
  eventDate: Date;
  actor: "admin" | "cliente" | "sistema";
}

export interface Part {
  id: string;
  name: string;
  status: PartStatus;
}


export interface Module {
  id: string;
  name: string;
  description?: string;
  status: ModuleStatus;
  deadline: Date;
  owner: string;
  estimatedHours: number;
  parts: Part[];
  stages: { name: string; status: string }[];
  requirements: { description: string; status: string }[];
  reviews: { notes: string; status: string }[];
  deliverables?: Deliverable[];
  documents?: Document[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: Date;
  deadline: Date;
  shareableLinkId: string;
  initialRequirements: Requirement[];
  projectDocuments?: Document[];
  modules: Module[];
  timelineEvents: TimelineEvent[];
  changeRequests: ChangeRequest[];
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: LeadStatus;
  createdAt: Date;
  formLink: string;
}

export interface ClientRequirements {
  leadId: string;
  contactInfo: {
    name: string;
    company: string;
    email: string;
    phone: string;
    clientType: 'empresa' | 'particular';
  };
  projectInfo: {
    projectName: string;
    projectIdea: string;
    targetAudience: string;
    mainGoals: string[];
    competitors: string;
    country: string;
  };
  scopeAndFeatures: {
    platforms: string[];
    commonFeatures: string[];
    otherFeatures: string[];
  };
  designAndUX: {
    hasBrandIdentity: string;
    brandFiles?: any[];
    designInspirations: string[];
    lookAndFeel: string;
  };
   contentAndStrategy: {
    contentCreation: string;
    marketingPlan: string;
    maintenance: string;
  };
  attachments?: any[];
  submittedAt: Date;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  active: boolean;
  createdAt: Date;
}
