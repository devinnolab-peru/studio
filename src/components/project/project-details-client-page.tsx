
'use client';
import { useState } from 'react';
import type { Project, Module, ChangeRequestStatus, Requirement, Document, Part } from '@/lib/definitions';
import ProjectHeader from './project-header';
import RequirementsCard from './requirements-card';
import ModulesAccordion from './modules-accordion';
import TimelineView from './timeline-view';
import ChangeRequestsList from './change-requests-list';
import { useToast } from '@/hooks/use-toast';
import ProjectDocumentsCard from './project-documents-card';
import { addModule, addModulesFromAI, editModule, deleteModule, updateChangeRequestStatus, updateModuleParts, addRequirement, editRequirement, onDeleteRequirement, addDocument, approveModule } from '@/lib/actions';

export default function ProjectDetailsClientPage({ initialProject }: { initialProject: Project }) {
  const { toast } = useToast();
  const projectId = initialProject.id;

  const handleAddModule = async (newModuleData: Omit<Module, 'id' | 'parts' | 'stages' | 'requirements' | 'reviews' | 'deliverables' | 'documents'>) => {
    const result = await addModule(projectId, newModuleData);
    if (result.success && result.module) {
      toast({
        title: 'Módulo Añadido',
        description: `El módulo "${result.module.name}" ha sido añadido al proyecto.`,
      });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const handleEditModule = async (updatedModule: Module) => {
    const result = await editModule(projectId, updatedModule);
    if (result.success && result.module) {
      toast({
        title: 'Módulo Actualizado',
        description: `El módulo "${result.module.name}" ha sido actualizado.`,
      });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const handleAddModulesFromAI = async (newModules: Omit<Module, 'id' | 'status' | 'parts' | 'stages' | 'requirements' | 'reviews' | 'deliverables' | 'documents'>[]) => {
      const result = await addModulesFromAI(projectId, newModules);
      if(result.success && result.modules){
        toast({
            title: 'Módulos de IA Añadidos',
            description: `${result.modules.length} nuevos módulos han sido añadidos al proyecto.`,
        });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
  }

  const handleDeleteModule = async (moduleId: string) => {
    const result = await deleteModule(projectId, moduleId);
    if (result.success) {
        toast({
            variant: 'destructive',
            title: 'Módulo Eliminado',
            description: `El módulo ha sido eliminado.`,
        });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  const handleChangeRequestStatus = async (requestId: string, status: ChangeRequestStatus) => {
    const result = await updateChangeRequestStatus(projectId, requestId, status);
    if (result.success) {
        toast({
            title: `Solicitud ${status}`,
            description: `La solicitud de cambio ha sido marcada como ${status.toLowerCase()}.`
        });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const handleModulePartsUpdate = async (moduleId: string, updatedParts: Part[]) => {
    await updateModuleParts(projectId, moduleId, updatedParts);
    // Toast is shown in the child component for snappier UI
  };

  const handleAddRequirement = async (requirementData: Omit<Requirement, 'id'>) => {
    const result = await addRequirement(projectId, requirementData);
    if (result.success) {
        toast({
            title: 'Requisito Añadido',
            description: 'Se ha añadido un nuevo requisito inicial al proyecto.',
        });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const handleEditRequirement = async (updatedRequirement: Requirement) => {
    const result = await editRequirement(projectId, updatedRequirement);
    if (result.success) {
        toast({
            title: 'Requisito Actualizado',
            description: 'El requisito ha sido actualizado.',
        });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const handleDeleteRequirement = async (requirementId: string) => {
     const result = await onDeleteRequirement(projectId, requirementId);
     if (result.success) {
        toast({
            variant: 'destructive',
            title: 'Requisito Eliminado',
            description: 'El requisito ha sido eliminado.',
        });
     } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
     }
  };

  const handleAddDocument = async (documentData: Omit<Document, 'id'>) => {
    const result = await addDocument(projectId, documentData);
     if (result.success) {
        toast({
            title: 'Documento Añadido',
            description: 'Se ha añadido un nuevo documento al proyecto.',
        });
     } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
     }
  };

  const handleApproveModule = async (moduleId: string) => {
    const result = await approveModule(projectId, moduleId);
    if (result.success && result.updatedProject) {
      toast({
        title: 'Módulo Aprobado',
        description: 'El módulo ha sido marcado como completado.',
      });
      // Recargar la página para actualizar el estado y la barra de progreso
      window.location.reload();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <div className="space-y-8">
      <ProjectHeader project={initialProject} />
      
      <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2 space-y-8">
          <ModulesAccordion 
            projectId={projectId}
            modules={initialProject.modules} 
            onAddModule={handleAddModule}
            onEditModule={handleEditModule}
            onDeleteModule={handleDeleteModule}
            onModulePartsUpdate={handleModulePartsUpdate}
            onApproveModule={handleApproveModule}
           />
          <TimelineView events={initialProject.timelineEvents} />
        </div>

        <div className="space-y-8">
          <ProjectDocumentsCard 
            documents={initialProject.projectDocuments || []} 
            onAddDocument={handleAddDocument}
            />
          <RequirementsCard 
            projectId={projectId}
            requirements={initialProject.initialRequirements} 
            onAddModules={handleAddModulesFromAI}
            projectDescription={initialProject.description}
            onAddRequirement={handleAddRequirement}
            onEditRequirement={handleEditRequirement}
            onDeleteRequirement={handleDeleteRequirement}
          />
          <ChangeRequestsList 
            requests={initialProject.changeRequests} 
            onUpdateStatus={handleChangeRequestStatus}
          />
        </div>
      </div>
    </div>
  );
}
