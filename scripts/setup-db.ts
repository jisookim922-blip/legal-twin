import { neon } from "@neondatabase/serverless";
import * as fs from "node:fs";
import * as path from "node:path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[m[1]] = val;
    }
  }
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Enabling pgvector extension...");
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  console.log("Creating past_documents table...");
  await sql`
    CREATE TABLE IF NOT EXISTS past_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      document_type TEXT,
      content TEXT NOT NULL,
      case_category TEXT,
      uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
      metadata JSONB
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS past_docs_user_id_idx ON past_documents(user_id)`;

  console.log("Creating document_chunks table...");
  await sql`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL REFERENCES past_documents(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding vector(768),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS chunks_user_id_idx ON document_chunks(user_id)`;
  await sql`
    CREATE INDEX IF NOT EXISTS chunks_embedding_idx
    ON document_chunks
    USING hnsw (embedding vector_cosine_ops)
  `;

  console.log("Creating usage_logs table...");
  await sql`
    CREATE TABLE IF NOT EXISTS usage_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      case_id TEXT,
      estimated_minutes_saved INTEGER NOT NULL DEFAULT 0,
      estimated_yen_value INTEGER NOT NULL DEFAULT 0,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS usage_user_id_idx ON usage_logs(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS usage_created_at_idx ON usage_logs(created_at)`;

  console.log("Creating citation_cache table...");
  await sql`
    CREATE TABLE IF NOT EXISTS citation_cache (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      citation_type TEXT NOT NULL,
      citation_key TEXT NOT NULL UNIQUE,
      verified TEXT NOT NULL,
      source_url TEXT,
      content TEXT,
      cached_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS citation_key_idx ON citation_cache(citation_key)`;

  console.log("✓ Database setup complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
