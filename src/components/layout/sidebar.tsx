import Link from 'next/link';
import { FolderKanban, LayoutDashboard, Settings, Users } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r bg-card sm:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <FolderKanban className="h-6 w-6 text-primary" />
          <span>ProPlanner</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <LayoutDashboard className="h-4 w-4" />
          Panel
        </Link>
        <Link
          href="/dashboard/leads"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <Users className="h-4 w-4" />
          Leads
        </Link>
        <Link
          href="/dashboard/configuracion"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <Settings className="h-4 w-4" />
          Configuración
        </Link>
      </nav>
    </aside>
  );
}
