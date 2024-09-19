import { DashboardNav } from "./_components/dashboard-nav";
import { VerificiationWarning } from "./_components/verificiation-warning";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { SparklesCore } from "@/components/ui/sparkles";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="flex flex-col gap-6 md:flex-row lg:gap-10">
            <DashboardNav className="flex-shrink-0 md:w-64 lg:w-80" />
            <main className="w-full space-y-4">
              <VerificiationWarning />
              <div>{children}</div>
            </main>
          </div>
    </div>
  );
}