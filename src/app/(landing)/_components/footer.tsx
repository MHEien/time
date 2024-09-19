import { CodeIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/components/theme-toggle";


const workflowAiUrl = "https://heien.dev";

export const Footer = () => {
  const currentYear = new Date().getFullYear(); // Get the current year

  return (
    <footer className="bg-gray-900 px-4 py-6">
      <div className="container flex items-center p-0">
        <p>{currentYear} <a href={workflowAiUrl} className="text-blue-400 hover:underline">heien.dev</a></p>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
};
