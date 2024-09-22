import CalendarPage from './_components/calendar';
import { api } from '@/trpc/server';

export const dynamic = "force-dynamic";
export const runtime = 'edge';
export default async function Page() {

  //Start date is 3 months ago
  const startDate = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString();
  //End date is 2 months from today
  const endDate = new Date(new Date().setDate(new Date().getDate() + 14)).toISOString();

  const initialEvents = await api.calendar.getByDateRange.query({
    startDate,
    endDate
  }) 

  const aiSuggestions = await api.aiSuggestions.myEvents.query({})

  return (
      <CalendarPage initialEvents={initialEvents} initialAiSuggestions={aiSuggestions} />
  );
}

