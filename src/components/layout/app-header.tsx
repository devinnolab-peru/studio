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
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-end gap-2 sm:gap-4 border-b bg-background px-3 sm:px-4 md:px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
              <AvatarImage src="https://placehold.co/40x40" alt={user?.name || 'Admin'} data-ai-hint="person portrait" />
              <AvatarFallback className="text-xs sm:text-sm">{user?.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 sm:w-56">
          <DropdownMenuLabel className="text-sm sm:text-base">{user?.name || 'Cuenta de Administrador'}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/dashboard/configuracion" legacyBehavior>
            <DropdownMenuItem className="text-sm sm:text-base">Configuración</DropdownMenuItem>
          </Link>
          <DropdownMenuItem className="text-sm sm:text-base">Soporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-sm sm:text-base">
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
