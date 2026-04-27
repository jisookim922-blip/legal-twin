import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { embedSafe } from "@/lib/ai-wrapper";
import { chunkText } from "@/lib/embeddings";
import { SAMPLE_CASES, SAMPLE_GUIDELINES } from "@/lib/seed-data";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const target = url.searchParams.get("target") ?? "all";

  const sql = neon(process.env.DATABASE_URL!);
  const results = { cases: 0, guidelines: 0 };

  if (target === "all" || target === "cases") {
    for (const c of SAMPLE_CASES) {
      const embedText = `${c.caseNumber} ${c.court} ${c.field} ${c.summary} ${c.outcome}`;
      try {
        const { embedding } = await embedSafe({
          context: { userId, operation: "court_case_seed" },
          text: embedText,
        });
        const embeddingStr = `[${embedding.join(",")}]`;
        await sql`
          INSERT INTO court_cases (
            case_number, court, decision_date, case_type, field,
            summary, outcome, citation, source_url, embedding, added_by
          ) VALUES (
            ${c.caseNumber}, ${c.court}, ${c.decisionDate},
            ${c.caseType}, ${c.field}, ${c.summary}, ${c.outcome},
            ${c.citation}, ${c.sourceUrl},
            ${embeddingStr}::vector,
            ${"system_seed"}
          )
          ON CONFLICT (case_number) DO NOTHING
        `;
        results.cases++;
      } catch (e) {
        console.error("Seed case failed:", c.caseNumber, e);
      }
    }
  }

  if (target === "all" || target === "guidelines") {
    for (const g of SAMPLE_GUIDELINES) {
      try {
        const insertResult = (await sql`
          INSERT INTO official_guidelines (
            ministry, title, document_number, issued_date, url, full_text
          ) VALUES (
            ${g.ministry}, ${g.title}, ${g.documentNumber},
            ${g.issuedDate}, ${g.url}, ${g.fullText}
          )
          RETURNING id
        `) as Array<{ id: string }>;

        const gid = insertResult[0].id;
        const chunks = chunkText(g.fullText, 800, 100);
        for (let i = 0; i < chunks.length; i++) {
          const { embedding } = await embedSafe({
            context: { userId, operation: "guideline_seed" },
            text: chunks[i],
          });
          const embeddingStr = `[${embedding.join(",")}]`;
          await sql`
            INSERT INTO guideline_chunks (guideline_id, chunk_index, content, embedding)
            VALUES (${gid}, ${i}, ${chunks[i]}, ${embeddingStr}::vector)
          `;
        }
        results.guidelines++;
      } catch (e) {
        console.error("Seed guideline failed:", g.title, e);
      }
    }
  }

  return Response.json({ success: true, ...results });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only delete system-seeded data
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM court_cases WHERE added_by = 'system_seed'`;
  await sql`DELETE FROM official_guidelines WHERE ministry IN ('金融庁', '厚生労働省', '経済産業省')`;

  return Response.json({ success: true });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const [counts] = (await sql`
    SELECT
      (SELECT COUNT(*) FROM court_cases)::int as cases,
      (SELECT COUNT(*) FROM official_guidelines)::int as guidelines,
      (SELECT COUNT(*) FROM guideline_chunks)::int as guideline_chunks
  `) as Array<{ cases: number; guidelines: number; guideline_chunks: number }>;

  return Response.json(counts);
}
