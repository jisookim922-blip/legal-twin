import { neon } from "@neondatabase/serverless";
import { trialEndingEmailHtml, sendEmail } from "@/lib/email";

/**
 * Cron job: Send reminder emails to users whose trial is ending soon.
 * Runs daily at 09:00 JST (00:00 UTC).
 *
 * Triggered by Vercel Cron via vercel.json `crons` config.
 * Authentication: CRON_SECRET in Authorization header.
 */
export async function GET(req: Request) {
  // Verify Vercel Cron auth — requires CRON_SECRET to be set
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET) {
    return Response.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 }
    );
  }
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://legal-twin.vercel.app";

  // Find subscriptions ending in 3 days or 1 day
  const targets = (await sql`
    SELECT user_id, trial_ends_at
    FROM subscriptions
    WHERE status = 'trialing'
      AND trial_ends_at IS NOT NULL
      AND (
        (trial_ends_at::date = (CURRENT_DATE + INTERVAL '3 days')::date)
        OR (trial_ends_at::date = (CURRENT_DATE + INTERVAL '1 day')::date)
      )
  `) as Array<{ user_id: string; trial_ends_at: string }>;

  let sent = 0;
  // Note: To get the user's email, we need to call Clerk API.
  // For now, log the action; full implementation requires Clerk Admin API.
  for (const t of targets) {
    const daysLeft = Math.ceil(
      (new Date(t.trial_ends_at).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    // Fetch user email from Clerk Admin API
    try {
      const clerkRes = await fetch(
        `https://api.clerk.com/v1/users/${t.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        }
      );
      if (!clerkRes.ok) continue;
      const user = (await clerkRes.json()) as {
        email_addresses?: Array<{ email_address: string }>;
      };
      const email = user.email_addresses?.[0]?.email_address;
      if (!email) continue;

      await sendEmail({
        to: email,
        subject: `LegalTwin 無料トライアル終了まで残り ${daysLeft} 日`,
        html: trialEndingEmailHtml(daysLeft, siteUrl),
      });
      sent++;
    } catch (e) {
      console.error("Trial reminder failed:", t.user_id, e);
    }
  }

  return Response.json({ targets: targets.length, sent });
}
