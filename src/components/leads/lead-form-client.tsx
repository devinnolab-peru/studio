
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  FolderKanban,
  CaseUpper,
  ShoppingCart,
  Smartphone,
  AppWindow,
  PencilRuler,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import ProjectRequirementsForm from '@/components/leads/project-requirements-form';
import Link from 'next/link';

const PROJECT_TYPES = [
  {
    id: 'web',
    label: 'Sitio Web Corporativo / Landing Page',
    icon: <CaseUpper />,
  },
  {
    id: 'movil',
    label: 'Aplicación Móvil (iOS/Android)',
    icon: <Smartphone />,
  },
  {
    id: 'software',
    label: 'Software a Medida / SaaS',
    icon: <AppWindow />,
  },
  {
    id: 'ecommerce',
    label: 'Tienda en Línea / E-commerce',
    icon: <ShoppingCart />,
  },
  {
    id: 'otro',
    label: 'Otro tipo de desarrollo personalizado',
    icon: <PencilRuler />,
  },
];

export default function LeadFormClient({ leadId }: { leadId: string }) {
  const [projectType, setProjectType] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-3xl">
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle>¡Gracias!</CardTitle>
              <CardDescription>
                Hemos recibido tus requerimientos.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Revisaremos la información que enviaste y nos pondremos en
                contacto contigo muy pronto para discutir los siguientes pasos.
              </p>
              <div className="pt-4">
                <Link href={`/leads/${leadId}/view`}>
                  <Button>
                    Ver mis requerimientos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!projectType) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-3xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <FolderKanban className="mb-4 h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Bienvenido a ProPlanner
            </h1>
            <p className="text-muted-foreground">
              Para empezar, cuéntanos qué tipo de proyecto tienes en mente.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Paso 1: ¿Qué tipo de proyecto es?</CardTitle>
              <CardDescription>
                Selecciona una opción para que podamos adaptar las siguientes
                preguntas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={projectType}
                onValueChange={setProjectType}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                {PROJECT_TYPES.map((type) => (
                  <Label
                    key={type.id}
                    htmlFor={type.id}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <RadioGroupItem
                      value={type.id}
                      id={type.id}
                      className="sr-only"
                    />
                    <div className="mb-2">{type.icon}</div>
                    <span className="text-center text-sm font-medium">
                      {type.label}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ProjectRequirementsForm
      leadId={leadId}
      projectType={projectType}
      onBack={() => setProjectType('')}
      onSubmitSuccess={() => setIsSubmitted(true)}
    />
  );
}
