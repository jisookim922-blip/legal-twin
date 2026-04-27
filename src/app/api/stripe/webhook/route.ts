import { stripe } from "@/lib/stripe";
import {
  updateSubscription,
  getSubscriptionByCustomerId,
} from "@/lib/subscription";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return Response.json(
      { error: "Missing signature or secret" },
      { status: 400 }
    );
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return Response.json(
      { error: `Webhook signature verification failed: ${err}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          await updateSubscription(userId, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: plan ?? "pro",
            status: subscription.status,
            currentPeriodEnd: new Date(
              (subscription.items.data[0]?.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000
            ),
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const sub = await getSubscriptionByCustomerId(customerId);
        if (sub) {
          const priceId = subscription.items.data[0]?.price.id;
          let plan = sub.plan;
          if (priceId === process.env.STRIPE_PRICE_ID_SOLO) plan = "solo";
          if (priceId === process.env.STRIPE_PRICE_ID_PRO) plan = "pro";
          if (priceId === process.env.STRIPE_PRICE_ID_ELITE) plan = "elite";

          await updateSubscription(sub.userId, {
            stripeSubscriptionId: subscription.id,
            plan,
            status: subscription.status,
            currentPeriodEnd: new Date(
              (subscription.items.data[0]?.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000
            ),
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const sub = await getSubscriptionByCustomerId(customerId);
        if (sub) {
          await updateSubscription(sub.userId, {
            status: "canceled",
            plan: "trial",
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return Response.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
