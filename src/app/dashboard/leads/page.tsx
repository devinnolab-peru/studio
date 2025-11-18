
import { getClientRequirements, getLeads } from '@/lib/data';
import LeadsClientPage from '@/components/leads/leads-client-page';

export default async function LeadsPage() {
    try {
        const leadsData = await getLeads();
        const reqsData = await getClientRequirements();

        return <LeadsClientPage initialLeads={leadsData} initialRequirements={reqsData} />;
    } catch (error) {
        console.error('Error loading leads:', error);
        // Retornar página con datos vacíos en caso de error
        return <LeadsClientPage initialLeads={[]} initialRequirements={[]} />;
    }
}
