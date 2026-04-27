import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe, PLANS, getPriceId, type PlanId } from "@/lib/stripe";
import {
  getOrCreateSubscription,
  updateSubscription,
} from "@/lib/subscription";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan }: { plan: PlanId } = await req.json();
  if (!PLANS[plan]) {
    return Response.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = getPriceId(plan);
  if (!priceId) {
    return Response.json(
      {
        error: `Price ID not configured for ${plan}. Set ${PLANS[plan].priceIdEnv} in Vercel env.`,
      },
      { status: 500 }
    );
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  // Get or create subscription record
  const sub = await getOrCreateSubscription(userId);

  let customerId = sub.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await updateSubscription(userId, { stripeCustomerId: customerId });
  }

  const origin = req.headers.get("origin") ?? "https://legal-twin.vercel.app";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { userId, plan },
    },
    success_url: `${origin}/app?upgraded=1`,
    cancel_url: `${origin}/pricing`,
    allow_promotion_codes: true,
    locale: "ja",
  });

  return Response.json({ url: session.url });
}
