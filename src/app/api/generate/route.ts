import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { streamTextSafe } from "@/lib/ai-wrapper";
import { embedSafe } from "@/lib/ai-wrapper";
import { DOCUMENT_TYPE_LABELS } from "@/types";
import type { DocumentType } from "@/types";
import { heavyLimiter, checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(heavyLimiter, userId);
  if (!rl.success) return rateLimitResponse(rl);

  const {
    documentType,
    caseInfo,
    additionalContext,
    confidentialMode,
  }: {
    documentType: DocumentType;
    caseInfo: {
      id?: string;
      name: string;
      clientName: string;
      category: string;
      opposingParty?: string;
      description?: string;
    };
    additionalContext?: string;
    confidentialMode?: boolean;
  } = await req.json();

  const docLabel = DOCUMENT_TYPE_LABELS[documentType] ?? documentType;

  // RAG: 4 layer knowledge retrieval (PII masked)
  let ragContext = "";
  try {
    const searchQuery = `${docLabel} ${caseInfo.category} ${caseInfo.description ?? ""}`;
    const { embedding } = await embedSafe({
      context: {
        userId,
        caseId: caseInfo.id,
        operation: "rag_search_for_generate",
        confidentialMode,
        knownEntities: {
          clientName: caseInfo.clientName,
          opposingParty: caseInfo.opposingParty,
          caseName: caseInfo.name,
        },
      },
      text: searchQuery,
    });
    const embeddingStr = `[${embedding.join(",")}]`;
    const sql = neon(process.env.DATABASE_URL!);

    // Layer 5: User's past documents (highest priority for style/voice)
    const pastDocs = (await sql`
      SELECT dc.content, pd.title,
             1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
      FROM document_chunks dc
      JOIN past_documents pd ON pd.id = dc.document_id
      WHERE dc.user_id = ${userId}
      ORDER BY dc.embedding <=> ${embeddingStr}::vector
      LIMIT 3
    `) as Array<{ content: string; title: string; similarity: number }>;

    // Layer 2: Verified court cases (only for legal accuracy, not style)
    const cases = (await sql`
      SELECT case_number, court, decision_date, summary, citation, source_url,
             1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM court_cases
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT 3
    `) as Array<{
      case_number: string;
      court: string;
      decision_date: string;
      summary: string | null;
      citation: string | null;
      source_url: string | null;
      similarity: number;
    }>;

    // Layer 3: Official guidelines
    const guidelines = (await sql`
      SELECT gc.content, og.ministry, og.title, og.url,
             1 - (gc.embedding <=> ${embeddingStr}::vector) as similarity
      FROM guideline_chunks gc
      JOIN official_guidelines og ON og.id = gc.guideline_id
      ORDER BY gc.embedding <=> ${embeddingStr}::vector
      LIMIT 2
    `) as Array<{
      content: string;
      ministry: string;
      title: string;
      url: string | null;
      similarity: number;
    }>;

    const sections: string[] = [];
    if (pastDocs.length > 0) {
      sections.push(
        "【あなたの過去書面（文体・構成の参考にしてください）】\n" +
          pastDocs
            .map(
              (r, i) =>
                `\n--- 参考書面${i + 1}: ${r.title}（類似度${Math.round(r.similarity * 100)}%）---\n${r.content}`
            )
            .join("\n")
      );
    }
    if (cases.length > 0) {
      sections.push(
        "【検証済み判例（引用する場合はこのリストから選んでください）】\n" +
          cases
            .map((c, i) => {
              const date = new Date(c.decision_date)
                .toLocaleDateString("ja-JP", {
                  era: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              return `\n--- 判例${i + 1} ---\n事件番号: ${c.case_number}\n裁判所: ${c.court}\n日付: ${date}\n${c.summary ? `要旨: ${c.summary}\n` : ""}${c.citation ? `掲載: ${c.citation}\n` : ""}${c.source_url ? `URL: ${c.source_url}` : ""}`;
            })
            .join("\n")
      );
    }
    if (guidelines.length > 0) {
      sections.push(
        "【公的ガイドライン】\n" +
          guidelines
            .map(
              (g, i) =>
                `\n--- ガイドライン${i + 1}: [${g.ministry}] ${g.title} ---\n${g.content}${g.url ? `\nURL: ${g.url}` : ""}`
            )
            .join("\n")
      );
    }

    if (sections.length > 0) {
      ragContext = "\n\n" + sections.join("\n\n");
    }
  } catch (error) {
    console.error("RAG retrieval error (non-fatal):", error);
  }

  const systemPrompt = `あなたはベテラン弁護士の「分身AI」として、法律文書を起案するアシスタントです。

【重要な注意事項】
- 生成する文書は必ず「ドラフト」であり、弁護士の最終確認・承認が必要です。
- 実在の法令・条文を正確に引用してください。存在しない判例を作り上げてはいけません。
- 条文を引用する際は必ず「○○法第X条第Y項」の形式で記載してください。
- **判例を引用する際は、上記【検証済み判例】リストにあるもののみを使用してください。リストにない判例を引用してはいけません。**
- **公的ガイドラインを引用する際は、上記【公的ガイドライン】リストにあるもののみを使用してください。**
- 出典が不明な引用は使用しないでください。代わりに「該当判例の確認が必要」等と明示してください。

【案件情報】
案件名: ${caseInfo.name}
依頼者: ${caseInfo.clientName}
案件種別: ${caseInfo.category}
${caseInfo.opposingParty ? `相手方: ${caseInfo.opposingParty}` : ""}
${caseInfo.description ? `概要: ${caseInfo.description}` : ""}
${additionalContext ? `\n【追加コンテキスト】\n${additionalContext}` : ""}
${ragContext}

${ragContext ? "【重要】過去の書面を参考に、依頼者本人の文体・構成・語彙の傾向を再現してください。ただし、個別案件の固有名詞・数値は絶対に流用せず、本件に即した内容を生成してください。" : ""}`;

  return streamTextSafe({
    context: {
      userId,
      caseId: caseInfo.id,
      operation: "document_generate",
      confidentialMode,
      knownEntities: {
        clientName: caseInfo.clientName,
        opposingParty: caseInfo.opposingParty,
        caseName: caseInfo.name,
      },
    },
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `以下の文書を起案してください: ${docLabel}\n\n案件の情報に基づき、適切な形式と内容で完成度の高いドラフトを作成してください。日付は令和形式を使用し、実務で使える水準を目指してください。`,
      },
    ],
    tags: ["feature:document-generation"],
  });
}
