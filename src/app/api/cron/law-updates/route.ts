import { neon } from "@neondatabase/serverless";

/**
 * Cron job: Check for law updates from e-Gov.
 * Runs weekly (Mondays 03:00 UTC = 12:00 JST).
 *
 * For now, just records a check timestamp. Full implementation would:
 * 1. Fetch latest amendments from e-Gov 法令API
 * 2. Compare with last known versions
 * 3. Insert new entries into law_updates
 * 4. Notify users whose past_documents reference affected laws
 */
export async function GET(req: Request) {
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

  // Placeholder: log the cron run
  await sql`
    INSERT INTO law_updates (
      law_id, law_name, change_type, summary
    ) VALUES (
      ${"system_cron_check"},
      ${"システム定期チェック"},
      ${"check"},
      ${`Law update check ran at ${new Date().toISOString()}`}
    )
  `;

  // TODO: Real e-Gov polling logic
  // const recentLaws = await fetchRecentLawAmendments();
  // for (const law of recentLaws) {
  //   await sql`INSERT INTO law_updates ... ON CONFLICT DO NOTHING`;
  // }

  return Response.json({ checked: true, at: new Date().toISOString() });
}
