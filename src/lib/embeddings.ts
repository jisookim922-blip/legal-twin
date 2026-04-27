import { embed, embedMany } from "ai";
import { gateway } from "@ai-sdk/gateway";

const EMBEDDING_MODEL = "google/text-embedding-004"; // 768 dimensions

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: gateway.textEmbeddingModel(EMBEDDING_MODEL),
    value: text,
  });
  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: gateway.textEmbeddingModel(EMBEDDING_MODEL),
    values: texts,
  });
  return embeddings;
}

/**
 * Split text into chunks of approximately `chunkSize` characters.
 * Tries to split at paragraph boundaries first, then sentence boundaries.
 */
export function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  if (text.length <= chunkSize) return [text];

  const chunks: string[] = [];
  // Split into paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      // Start next chunk with overlap
      current = current.slice(-overlap) + "\n\n" + para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  // Further split any chunk that's still too large
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= chunkSize * 1.5) {
      finalChunks.push(chunk);
    } else {
      // Split by sentence-ish boundaries
      const sentences = chunk.split(/(?<=[。．！？\n])/);
      let sub = "";
      for (const s of sentences) {
        if ((sub + s).length > chunkSize && sub.length > 0) {
          finalChunks.push(sub.trim());
          sub = s;
        } else {
          sub += s;
        }
      }
      if (sub.trim()) finalChunks.push(sub.trim());
    }
  }

  return finalChunks;
}
