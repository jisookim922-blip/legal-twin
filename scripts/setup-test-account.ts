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

const TEST_EMAIL = "test-lawyer@legaltwin-demo.app";
const TEST_PASSWORD = "LegalTwin2026!Demo";

async function createOrFindUser(): Promise<string> {
  console.log(`Looking for test user: ${TEST_EMAIL}`);

  // Search existing
  const searchUrl = `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(TEST_EMAIL)}`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
  });
  if (searchRes.ok) {
    const users = (await searchRes.json()) as Array<{ id: string }>;
    if (users.length > 0) {
      console.log(`  Found existing user: ${users[0].id}`);
      return users[0].id;
    }
  }

  // Create
  console.log("  Creating new user...");
  const createRes = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [TEST_EMAIL],
      password: TEST_PASSWORD,
      first_name: "テスト",
      last_name: "弁護士",
      skip_password_checks: true,
      skip_password_requirement: false,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Create user failed: ${createRes.status} ${err}`);
  }

  const user = (await createRes.json()) as { id: string };
  console.log(`  Created: ${user.id}`);
  return user.id;
}

async function setupSubscription(userId: string) {
  console.log("Setting up Pro subscription (active)...");
  const sql = neon(process.env.DATABASE_URL!);
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 90); // 90 days for testing
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 90);

  await sql`
    INSERT INTO subscriptions (
      user_id, plan, status, trial_ends_at, current_period_end
    ) VALUES (
      ${userId}, 'pro', 'active', ${trialEnd.toISOString()}, ${periodEnd.toISOString()}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      plan = 'pro',
      status = 'active',
      trial_ends_at = EXCLUDED.trial_ends_at,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW()
  `;
  console.log("  ✓ Pro plan active for 90 days");
}

async function setupUserSettings(userId: string) {
  console.log("Setting up user settings...");
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    INSERT INTO user_settings (
      user_id, pii_masking_enabled, audit_log_full_payload,
      default_confidential_mode, hourly_rate
    ) VALUES (
      ${userId}, true, true, false, 15000
    )
    ON CONFLICT (user_id) DO NOTHING
  `;
  console.log("  ✓ Settings initialized");
}

async function seedCourtCases(userId: string) {
  console.log("Seeding court cases via /api/admin/seed...");
  // We can't easily call the API without a session token, so call DB directly
  const { embedSafe } = await import("../src/lib/ai-wrapper");
  const { SAMPLE_CASES, SAMPLE_GUIDELINES } = await import("../src/lib/seed-data");
  const { chunkText } = await import("../src/lib/embeddings");

  const sql = neon(process.env.DATABASE_URL!);

  // Cases
  for (const c of SAMPLE_CASES) {
    try {
      const embedText = `${c.caseNumber} ${c.court} ${c.field} ${c.summary} ${c.outcome}`;
      const { embedding } = await embedSafe({
        context: { userId, operation: "court_case_seed" },
        text: embedText,
      });
      const embeddingStr = `[${embedding.join(",")}]`;
      await sql`
        INSERT INTO court_cases (
          case_number, court, decision_date, case_type, field,
          summary, outcome, citation, source_url, embedding, added_by
        ) VALUES (
          ${c.caseNumber}, ${c.court}, ${c.decisionDate},
          ${c.caseType}, ${c.field}, ${c.summary}, ${c.outcome},
          ${c.citation}, ${c.sourceUrl},
          ${embeddingStr}::vector,
          ${"system_seed"}
        )
        ON CONFLICT (case_number) DO NOTHING
      `;
    } catch (e) {
      console.error("  case seed failed:", c.caseNumber, e);
    }
  }
  console.log(`  ✓ ${SAMPLE_CASES.length} 判例 seeded`);

  // Guidelines
  for (const g of SAMPLE_GUIDELINES) {
    try {
      const existing = (await sql`
        SELECT id FROM official_guidelines WHERE title = ${g.title} LIMIT 1
      `) as Array<{ id: string }>;
      if (existing.length > 0) continue;

      const insertResult = (await sql`
        INSERT INTO official_guidelines (
          ministry, title, document_number, issued_date, url, full_text
        ) VALUES (
          ${g.ministry}, ${g.title}, ${g.documentNumber},
          ${g.issuedDate}, ${g.url}, ${g.fullText}
        )
        RETURNING id
      `) as Array<{ id: string }>;
      const gid = insertResult[0].id;
      const chunks = chunkText(g.fullText, 800, 100);
      for (let i = 0; i < chunks.length; i++) {
        const { embedding } = await embedSafe({
          context: { userId, operation: "guideline_seed" },
          text: chunks[i],
        });
        const embeddingStr = `[${embedding.join(",")}]`;
        await sql`
          INSERT INTO guideline_chunks (guideline_id, chunk_index, content, embedding)
          VALUES (${gid}, ${i}, ${chunks[i]}, ${embeddingStr}::vector)
        `;
      }
    } catch (e) {
      console.error("  guideline seed failed:", g.title, e);
    }
  }
  console.log(`  ✓ ${SAMPLE_GUIDELINES.length} ガイドライン seeded`);
}

async function seedSamplePastDocument(userId: string) {
  console.log("Seeding sample past document for RAG...");
  const { embedSafe } = await import("../src/lib/ai-wrapper");
  const { chunkText } = await import("../src/lib/embeddings");
  const sql = neon(process.env.DATABASE_URL!);

  const sampleDoc = {
    title: "サンプル準備書面 - 賃貸借契約解除請求事件",
    documentType: "準備書面",
    caseCategory: "realestate",
    content: `準 備 書 面（１）

令和6年(ワ)第XXXX号 建物明渡請求事件
原告 ○○○○
被告 △△△△

東京地方裁判所民事第XX部合議係 御中

令和6年X月X日

原告訴訟代理人弁護士 □□□□

第1 はじめに
本件は、原告が被告に対し、賃貸借契約の解除に基づく建物明渡及び未払賃料の支払を求める事案である。被告は、賃料の支払を怠り、原告からの催告にも応じないため、原告は本訴を提起するに至った。

第2 当事者の主張に対する反論
1 被告は、賃料の不払について、家賃減額請求の意思表示をしたと主張するが、被告の主張する減額事由は借地借家法32条の「建物の租税その他の負担の増減」「経済事情の変動」「近傍同種の建物の借賃に比較して不相当となったとき」のいずれにも該当しない。

2 さらに、仮に減額請求の効力が認められたとしても、減額の範囲は当事者の合意又は裁判所の判決によって確定されるまでは、被告は従前の賃料額を支払う義務を負う（最判昭和56年4月20日民集35巻3号656頁）。被告がこれを怠ったことは、賃貸借契約の継続を著しく困難ならしめる重大な債務不履行に該当する。

第3 信頼関係破壊の法理について
1 賃貸借契約の解除における信頼関係破壊の法理については、3か月以上の賃料不払が継続した場合、特段の事情のない限り信頼関係は破壊されたものと解するのが判例・通説である。

2 本件において、被告の賃料不払は令和X年X月から本書面提出時点まで X か月に及んでおり、信頼関係は完全に破壊されている。

第4 結論
以上のとおり、原告の請求は理由があるから、原告の請求どおりの判決を求める。

以上`,
  };

  // Insert document
  const result = (await sql`
    INSERT INTO past_documents (
      user_id, title, document_type, case_category, content, metadata
    ) VALUES (
      ${userId}, ${sampleDoc.title}, ${sampleDoc.documentType},
      ${sampleDoc.caseCategory}, ${sampleDoc.content},
      ${JSON.stringify({ fileName: "sample_jumbi_shomen.txt", fileSize: sampleDoc.content.length })}
    )
    RETURNING id
  `) as Array<{ id: string }>;

  const docId = result[0].id;

  // Chunk + embed
  const chunks = chunkText(sampleDoc.content, 800, 100);
  for (let i = 0; i < chunks.length; i++) {
    try {
      const { embedding } = await embedSafe({
        context: { userId, operation: "rag_ingest" },
        text: chunks[i],
      });
      const embeddingStr = `[${embedding.join(",")}]`;
      await sql`
        INSERT INTO document_chunks (
          document_id, user_id, chunk_index, content, embedding
        ) VALUES (
          ${docId}, ${userId}, ${i}, ${chunks[i]}, ${embeddingStr}::vector
        )
      `;
    } catch (e) {
      console.error("  chunk embed failed:", e);
    }
  }
  console.log(`  ✓ 1 sample 準備書面 added (${chunks.length} chunks)`);
}

async function main() {
  console.log("=== Test Account Setup ===\n");

  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY not found in .env.local");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not found in .env.local");
  }

  const userId = await createOrFindUser();
  await setupSubscription(userId);
  await setupUserSettings(userId);
  await seedCourtCases(userId);
  await seedSamplePastDocument(userId);

  console.log("\n=== ✓ Test Account Ready ===");
  console.log("");
  console.log(`URL:      https://legal-twin.vercel.app/sign-in`);
  console.log(`Email:    ${TEST_EMAIL}`);
  console.log(`Password: ${TEST_PASSWORD}`);
  console.log(`User ID:  ${userId}`);
  console.log("");
  console.log("Setup includes:");
  console.log("  ✓ Pro plan (active, 90 days)");
  console.log("  ✓ User settings initialized");
  console.log("  ✓ 8 court cases (Supreme Court samples)");
  console.log("  ✓ 3 official guidelines (FSA, MHLW, METI)");
  console.log("  ✓ 1 sample past document for RAG");
}

main().catch((e) => {
  console.error("\n=== ERROR ===");
  console.error(e);
  process.exit(1);
});
