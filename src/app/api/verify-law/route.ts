import { neon } from "@neondatabase/serverless";
import { generateText, Output } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";

const citationSchema = z.object({
  citations: z.array(
    z.object({
      originalText: z.string().describe("抽出された原文"),
      type: z
        .enum(["law", "case", "regulation", "book"])
        .describe("law: 法令条文, case: 判例, regulation: 政省令, book: 書籍"),
      normalized: z.string().describe("正規化された引用形式"),
      lawName: z.string().optional().describe("法令名（lawの場合）"),
      article: z.string().optional().describe("条番号（lawの場合）"),
      courtDate: z.string().optional().describe("裁判日付（caseの場合）"),
    })
  ),
});

/**
 * Extracts all law/case citations from the document text using AI.
 * Then verifies laws against e-Gov法令API (if citation is a Japanese law article).
 */
export async function POST(req: Request) {
  try {
    const {
      content,
    }: {
      content: string;
    } = await req.json();

    if (!content) {
      return Response.json(
        { error: "content required" },
        { status: 400 }
      );
    }

    // Step 1: Use AI to extract citations from document
    const { output } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      output: Output.object({ schema: citationSchema }),
      system:
        "あなたは法律文書から条文引用・判例引用・書籍引用を正確に抽出するアシスタントです。重複を除いて、登場する全ての引用をリストアップしてください。",
      messages: [
        {
          role: "user",
          content: `以下の文書から、条文引用（「民法第709条」等）、判例引用（「最判令和5年4月1日」等）、政省令・書籍等を抽出してください。

===文書===
${content}
===ここまで===`,
        },
      ],
      providerOptions: {
        gateway: { tags: ["feature:citation-extract", "app:legaltwin"] },
      },
    });

    const citations = output.citations ?? [];

    // Step 2: For law citations, verify against cache / e-Gov API
    const sql = neon(process.env.DATABASE_URL!);
    const verified = [];

    for (const c of citations) {
      const cacheKey = `${c.type}:${c.normalized}`;

      // Check cache
      const cached = (await sql`
        SELECT verified, source_url, content
        FROM citation_cache
        WHERE citation_key = ${cacheKey}
        LIMIT 1
      `) as Array<{
        verified: string;
        source_url: string | null;
        content: string | null;
      }>;

      if (cached.length > 0) {
        verified.push({
          ...c,
          status: cached[0].verified as
            | "verified"
            | "unverified"
            | "not_found",
          sourceUrl: cached[0].source_url,
        });
        continue;
      }

      // For law: attempt e-Gov API (法令検索)
      let status: "verified" | "unverified" | "not_found" = "unverified";
      let sourceUrl: string | null = null;

      if (c.type === "law" && c.lawName) {
        try {
          // e-Gov法令API v2: https://laws.e-gov.go.jp/api/2
          const apiUrl = `https://laws.e-gov.go.jp/api/2/keyword?keyword=${encodeURIComponent(
            c.lawName
          )}&response_format=json`;
          const res = await fetch(apiUrl, {
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            const data = (await res.json()) as {
              laws?: Array<{ law_title?: string; law_id?: string }>;
            };
            const match = data.laws?.find((l) =>
              l.law_title?.includes(c.lawName!)
            );
            if (match) {
              status = "verified";
              sourceUrl = `https://laws.e-gov.go.jp/law/${match.law_id}`;
            } else {
              status = "not_found";
            }
          }
        } catch {
          // e-Gov API unavailable, keep unverified
        }
      }

      // Cache the result
      await sql`
        INSERT INTO citation_cache (citation_type, citation_key, verified, source_url)
        VALUES (${c.type}, ${cacheKey}, ${status}, ${sourceUrl})
        ON CONFLICT (citation_key) DO NOTHING
      `;

      verified.push({ ...c, status, sourceUrl });
    }

    return Response.json({ citations: verified });
  } catch (error) {
    console.error("Verify law error:", error);
    return Response.json(
      { error: "Failed to verify citations" },
      { status: 500 }
    );
  }
}
