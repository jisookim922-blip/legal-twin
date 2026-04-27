import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { embedSafe } from "@/lib/ai-wrapper";

interface CaseInput {
  caseNumber: string; // 令和X年(ワ)第X号
  court: string; // 東京地裁、最高裁等
  decisionDate: string; // YYYY-MM-DD
  caseType?: string;
  field?: string;
  summary?: string;
  outcome?: string;
  citation?: string;
  sourceUrl?: string;
  fullText?: string;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: { cases: CaseInput[] } | CaseInput = await req.json();
  const cases: CaseInput[] = Array.isArray((body as { cases?: CaseInput[] }).cases)
    ? (body as { cases: CaseInput[] }).cases
    : [body as CaseInput];

  const sql = neon(process.env.DATABASE_URL!);
  const inserted: string[] = [];
  const skipped: string[] = [];

  for (const c of cases) {
    if (!c.caseNumber || !c.court || !c.decisionDate) {
      skipped.push(c.caseNumber ?? "(no number)");
      continue;
    }

    // Build embedding text
    const embedText = [
      c.caseNumber,
      c.court,
      c.field ?? "",
      c.summary ?? "",
      c.outcome ?? "",
    ]
      .filter(Boolean)
      .join("\n");

    let embedding: number[] | null = null;
    if (embedText.trim()) {
      try {
        const result = await embedSafe({
          context: { userId, operation: "court_case_ingest" },
          text: embedText,
        });
        embedding = result.embedding;
      } catch (e) {
        console.error("Embedding failed for case:", c.caseNumber, e);
      }
    }

    try {
      const embeddingStr = embedding ? `[${embedding.join(",")}]` : null;
      await sql`
        INSERT INTO court_cases (
          case_number, court, decision_date, case_type, field,
          summary, outcome, citation, source_url, full_text,
          embedding, added_by
        ) VALUES (
          ${c.caseNumber}, ${c.court}, ${c.decisionDate},
          ${c.caseType ?? null}, ${c.field ?? null},
          ${c.summary ?? null}, ${c.outcome ?? null},
          ${c.citation ?? null}, ${c.sourceUrl ?? null}, ${c.fullText ?? null},
          ${embeddingStr ? sql`${embeddingStr}::vector` : null},
          ${userId}
        )
        ON CONFLICT (case_number) DO UPDATE SET
          court = EXCLUDED.court,
          decision_date = EXCLUDED.decision_date,
          summary = COALESCE(EXCLUDED.summary, court_cases.summary),
          outcome = COALESCE(EXCLUDED.outcome, court_cases.outcome),
          citation = COALESCE(EXCLUDED.citation, court_cases.citation),
          source_url = COALESCE(EXCLUDED.source_url, court_cases.source_url),
          full_text = COALESCE(EXCLUDED.full_text, court_cases.full_text),
          embedding = COALESCE(EXCLUDED.embedding, court_cases.embedding)
      `;
      inserted.push(c.caseNumber);
    } catch (e) {
      console.error("Insert failed for case:", c.caseNumber, e);
      skipped.push(c.caseNumber);
    }
  }

  return Response.json({ inserted, skipped, total: cases.length });
}
