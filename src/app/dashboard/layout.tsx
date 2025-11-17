import AppHeader from '@/components/layout/app-header';
import { Sidebar } from '@/components/layout/sidebar';
import { getCurrentUser } from '@/lib/actions';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 flex flex-col sm:ml-0">
            <AppHeader user={user} />
            <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-16 sm:pt-4">
              {children}
            </div>
        </main>
      </div>
    </div>
  );
}
