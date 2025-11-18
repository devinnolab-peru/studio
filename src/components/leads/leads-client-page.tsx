
'use client';
import { useState } from 'react';
import type { Lead, ClientRequirements } from '@/lib/definitions';
import PageHeader from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Mail, Copy, Eye, Trash2 } from 'lucide-react';
import FileText from '@/components/shared/FileText';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import StatusBadge from '@/components/shared/status-badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createLead, deleteLead } from '@/lib/actions';
import { CreateLeadDialog } from '@/components/leads/create-lead-dialog';
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
import { useRouter } from 'next/navigation';

export default function LeadsClientPage({ initialLeads, initialRequirements }: { initialLeads: Lead[], initialRequirements: ClientRequirements[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [requirements, setRequirements] = useState<ClientRequirements[]>(initialRequirements);
  const [isCreateLeadDialogOpen, setIsCreateLeadDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'formLink' | 'status'>) => {
    const result = await createLead(leadData);
    if (result.success && result.lead) {
        setLeads(prev => [result.lead!, ...prev]);
        toast({
            title: 'Lead Creado',
            description: 'Se ha creado un nuevo lead y se ha añadido a la lista.',
        });
        setIsCreateLeadDialogOpen(false);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'No se pudo crear el lead.',
        });
    }
  };

  const copyToClipboard = (link: string) => {
    const fullLink = `${window.location.origin}${link}`;
    navigator.clipboard.writeText(fullLink);
    toast({
      title: '¡Enlace Copiado!',
      description: 'El enlace del formulario ha sido copiado a tu portapapeles.',
    });
  };

  const hasSubmittedRequirements = (leadId: string) => {
      return !!requirements.find(req => req.leadId === leadId);
  }

  const handleDeleteLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    const result = await deleteLead(leadId);
    if (result.success) {
        // Optimistic update
        setLeads(prev => prev.filter(l => l.id !== leadId));
        setRequirements(prev => prev.filter(r => r.leadId !== leadId));
        toast({
            title: 'Lead Eliminado',
            description: `El lead "${lead?.name}" ha sido eliminado.`,
        });
        router.refresh();
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'No se pudo eliminar el lead.',
        });
    }
  };

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Leads"
        description="Gestiona tus clientes potenciales y sus requerimientos."
      >
        <Button onClick={() => setIsCreateLeadDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nuevo Lead
        </Button>
      </PageHeader>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
          <CardDescription>
            Un listado de todos los clientes potenciales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay leads disponibles. Crea tu primer lead para comenzar.</p>
            </div>
          ) : (
            <>
          {/* Mobile Cards View */}
          <div className="block sm:hidden space-y-4">
            {leads.map((lead) => (
              <Card key={lead.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.company}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                      </div>
                      <StatusBadge status={lead.status as any} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Creado: {format(lead.createdAt, 'PPP', { locale: es })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" title="Enviar enlace por correo">
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                      <Button variant="ghost" size="sm" title="Copiar enlace" onClick={() => copyToClipboard(lead.formLink)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                      <Link 
                        href={hasSubmittedRequirements(lead.id) ? `/leads/${lead.id}/view` : lead.formLink} 
                        target="_blank"
                      >
                        <Button variant="ghost" size="sm" title="Ver formulario o requerimientos">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </Link>
                      <Link href={`/dashboard/leads/${lead.id}/requirements`}>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!hasSubmittedRequirements(lead.id)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Requerimientos
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el lead "{lead.name}" y todos sus datos asociados, incluyendo los requerimientos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteLead(lead.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado el</TableHead>
                <TableHead>Formulario</TableHead>
                <TableHead>Requerimientos</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.company}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status as any} />
                  </TableCell>
                  <TableCell>
                    {format(lead.createdAt, 'PPP', { locale: es })}
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Enviar enlace por correo">
                        <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Copiar enlace del formulario" onClick={() => copyToClipboard(lead.formLink)}>
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Link 
                      href={hasSubmittedRequirements(lead.id) ? `/leads/${lead.id}/view` : lead.formLink} 
                      target="_blank"
                    >
                      <Button variant="ghost" size="icon" title="Ver formulario o requerimientos">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/leads/${lead.id}/requirements`} passHref legacyBehavior>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!hasSubmittedRequirements(lead.id)}
                            aria-disabled={!hasSubmittedRequirements(lead.id)}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Requerimientos
                        </Button>
                    </Link>
                  </TableCell>
                  <TableCell>
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
                            Esta acción no se puede deshacer. Se eliminará permanentemente el lead "{lead.name}" y todos sus datos asociados, incluyendo los requerimientos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteLead(lead.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
            </>
          )}
        </CardContent>
      </Card>
       <CreateLeadDialog
        isOpen={isCreateLeadDialogOpen}
        onClose={() => setIsCreateLeadDialogOpen(false)}
        onAddLead={handleCreateLead}
      />
    </div>
  );
}
