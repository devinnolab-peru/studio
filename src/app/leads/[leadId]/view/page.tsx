
import { getLeadById, getRequirementsByLeadId } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Building, Mail, Phone, List, ListChecks, Palette, FileText, Briefcase } from 'lucide-react';

// Forzar renderizado dinámico para evitar 404 al recargar en Vercel
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const RequirementSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pl-12 space-y-2 text-sm">
            {children}
        </CardContent>
    </Card>
);

const RequirementItem = ({ label, value, isList = false }: { label: string, value: string | string[] | undefined | null, isList?: boolean }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
            <p className="font-semibold text-muted-foreground md:col-span-1">{label}:</p>
            <div className="md:col-span-3">
                {isList && Array.isArray(value) ? (
                    <ul className="list-disc list-inside space-y-1">
                        {value.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                ) : (
                    <p>{Array.isArray(value) ? value.join(', ') : value}</p>
                )}
            </div>
        </div>
    )
}

export default async function LeadViewPage({ params }: { params: { leadId: string } }) {
  const lead = await getLeadById(params.leadId);
  const requirements = await getRequirementsByLeadId(params.leadId);

  if (!lead) {
    notFound();
  }

  if (!requirements) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-3xl">
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle>Requerimientos no encontrados</CardTitle>
              <CardDescription>
                Los requerimientos para este lead aún no han sido enviados.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Si ya completaste el formulario, es posible que aún se esté procesando. 
                Por favor, intenta más tarde.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold">Tus Requerimientos</h1>
            <p className="text-muted-foreground mt-2">
                Enviado el {format(requirements.submittedAt, "PPP 'a las' p", { locale: es })}
            </p>
        </div>

        <div className="space-y-6">
            <RequirementSection title="Información de Contacto" icon={<User className="h-6 w-6 text-primary" />}>
                <RequirementItem label="Tipo de Cliente" value={requirements.contactInfo.clientType === 'empresa' ? 'Empresa' : 'Particular'} />
                <RequirementItem label="Nombre" value={requirements.contactInfo.name} />
                {requirements.contactInfo.clientType === 'empresa' && (
                    <RequirementItem label="Empresa" value={requirements.contactInfo.company} />
                )}
                <RequirementItem label="Email" value={requirements.contactInfo.email} />
                <RequirementItem label="Teléfono" value={requirements.contactInfo.phone} />
            </RequirementSection>

            <RequirementSection title="Sobre el Proyecto" icon={<Briefcase className="h-6 w-6 text-primary" />}>
                <RequirementItem label="Nombre del Proyecto" value={requirements.projectInfo.projectName} />
                <RequirementItem label="Idea / Problema" value={requirements.projectInfo.projectIdea} />
                <RequirementItem label="Público Objetivo" value={requirements.projectInfo.targetAudience} />
                <RequirementItem label="Objetivos Principales" value={requirements.projectInfo.mainGoals} isList />
                <RequirementItem label="Competidores" value={requirements.projectInfo.competitors} />
                <RequirementItem label="País" value={requirements.projectInfo.country || 'No especificado'} />
            </RequirementSection>

            <RequirementSection title="Alcance y Funcionalidades" icon={<ListChecks className="h-6 w-6 text-primary" />}>
                <RequirementItem label="Plataformas" value={requirements.scopeAndFeatures.platforms} isList />
                <RequirementItem label="Funcionalidades Comunes" value={requirements.scopeAndFeatures.commonFeatures} isList />
                <RequirementItem label="Otras Funcionalidades" value={requirements.scopeAndFeatures.otherFeatures} isList />
            </RequirementSection>
            
            <RequirementSection title="Diseño y Experiencia de Usuario" icon={<Palette className="h-6 w-6 text-primary" />}>
                 <RequirementItem label="Tiene Identidad de Marca" value={requirements.designAndUX.hasBrandIdentity === 'yes' ? 'Sí' : 'No'} />
                 <RequirementItem label="Inspiraciones" value={requirements.designAndUX.designInspirations.filter(i => i)} isList />
                 <RequirementItem label="Estilo Visual" value={requirements.designAndUX.lookAndFeel} />
            </RequirementSection>

             <RequirementSection title="Contenido y Estrategia" icon={<FileText className="h-6 w-6 text-primary" />}>
                 <RequirementItem label="Creación de Contenido" value={requirements.contentAndStrategy.contentCreation} />
                 <RequirementItem label="Plan de Marketing" value={requirements.contentAndStrategy.marketingPlan} />
                 <RequirementItem label="Mantenimiento" value={requirements.contentAndStrategy.maintenance} />
            </RequirementSection>

            {/* <RequirementSection title="Archivos Adjuntos" icon={<FileText className="h-6 w-6 text-primary" />}>
                {requirements.attachments && requirements.attachments.length > 0 ? (
                    <p>Archivos adjuntos aquí.</p>
                ) : (
                    <p className="text-muted-foreground">No se adjuntaron archivos.</p>
                )}
            </RequirementSection> */}
        </div>
    </div>
  );
}

