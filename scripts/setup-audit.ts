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

  console.log("Creating audit_logs table...");
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      case_id TEXT,
      operation TEXT NOT NULL,
      ai_provider TEXT,
      ai_model TEXT,
      pii_detected_count INTEGER NOT NULL DEFAULT 0,
      pii_types TEXT[],
      input_hash TEXT NOT NULL,
      output_hash TEXT NOT NULL,
      input_summary TEXT,
      output_summary TEXT,
      input_full TEXT,
      output_full TEXT,
      confidential_mode BOOLEAN NOT NULL DEFAULT false,
      region TEXT,
      duration_ms INTEGER,
      status TEXT NOT NULL DEFAULT 'success',
      error_message TEXT,
      prev_hash TEXT,
      this_hash TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS audit_user_id_idx ON audit_logs(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS audit_case_id_idx ON audit_logs(case_id)`;
  await sql`CREATE INDEX IF NOT EXISTS audit_created_at_idx ON audit_logs(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS audit_this_hash_idx ON audit_logs(this_hash)`;

  console.log("Creating user_settings table...");
  await sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      pii_masking_enabled BOOLEAN NOT NULL DEFAULT true,
      audit_log_full_payload BOOLEAN NOT NULL DEFAULT true,
      default_confidential_mode BOOLEAN NOT NULL DEFAULT false,
      hourly_rate INTEGER NOT NULL DEFAULT 15000,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  // Add confidential_mode to cases (we don't have a cases table yet, but reserve for future)
  console.log("✓ Audit + settings setup complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
