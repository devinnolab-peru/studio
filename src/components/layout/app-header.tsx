'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { logout } from '@/lib/actions';
import type { User } from '@/lib/definitions';

export default function AppHeader({ user }: { user: User | null }) {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b bg-background px-4 sm:px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src="https://placehold.co/40x40" alt={user?.name || 'Admin'} data-ai-hint="person portrait" />
              <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.name || 'Cuenta de Administrador'}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/dashboard/configuracion" legacyBehavior>
            <DropdownMenuItem>Configuración</DropdownMenuItem>
          </Link>
          <DropdownMenuItem>Soporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
