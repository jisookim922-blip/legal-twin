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

const TEST_EMAIL = "test-lawyer@legaltwin-demo.app";
const CLERK_API = "https://api.clerk.com/v1";
const APP_URL = "https://legal-twin.vercel.app";

async function main() {
  const headers = {
    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  // Find user
  const search = await fetch(
    `${CLERK_API}/users?email_address=${encodeURIComponent(TEST_EMAIL)}`,
    { headers }
  );
  const users = (await search.json()) as Array<{ id: string }>;
  if (users.length === 0) throw new Error("Test user not found");
  const userId = users[0].id;
  console.log(`User: ${userId}`);

  // Create sign-in token (bypasses 2FA / device verification)
  const tokenRes = await fetch(`${CLERK_API}/sign_in_tokens`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: userId,
      expires_in_seconds: 60 * 60 * 24 * 7, // 7 days
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Token creation failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }

  const data = (await tokenRes.json()) as { token: string; id: string };
  const signInUrl = `${APP_URL}/sign-in?__clerk_ticket=${data.token}`;

  console.log("\n=== ✓ One-click Sign-in Link Created ===\n");
  console.log("Click this URL to sign in directly (no password, no code):");
  console.log("");
  console.log(signInUrl);
  console.log("");
  console.log(`Token ID: ${data.id}`);
  console.log("Valid for: 7 days");
  console.log("");
  console.log("Standard sign-in (with password) still works:");
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Password: LegalTwin2026!Demo`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
