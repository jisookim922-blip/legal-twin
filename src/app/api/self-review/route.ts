import { auth } from "@clerk/nextjs/server";
import { Output } from "ai";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { generateTextSafe } from "@/lib/ai-wrapper";

const reviewSchema = z.object({
  overallScore: z.number().min(0).max(100),
  issues: z.array(
    z.object({
      severity: z.enum(["critical", "warning", "info"]),
      category: z.enum([
        "hallucination",
        "citation",
        "logic",
        "completeness",
        "tone",
        "compliance",
      ]),
      description: z.string(),
      suggestion: z.string(),
      quote: z.string().optional(),
    })
  ),
  citations: z.array(
    z.object({
      text: z.string(),
      type: z.enum(["law", "case", "regulation"]),
      verified: z.enum(["likely_real", "suspicious", "unknown"]),
      note: z.string(),
    })
  ),
  summary: z.string(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    documentContent,
    documentType,
    caseId,
    knownEntities,
    confidentialMode,
  }: {
    documentContent: string;
    documentType: string;
    caseId?: string;
    knownEntities?: { clientName?: string; opposingParty?: string; caseName?: string };
    confidentialMode?: boolean;
  } = await req.json();

  if (!documentContent) {
    return Response.json(
      { error: "documentContent is required" },
      { status: 400 }
    );
  }

  try {
    const result = await generateTextSafe({
      context: {
        userId,
        caseId: caseId ?? null,
        operation: "self_review",
        confidentialMode,
        knownEntities,
      },
      // Use Claude Haiku as reviewer (different from generator) to avoid confirmation bias
      model: "anthropic/claude-haiku-4.5",
      system: `あなたは法律文書の品質を厳格に審査するベテラン弁護士です。

【重要な検証ポイント】
1. **ハルシネーション検知**: 存在しない判例・条文が引用されていないか
2. **条文の正確性**: 民法、刑法、商法、会社法等の条文番号が正確か
3. **論理の整合性**: 事実から結論までの論理が破綻していないか
4. **完全性**: 必須記載事項が揃っているか
5. **トーン**: 法律文書として適切な敬語・文体か
6. **コンプライアンス**: 弁護士法・職務基本規程に違反していないか

critical な問題が1つでもあれば、絶対にそのまま送付すべきでないとマークしてください。`,
      messages: [
        {
          role: "user",
          content: `以下の「${documentType}」を厳格にレビューしてください。ハルシネーション（架空の判例・条文）を特に注意して確認してください。

===ドキュメント===
${documentContent}
===ここまで===`,
        },
      ],
      output: Output.object({ schema: reviewSchema }),
      tags: ["feature:self-review"],
    });

    // Record model evaluation metrics
    try {
      const review = (result.output ?? {}) as {
        overallScore?: number;
        issues?: Array<{ severity?: string; category?: string }>;
        citations?: Array<{ verified?: string }>;
      };
      const issues = review.issues ?? [];
      const citations = review.citations ?? [];
      const sql = neon(process.env.DATABASE_URL!);
      await sql`
        INSERT INTO model_evaluations (
          user_id, operation, ai_model, overall_score,
          critical_issues_count, hallucination_count,
          citations_total, citations_suspicious
        ) VALUES (
          ${userId},
          ${"self_review"},
          ${"anthropic/claude-haiku-4.5"},
          ${review.overallScore ?? null},
          ${issues.filter((i) => i.severity === "critical").length},
          ${issues.filter((i) => i.category === "hallucination").length},
          ${citations.length},
          ${citations.filter((c) => c.verified === "suspicious").length}
        )
      `;
    } catch (e) {
      console.error("Failed to record evaluation:", e);
    }

    return Response.json(result.output ?? {});
  } catch (error) {
    if (error instanceof Error && error.message.includes("機密案件モード")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    console.error("Self-review error:", error);
    return Response.json({ error: "Failed to review" }, { status: 500 });
  }
}
