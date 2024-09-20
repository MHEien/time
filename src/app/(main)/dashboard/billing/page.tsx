import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ExclamationTriangleIcon } from "@/components/icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { env } from "@/env";
import { validateRequest } from "@/lib/auth/validate-request";
import { APP_TITLE } from "@/lib/constants";
import { api } from "@/trpc/server";
import * as React from "react";
import { Billing } from "./_components/billing";
import { BillingSkeleton } from "./_components/billing-skeleton";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: "Billing",
  description: "Manage your billing and subscription",
};

export default async function BillingPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/signin");
  }

  const stripePromises = Promise.all([api.stripe.getPlans.query(), api.stripe.getPlan.query()]);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your billing and subscription</p>
      </div>
      <React.Suspense fallback={<BillingSkeleton />}>
        <Billing stripePromises={stripePromises} />
      </React.Suspense>
    </div>
  );
}
