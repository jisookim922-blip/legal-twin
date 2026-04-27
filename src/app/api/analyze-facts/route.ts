import { auth } from "@clerk/nextjs/server";
import { Output } from "ai";
import { z } from "zod";
import { generateTextSafe } from "@/lib/ai-wrapper";

const factSchema = z.object({
  events: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      title: z.string(),
      description: z.string(),
      persons: z.array(z.string()),
      legalNote: z.string().optional(),
    })
  ),
  persons: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      relation: z.string().optional(),
    })
  ),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    text,
    caseName,
    caseId,
    knownEntities,
    confidentialMode,
  }: {
    text: string;
    caseName: string;
    caseId?: string;
    knownEntities?: { clientName?: string; opposingParty?: string; caseName?: string };
    confidentialMode?: boolean;
  } = await req.json();

  try {
    const result = await generateTextSafe({
      context: {
        userId,
        caseId: caseId ?? null,
        operation: "analyze_facts",
        confidentialMode,
        knownEntities: { ...knownEntities, caseName },
      },
      system: `あなたは弁護士の分身AIです。ヒアリング内容や事実関係のメモから、構造化データを抽出してください。日付が不明な場合は "不明" としてください。`,
      messages: [
        {
          role: "user",
          content: `案件「${caseName}」について、以下の内容から事実関係を整理してください:\n\n${text}`,
        },
      ],
      output: Output.object({ schema: factSchema }),
      tags: ["feature:fact-analysis"],
    });

    return Response.json(result.output ?? { events: [], persons: [] });
  } catch (error) {
    if (error instanceof Error && error.message.includes("機密案件モード")) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    console.error(error);
    return Response.json({ events: [], persons: [] });
  }
}
