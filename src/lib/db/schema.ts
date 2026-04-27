import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  index,
  customType,
} from "drizzle-orm/pg-core";

// pgvector custom type
const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 768})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .slice(1, -1)
      .split(",")
      .map((v) => parseFloat(v));
  },
});

// Past documents uploaded by the lawyer for RAG personalization
export const pastDocuments = pgTable(
  "past_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    documentType: text("document_type"), // 訴状、準備書面、契約書 etc.
    content: text("content").notNull(),
    caseCategory: text("case_category"), // 家事、労働、etc.
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    metadata: jsonb("metadata").$type<{
      fileName?: string;
      fileSize?: number;
      tokenCount?: number;
    }>(),
  },
  (table) => ({
    userIdIdx: index("past_docs_user_id_idx").on(table.userId),
  })
);

// Chunks of documents with embeddings for similarity search
export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => pastDocuments.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("chunks_user_id_idx").on(table.userId),
    embeddingIdx: index("chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);

// Usage logs for ROI tracking
export const usageLogs = pgTable(
  "usage_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    operation: text("operation").notNull(), // chat, document_generate, search, analyze_facts
    caseId: text("case_id"),
    estimatedMinutesSaved: integer("estimated_minutes_saved").notNull().default(0),
    estimatedYenValue: integer("estimated_yen_value").notNull().default(0),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("usage_user_id_idx").on(table.userId),
    createdAtIdx: index("usage_created_at_idx").on(table.createdAt),
  })
);

// Citation verification cache
export const citationCache = pgTable(
  "citation_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    citationType: text("citation_type").notNull(), // "law" | "case"
    citationKey: text("citation_key").notNull().unique(),
    verified: text("verified").notNull(), // "verified" | "unverified" | "not_found"
    sourceUrl: text("source_url"),
    content: text("content"),
    cachedAt: timestamp("cached_at").defaultNow().notNull(),
  },
  (table) => ({
    keyIdx: index("citation_key_idx").on(table.citationKey),
  })
);

export type PastDocument = typeof pastDocuments.$inferSelect;
export type NewPastDocument = typeof pastDocuments.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type UsageLog = typeof usageLogs.$inferSelect;
export type CitationCache = typeof citationCache.$inferSelect;
