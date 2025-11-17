'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/definitions';
import { ArrowRight, Trash2 } from 'lucide-react';
import StatusBadge from '../shared/status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ProjectCardProps {
  project: Project;
  onDelete?: (projectId: string) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
    const completedModules = project.modules.filter(m => m.status === 'Completado').length;
    const totalModules = project.modules.length;
    const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-bold">{project.name}</CardTitle>
            <div className="flex items-center gap-2">
              <StatusBadge status={project.status as any} />
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto "{project.name}" y todos sus datos asociados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(project.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
        </div>
        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progreso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} aria-label={`${Math.round(progress)}% completado`} />
          <div className="mt-2 text-sm text-muted-foreground">
            {completedModules} de {totalModules} módulos completados.
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/dashboard/projects/${project.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            Ver Detalles
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
