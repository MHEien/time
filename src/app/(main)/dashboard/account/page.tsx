import { redirect } from "next/navigation";
import { Paths } from "@/lib/constants";
import { api } from "@/trpc/server";
import { Account } from "./_components/account";

export default async function AccountPage() {

  const user = await api.user.get.query()

  if (!user) redirect(Paths.Login);

  return (
    <main className="container mx-auto min-h-screen p-4">
      <Account initialUser={user} />
    </main>
  );
}
