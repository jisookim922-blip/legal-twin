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
    ministry,
    limit = 10,
  }: { query: string; ministry?: string; limit?: number } = await req.json();

  if (!query?.trim()) {
    return Response.json({ results: [] });
  }

  const { embedding } = await embedSafe({
    context: { userId, operation: "guideline_search" },
    text: query,
  });
  const embeddingStr = `[${embedding.join(",")}]`;
  const sql = neon(process.env.DATABASE_URL!);

  const results = ministry
    ? await sql`
        SELECT
          gc.content,
          gc.chunk_index,
          og.id as guideline_id,
          og.ministry,
          og.title,
          og.document_number,
          og.url,
          1 - (gc.embedding <=> ${embeddingStr}::vector) as similarity
        FROM guideline_chunks gc
        JOIN official_guidelines og ON og.id = gc.guideline_id
        WHERE og.ministry = ${ministry}
        ORDER BY gc.embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `
    : await sql`
        SELECT
          gc.content,
          gc.chunk_index,
          og.id as guideline_id,
          og.ministry,
          og.title,
          og.document_number,
          og.url,
          1 - (gc.embedding <=> ${embeddingStr}::vector) as similarity
        FROM guideline_chunks gc
        JOIN official_guidelines og ON og.id = gc.guideline_id
        ORDER BY gc.embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `;

  return Response.json({ results });
}
