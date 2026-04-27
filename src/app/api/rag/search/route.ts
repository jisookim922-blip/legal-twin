import { neon } from "@neondatabase/serverless";
import { embedText } from "@/lib/embeddings";

export async function POST(req: Request) {
  try {
    const {
      userId,
      query,
      limit = 5,
      documentType,
    }: {
      userId: string;
      query: string;
      limit?: number;
      documentType?: string;
    } = await req.json();

    if (!userId || !query) {
      return Response.json(
        { error: "userId and query are required" },
        { status: 400 }
      );
    }

    const queryEmbedding = await embedText(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    const sql = neon(process.env.DATABASE_URL!);

    // Cosine similarity search
    const results = documentType
      ? await sql`
          SELECT
            dc.id,
            dc.content,
            dc.chunk_index,
            pd.id as document_id,
            pd.title,
            pd.document_type,
            pd.case_category,
            1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
          FROM document_chunks dc
          JOIN past_documents pd ON pd.id = dc.document_id
          WHERE dc.user_id = ${userId}
            AND pd.document_type = ${documentType}
          ORDER BY dc.embedding <=> ${embeddingStr}::vector
          LIMIT ${limit}
        `
      : await sql`
          SELECT
            dc.id,
            dc.content,
            dc.chunk_index,
            pd.id as document_id,
            pd.title,
            pd.document_type,
            pd.case_category,
            1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
          FROM document_chunks dc
          JOIN past_documents pd ON pd.id = dc.document_id
          WHERE dc.user_id = ${userId}
          ORDER BY dc.embedding <=> ${embeddingStr}::vector
          LIMIT ${limit}
        `;

    return Response.json({ results });
  } catch (error) {
    console.error("RAG search error:", error);
    return Response.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}
