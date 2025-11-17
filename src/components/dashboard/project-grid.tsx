
'use client';
import { useState } from 'react';
import { getProjects } from '@/lib/data';
import PageHeader from '@/components/shared/page-header';
import ProjectCard from '@/components/dashboard/project-card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { Project } from '@/lib/definitions';
import { CreateProjectDialog } from '@/components/dashboard/create-project-dialog';
import { addProject, deleteProject } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ProjectGrid({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
    useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAddProject = async (newProjectData: Omit<Project, 'id' | 'shareableLinkId' | 'modules' | 'timelineEvents' | 'changeRequests' | 'initialRequirements' | 'projectDocuments'>) => {
    const result = await addProject(newProjectData);
    if (result.success && result.project) {
        // Optimistic update
        setProjects(prev => [result.project!, ...prev]);
        toast({
            title: 'Proyecto Creado',
            description: `El proyecto "${result.project.name}" ha sido creado.`,
        });
        setIsCreateProjectDialogOpen(false); // Close dialog on success
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo crear el proyecto.',
        });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    const result = await deleteProject(projectId);
    if (result.success) {
        // Optimistic update
        setProjects(prev => prev.filter(p => p.id !== projectId));
        toast({
            title: 'Proyecto Eliminado',
            description: `El proyecto "${project?.name}" ha sido eliminado.`,
        });
        router.refresh();
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'No se pudo eliminar el proyecto.',
        });
    }
  };

  return (
    <>
      <PageHeader
        title="Panel de Proyectos"
        description="Un resumen de todos tus proyectos en curso."
      >
        <Button onClick={() => setIsCreateProjectDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nuevo Proyecto
        </Button>
      </PageHeader>

      <div className="mt-8 grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} onDelete={handleDeleteProject} />
        ))}
      </div>
      <CreateProjectDialog
        isOpen={isCreateProjectDialogOpen}
        onClose={() => setIsCreateProjectDialogOpen(false)}
        onAddProject={handleAddProject}
      />
    </>
  );
}
