import "server-only";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

// Re-export plan definitions for server convenience
export { PLANS, getPriceId } from "./plans";
export type { PlanId, PlanDef } from "./plans";
