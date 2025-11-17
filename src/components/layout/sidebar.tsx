'use client';

import Link from 'next/link';
import { FolderKanban, LayoutDashboard, Settings, Users, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link
        href="/dashboard"
        onClick={() => setIsOpen(false)}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <LayoutDashboard className="h-4 w-4" />
        Panel
      </Link>
      <Link
        href="/dashboard/leads"
        onClick={() => setIsOpen(false)}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <Users className="h-4 w-4" />
        Leads
      </Link>
      <Link
        href="/dashboard/configuracion"
        onClick={() => setIsOpen(false)}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <Settings className="h-4 w-4" />
        Configuración
      </Link>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="sm:hidden fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold" onClick={() => setIsOpen(false)}>
              <FolderKanban className="h-6 w-6 text-primary" />
              <span>ProPlanner</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-2 p-4">
            <NavLinks />
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <FolderKanban className="h-6 w-6 text-primary" />
            <span>ProPlanner</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          <NavLinks />
        </nav>
      </aside>
    </>
  );
}
