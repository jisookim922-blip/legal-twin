import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateSubscription } from "@/lib/subscription";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await getOrCreateSubscription(userId);
  if (!sub.stripeCustomerId) {
    return Response.json(
      { error: "No Stripe customer found. Please subscribe first." },
      { status: 400 }
    );
  }

  const origin = req.headers.get("origin") ?? "https://legal-twin.vercel.app";

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${origin}/app`,
  });

  return Response.json({ url: session.url });
}
