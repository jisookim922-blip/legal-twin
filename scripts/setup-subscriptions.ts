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

  console.log("Creating subscriptions table...");
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL UNIQUE,
      stripe_customer_id TEXT UNIQUE,
      stripe_subscription_id TEXT UNIQUE,
      plan TEXT NOT NULL DEFAULT 'trial',
      status TEXT NOT NULL DEFAULT 'trialing',
      trial_ends_at TIMESTAMP,
      current_period_end TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS subs_user_id_idx ON subscriptions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS subs_customer_idx ON subscriptions(stripe_customer_id)`;

  console.log("✓ Subscription table setup complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
