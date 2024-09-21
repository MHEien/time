import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { env } from "@/env";
import { validateRequest } from "@/lib/auth/validate-request";
import IntegrationsComponent from "../_components/integrations";
import { ApiKeys } from "@/app/(main)/dashboard/_components/settings/api-keys";
import { api } from "@/trpc/server";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: "Billing",
  description: "Manage your billing and subscription",
};

export default async function BillingPage() {
  const { user } = await validateRequest();

  const apiKeys = await api.apiKey.myApiKeys.query({})

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
    <IntegrationsComponent />
    <ApiKeys initialKeys={apiKeys} />
    </div>
  );
}