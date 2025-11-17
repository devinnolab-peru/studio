
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Project } from '@/lib/definitions';
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (newProject: Omit<Project, 'id' | 'shareableLinkId' | 'modules' | 'timelineEvents' | 'changeRequests' | 'initialRequirements' | 'projectDocuments'>) => Promise<void>;
}

export function CreateProjectDialog({ isOpen, onClose, onAddProject }: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (name && description && startDate && deadline) {
      setIsSubmitting(true);
      await onAddProject({
        name,
        description,
        startDate,
        deadline,
        status: 'Planificación'
      });
      setIsSubmitting(false);
      onClose();
      // Reset fields
      setName('');
      setDescription('');
      setStartDate(undefined);
      setDeadline(undefined);
    } else {
        alert('Por favor, rellene todos los campos');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Crear Nuevo Proyecto</DialogTitle>
          <DialogDescription className="text-sm">
            Rellene los detalles a continuación para crear un nuevo proyecto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="name" className="sm:text-right">
              Nombre
            </Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-1 sm:col-span-3" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="description" className="sm:text-right">
              Descripción
            </Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-1 sm:col-span-3" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="start-date" className="sm:text-right">
              Fecha de Inicio
            </Label>
             <Popover>
                <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal col-span-1 sm:col-span-3",
                    !startDate && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    locale={es}
                />
                </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="deadline" className="sm:text-right">
              Fecha Límite
            </Label>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal col-span-1 sm:col-span-3",
                    !deadline && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                    locale={es}
                />
                </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Proyecto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
