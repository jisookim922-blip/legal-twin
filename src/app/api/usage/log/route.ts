import { db, usageLogs } from "@/lib/db";

const OPERATION_MINUTES: Record<string, number> = {
  document_generate: 45, // 書面1件の起案は平均45分削減
  chat: 5, // AIチャット相談は平均5分削減
  search: 15, // 判例検索は平均15分削減
  analyze_facts: 30, // 事実整理は平均30分削減
  self_review: 20, // セルフレビューは平均20分削減
  rag_ingest: 0, // インジェストは時短にカウントしない
};

// 弁護士時給平均 ¥15,000
const HOURLY_RATE = 15000;

export async function POST(req: Request) {
  try {
    const {
      userId,
      operation,
      caseId,
      metadata,
    }: {
      userId: string;
      operation: string;
      caseId?: string;
      metadata?: Record<string, unknown>;
    } = await req.json();

    if (!userId || !operation) {
      return Response.json(
        { error: "userId and operation required" },
        { status: 400 }
      );
    }

    const minutes = OPERATION_MINUTES[operation] ?? 0;
    const yenValue = Math.round((minutes / 60) * HOURLY_RATE);

    await db.insert(usageLogs).values({
      userId,
      operation,
      caseId,
      estimatedMinutesSaved: minutes,
      estimatedYenValue: yenValue,
      metadata: metadata ?? null,
    });

    return Response.json({
      success: true,
      minutesSaved: minutes,
      yenValue,
    });
  } catch (error) {
    console.error("Usage log error:", error);
    return Response.json({ error: "Failed to log usage" }, { status: 500 });
  }
}
