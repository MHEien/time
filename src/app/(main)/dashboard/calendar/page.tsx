import CalendarComponent from "../_components/calendar";
import { api } from '@/trpc/server';

export default async function CalendarPage() {

  const initialEvents = await api.calendar.myEvents.query({}) 

  const aiSuggestions = await api.aiSuggestions.myEvents.query({})

  return (
      <CalendarComponent initialEvents={initialEvents} initialAiSuggestions={aiSuggestions} />
  );
}