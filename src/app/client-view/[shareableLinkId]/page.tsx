
import { getProjectById } from '@/lib/data';
import { notFound } from 'next/navigation';
import ClientPortalView from '@/components/client/client-portal-view';

// Forzar renderizado dinámico para evitar 404 al recargar en Vercel
export const dynamic = 'force-dynamic';

export default async function ClientViewPage({
  params,
}: {
  params: { shareableLinkId: string };
}) {
  const projects = await getProjectById(params.shareableLinkId, true);

  if (!projects || projects.length === 0) {
    notFound();
  }
  const project = projects[0];

  return (
    <div className="bg-background min-h-screen">
      <ClientPortalView project={project} />
    </div>
  );
}
