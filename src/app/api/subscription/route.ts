import { auth } from "@clerk/nextjs/server";
import { getOrCreateSubscription, hasProAccess } from "@/lib/subscription";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await getOrCreateSubscription(userId);
  const proAccess = hasProAccess(sub);

  return Response.json({
    plan: sub.plan,
    status: sub.status,
    trialEndsAt: sub.trialEndsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    hasProAccess: proAccess,
    trialDaysLeft:
      sub.status === "trialing" && sub.trialEndsAt
        ? Math.max(
            0,
            Math.ceil(
              (sub.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          )
        : null,
  });
}
