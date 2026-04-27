import { auth } from "@clerk/nextjs/server";
import { streamTextSafe } from "@/lib/ai-wrapper";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    query,
    confidentialMode,
  }: { query: string; confidentialMode?: boolean } = await req.json();

  return streamTextSafe({
    context: {
      userId,
      operation: "search",
      confidentialMode,
    },
    system:
      "あなたは弁護士のナレッジベースから類似案件を検索するAIです。過去の判例データに基づき、「判例名/事案の概要」「本件との関連性や学べるポイント」を提示してください。出典が不明な場合は『出典未確認』と明示してください。",
    messages: [
      {
        role: "user",
        content: `以下のキーワードに関する類似判例や文献を簡潔にリストアップしてください。検索キーワード: ${query}`,
      },
    ],
    tags: ["feature:legal-search"],
  });
}
