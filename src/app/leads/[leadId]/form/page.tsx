
import { getLeadById } from '@/lib/data';
import { notFound } from 'next/navigation';
import LeadFormClient from '@/components/leads/lead-form-client';

// Forzar renderizado dinámico para evitar 404 al recargar en Vercel
export const dynamic = 'force-dynamic';

export default async function LeadFormPage({ params }: { params: { leadId: string } }) {
  const lead = await getLeadById(params.leadId);

  if (!lead) {
    notFound();
  }

  return <LeadFormClient leadId={params.leadId} />;
}
