import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = () => neon(process.env.DATABASE_URL!);

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = sql();

  // Aggregate from audit_logs (this month)
  const [thisMonth] = (await db`
    SELECT
      COUNT(*)::int as total_operations,
      COUNT(DISTINCT case_id)::int as cases_touched,
      AVG(duration_ms)::int as avg_duration_ms,
      SUM(pii_detected_count)::int as total_pii_masked,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END)::int as error_count,
      SUM(CASE WHEN confidential_mode THEN 1 ELSE 0 END)::int as confidential_ops
    FROM audit_logs
    WHERE user_id = ${userId}
      AND created_at >= date_trunc('month', CURRENT_DATE)
  `) as Array<{
    total_operations: number;
    cases_touched: number;
    avg_duration_ms: number | null;
    total_pii_masked: number;
    error_count: number;
    confidential_ops: number;
  }>;

  // Operations breakdown
  const byOperation = (await db`
    SELECT operation, COUNT(*)::int as count, AVG(duration_ms)::int as avg_ms
    FROM audit_logs
    WHERE user_id = ${userId}
      AND created_at >= date_trunc('month', CURRENT_DATE)
    GROUP BY operation
    ORDER BY count DESC
  `) as Array<{ operation: string; count: number; avg_ms: number | null }>;

  // PII types detected
  const piiBreakdown = (await db`
    SELECT pii_type, COUNT(*)::int as count
    FROM audit_logs, unnest(pii_types) as pii_type
    WHERE user_id = ${userId}
      AND created_at >= date_trunc('month', CURRENT_DATE)
    GROUP BY pii_type
    ORDER BY count DESC
  `) as Array<{ pii_type: string; count: number }>;

  // Knowledge base totals
  const [knowledge] = (await db`
    SELECT
      (SELECT COUNT(*) FROM past_documents WHERE user_id = ${userId})::int as past_docs,
      (SELECT COUNT(*) FROM court_cases)::int as court_cases,
      (SELECT COUNT(*) FROM official_guidelines)::int as guidelines
  `) as Array<{ past_docs: number; court_cases: number; guidelines: number }>;

  // Hallucination tracking from model_evaluations
  const [evalStats] = (await db`
    SELECT
      COUNT(*)::int as total_reviews,
      AVG(overall_score)::int as avg_score,
      SUM(critical_issues_count)::int as critical_issues,
      SUM(hallucination_count)::int as hallucinations,
      SUM(citations_total)::int as citations_total,
      SUM(citations_suspicious)::int as citations_suspicious
    FROM model_evaluations
    WHERE user_id = ${userId}
      AND created_at >= date_trunc('month', CURRENT_DATE)
  `) as Array<{
    total_reviews: number;
    avg_score: number | null;
    critical_issues: number;
    hallucinations: number;
    citations_total: number;
    citations_suspicious: number;
  }>;

  return Response.json({
    thisMonth: {
      operations: thisMonth.total_operations,
      casesTouched: thisMonth.cases_touched,
      avgDurationMs: thisMonth.avg_duration_ms ?? 0,
      piiMasked: thisMonth.total_pii_masked,
      errors: thisMonth.error_count,
      confidentialOps: thisMonth.confidential_ops,
    },
    byOperation,
    piiBreakdown,
    knowledge,
    quality: {
      reviewsRun: evalStats.total_reviews,
      avgScore: evalStats.avg_score ?? null,
      criticalIssues: evalStats.critical_issues,
      hallucinations: evalStats.hallucinations,
      citationAccuracy:
        evalStats.citations_total > 0
          ? Math.round(
              ((evalStats.citations_total - evalStats.citations_suspicious) /
                evalStats.citations_total) *
                100
            )
          : null,
    },
  });
}

export async function POST(req: Request) {
  // Record a model evaluation result (called after self-review)
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: {
    operation: string;
    aiModel: string;
    overallScore?: number;
    criticalIssuesCount?: number;
    hallucinationCount?: number;
    citationsTotal?: number;
    citationsSuspicious?: number;
  } = await req.json();

  const db = sql();
  await db`
    INSERT INTO model_evaluations (
      user_id, operation, ai_model, overall_score,
      critical_issues_count, hallucination_count,
      citations_total, citations_suspicious
    ) VALUES (
      ${userId}, ${body.operation}, ${body.aiModel},
      ${body.overallScore ?? null},
      ${body.criticalIssuesCount ?? 0},
      ${body.hallucinationCount ?? 0},
      ${body.citationsTotal ?? 0},
      ${body.citationsSuspicious ?? 0}
    )
  `;

  return Response.json({ success: true });
}
