import CalendarComponent from "../_components/calendar";
import GenerateSuggestion from "../_components/generate-suggestion";

export default function CalendarPage() {
  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <GenerateSuggestion />
      <h1 className="text-3xl font-bold mb-6">Calendar</h1>

      <CalendarComponent />
    </div>
  );
}