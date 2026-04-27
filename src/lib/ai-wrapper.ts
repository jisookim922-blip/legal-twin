/**
 * AI Call Wrapper
 *
 * Wraps every AI call with:
 * 1. PII masking (送信前の自動マスキング)
 * 2. Audit logging (改ざん防止監査ログ)
 * 3. Confidential mode check (機密案件モード時の外部送信ブロック)
 *
 * All API routes should use these wrappers instead of calling AI directly.
 */

import { streamText, generateText, embed, type ModelMessage } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { maskPII, unmaskPII, summarizePII, type PIIMap } from "./pii-mask";
import { logAudit } from "./audit";

export interface CallContext {
  userId: string;
  caseId?: string | null;
  operation: string;
  confidentialMode?: boolean;
  knownEntities?: {
    clientName?: string;
    opposingParty?: string;
    caseName?: string;
  };
}

const DEFAULT_MODEL = "google/gemini-2.5-flash";

/**
 * Apply PII masking to a list of messages.
 * Returns masked messages and the merged PII map.
 */
function maskMessages(
  messages: { role: string; content: string }[],
  knownEntities: CallContext["knownEntities"]
): { messages: { role: string; content: string }[]; piiMap: PIIMap; count: number } {
  const piiMap: PIIMap = { forward: {}, reverse: {} };
  let totalCount = 0;

  const maskedMessages = messages.map((m) => {
    const result = maskPII(m.content, knownEntities);
    // Merge maps
    Object.assign(piiMap.forward, result.piiMap.forward);
    Object.assign(piiMap.reverse, result.piiMap.reverse);
    totalCount += result.detectedCount;
    return { role: m.role, content: result.maskedText };
  });

  return { messages: maskedMessages, piiMap, count: totalCount };
}

/**
 * Streaming text wrapper with PII mask + audit log.
 */
export async function streamTextSafe(params: {
  context: CallContext;
  system: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  model?: string;
  tags?: string[];
}): Promise<Response> {
  const { context, system, messages, model = DEFAULT_MODEL, tags = [] } = params;
  const startTime = Date.now();

  // Confidential mode check: block external AI calls
  if (context.confidentialMode) {
    return new Response(
      JSON.stringify({
        error: "機密案件モードのため外部AIへの送信はブロックされました",
        code: "CONFIDENTIAL_MODE_BLOCK",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Mask PII
  const inputForLog = JSON.stringify({ system, messages });
  const masked = maskMessages(messages, context.knownEntities);
  const maskedSystem = maskPII(system, context.knownEntities);

  // Merge system map
  for (const k of Object.keys(maskedSystem.piiMap.forward)) {
    masked.piiMap.forward[k] = maskedSystem.piiMap.forward[k];
  }
  for (const k of Object.keys(maskedSystem.piiMap.reverse)) {
    masked.piiMap.reverse[k] = maskedSystem.piiMap.reverse[k];
  }
  const totalPiiCount = masked.count + maskedSystem.detectedCount;

  // Stream from AI
  const result = streamText({
    model: gateway(model),
    system: maskedSystem.maskedText,
    messages: masked.messages as ModelMessage[],
    providerOptions: {
      gateway: {
        order: ["google", "anthropic"],
        tags: [...tags, "app:legaltwin", "compliance:masked"],
      },
    },
  });

  // Read full stream, unmask, then return as new stream
  const reader = result.textStream.getReader();
  const fullChunks: string[] = [];

  const piiMap = masked.piiMap;
  const auditCtx = context;
  const piiTypes = summarizePII(piiMap);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullChunks.push(value);
          // Unmask before sending to client
          const unmasked = unmaskPII(value, piiMap);
          controller.enqueue(new TextEncoder().encode(unmasked));
        }
        controller.close();

        // After stream completes, write audit log
        const fullOutput = fullChunks.join("");
        const unmaskedOutput = unmaskPII(fullOutput, piiMap);
        await logAudit({
          userId: auditCtx.userId,
          caseId: auditCtx.caseId,
          operation: auditCtx.operation,
          aiProvider: "vercel-gateway",
          aiModel: model,
          piiDetectedCount: totalPiiCount,
          piiTypes,
          inputFull: inputForLog,
          outputFull: unmaskedOutput,
          confidentialMode: auditCtx.confidentialMode ?? false,
          region: process.env.VERCEL_REGION ?? "hnd1",
          durationMs: Date.now() - startTime,
          status: "success",
        }).catch((e) => console.error("Audit log error:", e));
      } catch (error) {
        controller.error(error);
        await logAudit({
          userId: auditCtx.userId,
          caseId: auditCtx.caseId,
          operation: auditCtx.operation,
          aiProvider: "vercel-gateway",
          aiModel: model,
          piiDetectedCount: totalPiiCount,
          piiTypes,
          inputFull: inputForLog,
          outputFull: "",
          confidentialMode: auditCtx.confidentialMode ?? false,
          region: process.env.VERCEL_REGION ?? "hnd1",
          durationMs: Date.now() - startTime,
          status: "error",
          errorMessage: error instanceof Error ? error.message : String(error),
        }).catch(() => {});
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-PII-Masked-Count": String(totalPiiCount),
      "X-Region": process.env.VERCEL_REGION ?? "hnd1",
    },
  });
}

/**
 * Non-streaming generateText wrapper with PII mask + audit log.
 */
export async function generateTextSafe<T = unknown>(params: {
  context: CallContext;
  system: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  model?: string;
  output?: T;
  tags?: string[];
}): Promise<{
  text?: string;
  output?: unknown;
  piiCount: number;
  durationMs: number;
}> {
  const { context, system, messages, model = DEFAULT_MODEL, output, tags = [] } = params;
  const startTime = Date.now();

  if (context.confidentialMode) {
    throw new Error("機密案件モードのため外部AIへの送信はブロックされました");
  }

  const inputForLog = JSON.stringify({ system, messages });
  const masked = maskMessages(messages, context.knownEntities);
  const maskedSystem = maskPII(system, context.knownEntities);

  for (const k of Object.keys(maskedSystem.piiMap.forward)) {
    masked.piiMap.forward[k] = maskedSystem.piiMap.forward[k];
  }
  for (const k of Object.keys(maskedSystem.piiMap.reverse)) {
    masked.piiMap.reverse[k] = maskedSystem.piiMap.reverse[k];
  }
  const totalPiiCount = masked.count + maskedSystem.detectedCount;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params2: any = {
      model: gateway(model),
      system: maskedSystem.maskedText,
      messages: masked.messages as ModelMessage[],
      providerOptions: {
        gateway: {
          tags: [...tags, "app:legaltwin", "compliance:masked"],
        },
      },
    };
    if (output) {
      params2.output = output;
    }
    const result = await generateText(params2);

    const unmaskedText = result.text ? unmaskPII(result.text, masked.piiMap) : "";
    const fullOutput = unmaskedText || JSON.stringify(result.output ?? {});

    await logAudit({
      userId: context.userId,
      caseId: context.caseId,
      operation: context.operation,
      aiProvider: "vercel-gateway",
      aiModel: model,
      piiDetectedCount: totalPiiCount,
      piiTypes: summarizePII(masked.piiMap),
      inputFull: inputForLog,
      outputFull: fullOutput,
      confidentialMode: context.confidentialMode ?? false,
      region: process.env.VERCEL_REGION ?? "hnd1",
      durationMs: Date.now() - startTime,
      status: "success",
    });

    return {
      text: unmaskedText,
      output: result.output,
      piiCount: totalPiiCount,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    await logAudit({
      userId: context.userId,
      caseId: context.caseId,
      operation: context.operation,
      aiProvider: "vercel-gateway",
      aiModel: model,
      piiDetectedCount: totalPiiCount,
      piiTypes: summarizePII(masked.piiMap),
      inputFull: inputForLog,
      outputFull: "",
      confidentialMode: context.confidentialMode ?? false,
      region: process.env.VERCEL_REGION ?? "hnd1",
      durationMs: Date.now() - startTime,
      status: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Embedding wrapper (RAG ingestion). PII is also masked here for safety.
 */
export async function embedSafe(params: {
  context: CallContext;
  text: string;
  model?: string;
}): Promise<{ embedding: number[]; piiCount: number }> {
  const { context, text, model = "google/text-embedding-004" } = params;

  if (context.confidentialMode) {
    throw new Error("機密案件モードのため外部AIへの送信はブロックされました");
  }

  const masked = maskPII(text, context.knownEntities);
  const result = await embed({
    model: gateway.textEmbeddingModel(model),
    value: masked.maskedText,
  });

  return { embedding: result.embedding, piiCount: masked.detectedCount };
}
