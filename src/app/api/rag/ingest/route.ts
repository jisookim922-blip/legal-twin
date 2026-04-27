import { auth } from "@clerk/nextjs/server";
import { db, pastDocuments, documentChunks } from "@/lib/db";
import { chunkText } from "@/lib/embeddings";
import { embedSafe } from "@/lib/ai-wrapper";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      title,
      content,
      documentType,
      caseCategory,
      fileName,
    }: {
      title: string;
      content: string;
      documentType?: string;
      caseCategory?: string;
      fileName?: string;
    } = await req.json();

    if (!title || !content) {
      return Response.json(
        { error: "title, content are required" },
        { status: 400 }
      );
    }

    const [doc] = await db
      .insert(pastDocuments)
      .values({
        userId,
        title,
        content,
        documentType,
        caseCategory,
        metadata: {
          fileName,
          fileSize: content.length,
          tokenCount: Math.ceil(content.length / 2),
        },
      })
      .returning();

    const chunks = chunkText(content, 800, 100);
    // Embed each chunk via PII-masked wrapper
    const embeddings: number[][] = [];
    for (const chunk of chunks) {
      const result = await embedSafe({
        context: {
          userId,
          operation: "rag_ingest",
        },
        text: chunk,
      });
      embeddings.push(result.embedding);
    }

    const chunkRows = chunks.map((chunk, i) => ({
      documentId: doc.id,
      userId,
      chunkIndex: i,
      content: chunk,
      embedding: embeddings[i],
    }));

    await db.insert(documentChunks).values(chunkRows);

    return Response.json({
      success: true,
      documentId: doc.id,
      chunksCreated: chunks.length,
    });
  } catch (error) {
    console.error("RAG ingest error:", error);
    return Response.json(
      { error: "Failed to ingest document" },
      { status: 500 }
    );
  }
}
