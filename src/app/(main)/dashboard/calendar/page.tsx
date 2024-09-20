import CalendarPage from './_components/calendar';
import { api } from '@/trpc/server';

export const dynamic = "force-dynamic";

export default async function Page() {

  const initialEvents = await api.calendar.myEvents.query({}) 

  const aiSuggestions = await api.aiSuggestions.myEvents.query({})

  return (
      <CalendarPage initialEvents={initialEvents} initialAiSuggestions={aiSuggestions} />
  );
}

