import { auth } from "@clerk/nextjs/server";
import { streamTextSafe } from "@/lib/ai-wrapper";
import { systemInstruction } from "@/lib/constants";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    messages,
    knowledgeContext,
    caseId,
    knownEntities,
    confidentialMode,
  }: {
    messages: { role: "user" | "assistant"; content: string }[];
    knowledgeContext?: string;
    caseId?: string;
    knownEntities?: { clientName?: string; opposingParty?: string; caseName?: string };
    confidentialMode?: boolean;
  } = await req.json();

  let systemPrompt = systemInstruction;
  if (knowledgeContext) {
    systemPrompt += "\n\n" + knowledgeContext;
  }

  return streamTextSafe({
    context: {
      userId,
      caseId: caseId ?? null,
      operation: "chat",
      confidentialMode,
      knownEntities,
    },
    system: systemPrompt,
    messages,
    tags: ["feature:legal-chat"],
  });
}
