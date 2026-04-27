import Stripe from "stripe";
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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

interface PlanConfig {
  key: "SOLO" | "PRO" | "ELITE";
  name: string;
  description: string;
  priceJpy: number;
}

const PLANS: PlanConfig[] = [
  {
    key: "SOLO",
    name: "LegalTwin Solo",
    description: "開業1〜5年目のソロ弁護士向け。時短特化プラン",
    priceJpy: 9800,
  },
  {
    key: "PRO",
    name: "LegalTwin Pro",
    description: "分身AI・RAGパーソナライズ・セルフレビューを含む中堅弁護士向けプラン",
    priceJpy: 30000,
  },
  {
    key: "ELITE",
    name: "LegalTwin Elite",
    description: "ローカルLLM・集客支援・CS伴走付きの独立志向弁護士向けプラン",
    priceJpy: 50000,
  },
];

async function findOrCreateProduct(plan: PlanConfig) {
  // Search existing products by name (to avoid duplicates on re-run)
  const existing = await stripe.products.search({
    query: `name:'${plan.name}'`,
  });

  let product: Stripe.Product;
  if (existing.data.length > 0) {
    product = existing.data[0];
    console.log(`  Using existing product: ${product.id}`);
  } else {
    product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { app: "legaltwin", planKey: plan.key },
    });
    console.log(`  Created product: ${product.id}`);
  }

  // Find or create price
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 10,
  });

  let price = prices.data.find(
    (p) =>
      p.unit_amount === plan.priceJpy &&
      p.currency === "jpy" &&
      p.recurring?.interval === "month"
  );

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceJpy,
      currency: "jpy",
      recurring: { interval: "month" },
      metadata: { app: "legaltwin", planKey: plan.key },
    });
    console.log(`  Created price: ${price.id}`);
  } else {
    console.log(`  Using existing price: ${price.id}`);
  }

  return { product, price };
}

async function setupWebhook() {
  const url = "https://legal-twin.vercel.app/api/stripe/webhook";
  const events: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];

  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  const match = existing.data.find((w) => w.url === url);

  if (match) {
    console.log(`  Using existing webhook: ${match.id}`);
    console.log(
      `  ⚠ Signing secret is only shown at creation time. If STRIPE_WEBHOOK_SECRET isn't set, delete and recreate via dashboard.`
    );
    return { id: match.id, secret: null as string | null };
  }

  const webhook = await stripe.webhookEndpoints.create({
    url,
    enabled_events: events,
    description: "LegalTwin subscription events",
  });
  console.log(`  Created webhook: ${webhook.id}`);
  console.log(`  Signing secret: ${webhook.secret}`);
  return { id: webhook.id, secret: webhook.secret };
}

async function main() {
  console.log("=== LegalTwin Stripe Setup ===\n");

  console.log("Creating products & prices...");
  const priceIds: Record<string, string> = {};
  for (const plan of PLANS) {
    console.log(`\n[${plan.key}] ${plan.name}`);
    const { price } = await findOrCreateProduct(plan);
    priceIds[plan.key] = price.id;
  }

  console.log("\nSetting up webhook...");
  const webhook = await setupWebhook();

  console.log("\n=== Results ===");
  console.log(`STRIPE_PRICE_ID_SOLO=${priceIds.SOLO}`);
  console.log(`STRIPE_PRICE_ID_PRO=${priceIds.PRO}`);
  console.log(`STRIPE_PRICE_ID_ELITE=${priceIds.ELITE}`);
  if (webhook.secret) {
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
  }

  // Save to a temp file for the next step (adding to Vercel env)
  const output = {
    STRIPE_PRICE_ID_SOLO: priceIds.SOLO,
    STRIPE_PRICE_ID_PRO: priceIds.PRO,
    STRIPE_PRICE_ID_ELITE: priceIds.ELITE,
    STRIPE_WEBHOOK_SECRET: webhook.secret,
  };
  fs.writeFileSync(".stripe-config.json", JSON.stringify(output, null, 2));
  console.log("\n✓ Saved to .stripe-config.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
