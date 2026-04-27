import { neon } from "@neondatabase/serverless";

const sql = () => neon(process.env.DATABASE_URL!);

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface UserSubscription {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: "trial" | "solo" | "pro" | "elite";
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
}

const TRIAL_DAYS = 14;

export async function getOrCreateSubscription(
  userId: string
): Promise<UserSubscription> {
  const db = sql();
  const existing = (await db`
    SELECT * FROM subscriptions WHERE user_id = ${userId} LIMIT 1
  `) as Array<{
    user_id: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    plan: string;
    status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
  }>;

  if (existing.length > 0) {
    const row = existing[0];
    return {
      userId: row.user_id,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      plan: row.plan as UserSubscription["plan"],
      status: row.status as SubscriptionStatus,
      trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at) : null,
      currentPeriodEnd: row.current_period_end
        ? new Date(row.current_period_end)
        : null,
    };
  }

  // Create new trial
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  await db`
    INSERT INTO subscriptions (user_id, plan, status, trial_ends_at)
    VALUES (${userId}, 'trial', 'trialing', ${trialEnd.toISOString()})
  `;

  return {
    userId,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    plan: "trial",
    status: "trialing",
    trialEndsAt: trialEnd,
    currentPeriodEnd: null,
  };
}

export async function updateSubscription(
  userId: string,
  updates: Partial<{
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    plan: string;
    status: string;
    currentPeriodEnd: Date;
  }>
) {
  const db = sql();
  const fields: string[] = [];
  const setters: Record<string, string | Date> = {};
  if (updates.stripeCustomerId !== undefined) {
    setters.stripe_customer_id = updates.stripeCustomerId;
  }
  if (updates.stripeSubscriptionId !== undefined) {
    setters.stripe_subscription_id = updates.stripeSubscriptionId;
  }
  if (updates.plan !== undefined) setters.plan = updates.plan;
  if (updates.status !== undefined) setters.status = updates.status;
  if (updates.currentPeriodEnd !== undefined) {
    setters.current_period_end = updates.currentPeriodEnd;
  }

  for (const key of Object.keys(setters)) fields.push(key);

  // Use individual parameterized updates (neon doesn't support dynamic set)
  if (updates.stripeCustomerId !== undefined) {
    await db`UPDATE subscriptions SET stripe_customer_id = ${updates.stripeCustomerId}, updated_at = NOW() WHERE user_id = ${userId}`;
  }
  if (updates.stripeSubscriptionId !== undefined) {
    await db`UPDATE subscriptions SET stripe_subscription_id = ${updates.stripeSubscriptionId}, updated_at = NOW() WHERE user_id = ${userId}`;
  }
  if (updates.plan !== undefined) {
    await db`UPDATE subscriptions SET plan = ${updates.plan}, updated_at = NOW() WHERE user_id = ${userId}`;
  }
  if (updates.status !== undefined) {
    await db`UPDATE subscriptions SET status = ${updates.status}, updated_at = NOW() WHERE user_id = ${userId}`;
  }
  if (updates.currentPeriodEnd !== undefined) {
    await db`UPDATE subscriptions SET current_period_end = ${updates.currentPeriodEnd.toISOString()}, updated_at = NOW() WHERE user_id = ${userId}`;
  }
}

export async function getSubscriptionByCustomerId(
  customerId: string
): Promise<UserSubscription | null> {
  const db = sql();
  const rows = (await db`
    SELECT * FROM subscriptions WHERE stripe_customer_id = ${customerId} LIMIT 1
  `) as Array<{
    user_id: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    plan: string;
    status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
  }>;

  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    plan: row.plan as UserSubscription["plan"],
    status: row.status as SubscriptionStatus,
    trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at) : null,
    currentPeriodEnd: row.current_period_end
      ? new Date(row.current_period_end)
      : null,
  };
}

export function isActiveSubscription(sub: UserSubscription): boolean {
  if (sub.status === "active") return true;
  if (sub.status === "trialing") {
    if (!sub.trialEndsAt) return false;
    return sub.trialEndsAt.getTime() > Date.now();
  }
  return false;
}

export function hasProAccess(sub: UserSubscription): boolean {
  if (!isActiveSubscription(sub)) return false;
  return (
    sub.plan === "pro" ||
    sub.plan === "elite" ||
    sub.plan === "trial" // trial gets full access
  );
}
