import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { env } from "@/env";
import { validateRequest } from "@/lib/auth/validate-request";
import IntegrationsComponent from "../_components/integrations";
import { ApiKeys } from "@/app/(main)/dashboard/_components/settings/api-keys";
import { api } from "@/trpc/server";
import type { Integration } from "../_components/integrations";
export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: "Integrations",
  description: "Manage your integrations and API keys",
};

export default async function IntegrationsPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/signin");
  }

  const apiKeys = await api.apiKey.myApiKeys.query({});
  const myIntegrations = await api.integrationTokens.myOauthAccounts.query({});

  const initialIntegrations = [
    {
      name: 'GitHub',
      value: 'github',
      icon: 'GithubIcon',
      connected: myIntegrations.some(integration => integration.provider === 'github'),
    },
    {
      name: 'Microsoft 365',
      value: 'entraId',
      icon: 'MicrosoftIcon',
      connected: myIntegrations.some(integration => integration.provider === 'entraId'),
    },
    {
      name: 'Discord',
      value: 'discord',
      icon: 'DiscordIcon',
      connected: myIntegrations.some(integration => integration.provider === 'discord'),
    },
    {
      name: 'Wakatime',
      value: 'wakatime',
      icon: 'WakatimeIcon',
      connected: myIntegrations.some(integration => integration.provider === 'wakatime'),
      customForm: true,
    },
  ] as Integration[]

  return (
    <div className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <IntegrationsComponent initialIntegrations={initialIntegrations} />
      <ApiKeys initialKeys={apiKeys} />
    </div>
  );
}