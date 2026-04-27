import { neon } from "@neondatabase/serverless";
import * as fs from "node:fs";
import * as path from "node:path";

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

  // Court cases (Layer 2: 判例)
  console.log("Creating court_cases table...");
  await sql`
    CREATE TABLE IF NOT EXISTS court_cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_number TEXT NOT NULL UNIQUE,
      court TEXT NOT NULL,
      decision_date DATE NOT NULL,
      case_type TEXT,
      field TEXT,
      summary TEXT,
      outcome TEXT,
      citation TEXT,
      source_url TEXT,
      full_text TEXT,
      embedding vector(768),
      added_by TEXT NOT NULL DEFAULT 'system',
      added_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS court_cases_court_idx ON court_cases(court)`;
  await sql`CREATE INDEX IF NOT EXISTS court_cases_date_idx ON court_cases(decision_date)`;
  await sql`CREATE INDEX IF NOT EXISTS court_cases_field_idx ON court_cases(field)`;
  await sql`
    CREATE INDEX IF NOT EXISTS court_cases_embedding_idx
    ON court_cases
    USING hnsw (embedding vector_cosine_ops)
  `;

  // Official guidelines (Layer 3: 公的ガイドライン)
  console.log("Creating official_guidelines table...");
  await sql`
    CREATE TABLE IF NOT EXISTS official_guidelines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ministry TEXT NOT NULL,
      title TEXT NOT NULL,
      document_number TEXT,
      issued_date DATE,
      url TEXT,
      full_text TEXT NOT NULL,
      added_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS guidelines_ministry_idx ON official_guidelines(ministry)`;

  console.log("Creating guideline_chunks table...");
  await sql`
    CREATE TABLE IF NOT EXISTS guideline_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      guideline_id UUID NOT NULL REFERENCES official_guidelines(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding vector(768),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS guideline_chunks_embedding_idx
    ON guideline_chunks
    USING hnsw (embedding vector_cosine_ops)
  `;

  // Law update monitoring
  console.log("Creating law_updates table...");
  await sql`
    CREATE TABLE IF NOT EXISTS law_updates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      law_id TEXT NOT NULL,
      law_name TEXT NOT NULL,
      change_type TEXT NOT NULL,
      effective_date DATE,
      summary TEXT,
      acknowledged_by TEXT[],
      detected_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS law_updates_law_id_idx ON law_updates(law_id)`;
  await sql`CREATE INDEX IF NOT EXISTS law_updates_detected_at_idx ON law_updates(detected_at)`;

  // Model evaluation: aggregate metrics from self-reviews
  console.log("Creating model_evaluations table...");
  await sql`
    CREATE TABLE IF NOT EXISTS model_evaluations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      ai_model TEXT NOT NULL,
      overall_score INTEGER,
      critical_issues_count INTEGER NOT NULL DEFAULT 0,
      hallucination_count INTEGER NOT NULL DEFAULT 0,
      citations_total INTEGER NOT NULL DEFAULT 0,
      citations_suspicious INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS model_eval_user_idx ON model_evaluations(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS model_eval_created_at_idx ON model_evaluations(created_at)`;

  console.log("✓ Knowledge layers + evaluation tables setup complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
