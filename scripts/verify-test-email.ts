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

interface ClerkEmail {
  id: string;
  email_address: string;
  verification: { status: string; strategy: string } | null;
}

interface ClerkUser {
  id: string;
  email_addresses: ClerkEmail[];
}

async function main() {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY missing");
  }
  const headers = {
    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  console.log(`Looking up user by email: ${TEST_EMAIL}`);
  const searchRes = await fetch(
    `${CLERK_API}/users?email_address=${encodeURIComponent(TEST_EMAIL)}`,
    { headers }
  );
  if (!searchRes.ok) {
    throw new Error(`Search failed: ${searchRes.status} ${await searchRes.text()}`);
  }
  const users = (await searchRes.json()) as ClerkUser[];
  if (users.length === 0) {
    throw new Error(`No user found for ${TEST_EMAIL}. Run setup-test-account.ts first.`);
  }

  const user = users[0];
  console.log(`  Found user: ${user.id}`);
  console.log(`  Emails:`, user.email_addresses.map(e => ({
    id: e.id,
    address: e.email_address,
    status: e.verification?.status,
    strategy: e.verification?.strategy,
  })));

  // For each email, set verified status via PATCH
  for (const email of user.email_addresses) {
    if (email.verification?.status === "verified") {
      console.log(`  ✓ ${email.email_address} already verified`);
      continue;
    }

    console.log(`  Verifying ${email.email_address} (${email.id})...`);

    // Method 1: try PATCH email_addresses/{id} with verified flag
    const patchRes = await fetch(`${CLERK_API}/email_addresses/${email.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        verified: true,
        primary: true,
      }),
    });

    if (patchRes.ok) {
      console.log(`  ✓ Marked verified via PATCH`);
      continue;
    }

    const errText = await patchRes.text();
    console.log(`  PATCH failed: ${patchRes.status}, trying alternative...`);
    console.log(`  Error: ${errText.substring(0, 200)}`);

    // Method 2: delete and re-add as verified
    console.log(`  Deleting and re-creating email as verified...`);
    const deleteRes = await fetch(`${CLERK_API}/email_addresses/${email.id}`, {
      method: "DELETE",
      headers,
    });
    if (!deleteRes.ok) {
      console.log(`  Delete failed: ${deleteRes.status}`);
      continue;
    }

    const createRes = await fetch(`${CLERK_API}/email_addresses`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: user.id,
        email_address: email.email_address,
        verified: true,
        primary: true,
      }),
    });
    if (createRes.ok) {
      console.log(`  ✓ Re-created as verified`);
    } else {
      console.log(`  Re-create failed: ${createRes.status} ${await createRes.text()}`);
    }
  }

  // Re-check
  console.log("\nRe-checking verification status...");
  const recheckRes = await fetch(`${CLERK_API}/users/${user.id}`, { headers });
  const updated = (await recheckRes.json()) as ClerkUser;
  console.log("Final emails:", updated.email_addresses.map(e => ({
    address: e.email_address,
    status: e.verification?.status,
  })));

  console.log("\n=== Done ===");
  console.log("Test user can now sign in without email verification code.");
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Password: LegalTwin2026!Demo`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
