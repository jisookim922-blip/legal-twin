import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { embedSafe } from "@/lib/ai-wrapper";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    query,
    field,
    court,
    limit = 10,
  }: {
    query: string;
    field?: string;
    court?: string;
    limit?: number;
  } = await req.json();

  const sql = neon(process.env.DATABASE_URL!);

  // If query is provided, do vector search; otherwise filter only
  let results: Array<Record<string, unknown>> = [];

  if (query?.trim()) {
    const { embedding } = await embedSafe({
      context: { userId, operation: "court_case_search" },
      text: query,
    });
    const embeddingStr = `[${embedding.join(",")}]`;

    if (field && court) {
      results = (await sql`
        SELECT id, case_number, court, decision_date, case_type, field,
               summary, outcome, citation, source_url,
               1 - (embedding <=> ${embeddingStr}::vector) as similarity
        FROM court_cases
        WHERE field = ${field} AND court = ${court}
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `) as Array<Record<string, unknown>>;
    } else if (field) {
      results = (await sql`
        SELECT id, case_number, court, decision_date, case_type, field,
               summary, outcome, citation, source_url,
               1 - (embedding <=> ${embeddingStr}::vector) as similarity
        FROM court_cases
        WHERE field = ${field}
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `) as Array<Record<string, unknown>>;
    } else if (court) {
      results = (await sql`
        SELECT id, case_number, court, decision_date, case_type, field,
               summary, outcome, citation, source_url,
               1 - (embedding <=> ${embeddingStr}::vector) as similarity
        FROM court_cases
        WHERE court = ${court}
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `) as Array<Record<string, unknown>>;
    } else {
      results = (await sql`
        SELECT id, case_number, court, decision_date, case_type, field,
               summary, outcome, citation, source_url,
               1 - (embedding <=> ${embeddingStr}::vector) as similarity
        FROM court_cases
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `) as Array<Record<string, unknown>>;
    }
  } else {
    // Metadata-only filter
    results = (await sql`
      SELECT id, case_number, court, decision_date, case_type, field,
             summary, outcome, citation, source_url, NULL as similarity
      FROM court_cases
      WHERE (${field ?? null}::text IS NULL OR field = ${field ?? null})
        AND (${court ?? null}::text IS NULL OR court = ${court ?? null})
      ORDER BY decision_date DESC
      LIMIT ${limit}
    `) as Array<Record<string, unknown>>;
  }

  return Response.json({ results });
}

/** Verify a citation against the database */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const caseNumber = url.searchParams.get("caseNumber");
  if (!caseNumber) {
    return Response.json({ error: "caseNumber required" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const rows = (await sql`
    SELECT case_number, court, decision_date, summary, citation, source_url
    FROM court_cases
    WHERE case_number = ${caseNumber}
    LIMIT 1
  `) as Array<Record<string, unknown>>;

  if (rows.length === 0) {
    return Response.json({ verified: false, found: false });
  }

  return Response.json({ verified: true, found: true, case: rows[0] });
}
