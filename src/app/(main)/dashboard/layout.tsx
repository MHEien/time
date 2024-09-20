import { DashboardNav } from "./_components/dashboard-nav"
import { VerificiationWarning } from "./_components/verificiation-warning"
import { Header } from "./_components/header"
import { api } from "@/trpc/server"

interface Props {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {


  const user = await api.user.get.query()


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Header initialUser={user} />
      <div className="flex flex-col gap-6 md:flex-row lg:gap-10 p-6">
        <DashboardNav className="flex-shrink-0 md:w-64 lg:w-80 flex flex-col gap-2" />
        <main className="w-full space-y-4">
          <VerificiationWarning />
          <div>{children}</div>
        </main>
      </div>
    </div>
  )
}

export const dynamic = "force-dynamic";