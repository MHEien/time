import { CodeIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/components/theme-toggle";

const githubUrl = "https://github.com/MHeien/time";
const linkedInUrl = "https://www.linkedin.com/in/markusheien/";

export const Footer = () => {
  return (
    <footer className="bg-gray-900 px-4 py-6">
      <div className="container flex items-center p-0">
      <p>&copy; 2023 WorkflowAI. All rights reserved.</p>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
};
