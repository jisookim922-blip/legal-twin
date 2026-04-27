import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { chunkText } from "@/lib/embeddings";
import { embedSafe } from "@/lib/ai-wrapper";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    ministry,
    title,
    documentNumber,
    issuedDate,
    url,
    fullText,
  }: {
    ministry: string;
    title: string;
    documentNumber?: string;
    issuedDate?: string;
    url?: string;
    fullText: string;
  } = await req.json();

  if (!ministry || !title || !fullText) {
    return Response.json(
      { error: "ministry, title, fullText are required" },
      { status: 400 }
    );
  }

  const sql = neon(process.env.DATABASE_URL!);

  // Insert guideline
  const result = (await sql`
    INSERT INTO official_guidelines (
      ministry, title, document_number, issued_date, url, full_text
    ) VALUES (
      ${ministry}, ${title},
      ${documentNumber ?? null},
      ${issuedDate ?? null},
      ${url ?? null},
      ${fullText}
    )
    RETURNING id
  `) as Array<{ id: string }>;

  const guidelineId = result[0].id;

  // Chunk and embed
  const chunks = chunkText(fullText, 800, 100);
  for (let i = 0; i < chunks.length; i++) {
    try {
      const { embedding } = await embedSafe({
        context: { userId, operation: "guideline_ingest" },
        text: chunks[i],
      });
      const embeddingStr = `[${embedding.join(",")}]`;
      await sql`
        INSERT INTO guideline_chunks (guideline_id, chunk_index, content, embedding)
        VALUES (${guidelineId}, ${i}, ${chunks[i]}, ${embeddingStr}::vector)
      `;
    } catch (e) {
      console.error("Guideline chunk embed failed:", i, e);
    }
  }

  return Response.json({
    success: true,
    guidelineId,
    chunksCreated: chunks.length,
  });
}
