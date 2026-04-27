import { db, pastDocuments } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    const docs = await db
      .select({
        id: pastDocuments.id,
        title: pastDocuments.title,
        documentType: pastDocuments.documentType,
        caseCategory: pastDocuments.caseCategory,
        uploadedAt: pastDocuments.uploadedAt,
        metadata: pastDocuments.metadata,
      })
      .from(pastDocuments)
      .where(eq(pastDocuments.userId, userId))
      .orderBy(desc(pastDocuments.uploadedAt));

    return Response.json({ documents: docs });
  } catch (error) {
    console.error("RAG list error:", error);
    return Response.json({ error: "Failed to list" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const docId = url.searchParams.get("documentId");

    if (!userId || !docId) {
      return Response.json(
        { error: "userId and documentId required" },
        { status: 400 }
      );
    }

    // Cascade delete will remove chunks
    await db
      .delete(pastDocuments)
      .where(eq(pastDocuments.id, docId));

    return Response.json({ success: true });
  } catch (error) {
    console.error("RAG delete error:", error);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
