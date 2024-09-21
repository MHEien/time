import { env } from "@/env";

export interface SubscriptionPlan {
  name: string;
  description: string;
  features: string[];
  stripePriceId: string;
}

export const freePlan: SubscriptionPlan = {
  name: "Free",
  description: "The free plan is limited to 1 week of calendar items.",
  features: ["Up to 3 posts", "Limited support"],
  stripePriceId: "",
};

export const proPlan: SubscriptionPlan = {
  name: "Pro",
  description: "The Pro plan has unlimited calendar items.",
  features: ["Unlimited posts", "Priority support"],
  stripePriceId: env.STRIPE_PRO_MONTHLY_PLAN_ID,
};

export const subscriptionPlans = [freePlan, proPlan];
