'use client';
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderKanban, Loader2 } from 'lucide-react';
import { login } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Iniciando Sesión...
        </>
      ) : (
        'Iniciar Sesión'
      )}
    </Button>
  );
}


export default function LoginPage() {
  const [state, dispatch] = useActionState(login, undefined);
  const { toast } = useToast();

   useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Error de Inicio de Sesión',
        description: state.error,
      });
    }
  }, [state, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <FolderKanban className="mb-4 h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">ProPlanner</h1>
          <p className="text-muted-foreground">
            Gestión de proyectos, simplificada.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Acceso de Administrador</CardTitle>
            <CardDescription>
              Introduce tus credenciales para acceder al panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={dispatch} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <LoginButton />
               {state?.error && (
                <p className="text-sm font-medium text-destructive text-center">
                  {state.error}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
