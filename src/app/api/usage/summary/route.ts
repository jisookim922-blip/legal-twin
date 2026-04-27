import { neon } from "@neondatabase/serverless";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // This month
    const [monthStats] = (await sql`
      SELECT
        COUNT(*)::int as operation_count,
        COALESCE(SUM(estimated_minutes_saved), 0)::int as total_minutes,
        COALESCE(SUM(estimated_yen_value), 0)::int as total_yen
      FROM usage_logs
      WHERE user_id = ${userId}
        AND created_at >= date_trunc('month', CURRENT_DATE)
    `) as Array<{
      operation_count: number;
      total_minutes: number;
      total_yen: number;
    }>;

    // All time
    const [allStats] = (await sql`
      SELECT
        COUNT(*)::int as operation_count,
        COALESCE(SUM(estimated_minutes_saved), 0)::int as total_minutes,
        COALESCE(SUM(estimated_yen_value), 0)::int as total_yen
      FROM usage_logs
      WHERE user_id = ${userId}
    `) as Array<{
      operation_count: number;
      total_minutes: number;
      total_yen: number;
    }>;

    // By operation type (this month)
    const byOperation = (await sql`
      SELECT
        operation,
        COUNT(*)::int as count,
        COALESCE(SUM(estimated_minutes_saved), 0)::int as minutes,
        COALESCE(SUM(estimated_yen_value), 0)::int as yen
      FROM usage_logs
      WHERE user_id = ${userId}
        AND created_at >= date_trunc('month', CURRENT_DATE)
      GROUP BY operation
      ORDER BY count DESC
    `) as Array<{
      operation: string;
      count: number;
      minutes: number;
      yen: number;
    }>;

    // Pro subscription cost (30,000 / month)
    const proPrice = 30000;
    const monthROI =
      monthStats.total_yen > 0
        ? Math.round((monthStats.total_yen / proPrice) * 10) / 10
        : 0;

    return Response.json({
      thisMonth: {
        operations: monthStats.operation_count,
        minutesSaved: monthStats.total_minutes,
        yenValue: monthStats.total_yen,
        roi: monthROI,
      },
      allTime: {
        operations: allStats.operation_count,
        minutesSaved: allStats.total_minutes,
        yenValue: allStats.total_yen,
      },
      byOperation,
    });
  } catch (error) {
    console.error("Usage summary error:", error);
    return Response.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
