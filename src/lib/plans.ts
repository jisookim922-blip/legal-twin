/**
 * Plan definitions — safe to import from both client and server.
 * No Stripe SDK or secret key reference here.
 */

export type PlanId = "solo" | "pro" | "elite";

export interface PlanDef {
  id: PlanId;
  name: string;
  priceJpy: number;
  description: string;
  features: string[];
  priceIdEnv: string;
  highlighted?: boolean;
}

export const PLANS: Record<PlanId, PlanDef> = {
  solo: {
    id: "solo",
    name: "Solo",
    priceJpy: 9800,
    description: "開業1〜5年目のソロ弁護士向け。時短特化。",
    features: [
      "訴訟書面AI生成",
      "判例検索",
      "コンフリクトチェック",
      "期日・タスク管理",
      "Word (.docx) 出力",
      "月 100 件まで AI 操作",
    ],
    priceIdEnv: "STRIPE_PRICE_ID_SOLO",
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceJpy: 30000,
    description: "開業5〜15年目の中堅弁護士向け。分身AI核心機能。",
    features: [
      "Solo の全機能",
      "✨ 過去書面RAG（分身AIパーソナライズ）",
      "✨ AI セルフレビュー（ハルシネーション検知）",
      "✨ e-Gov法令APIによる条文検証",
      "✨ ROI ダッシュボード",
      "✨ 無制限 AI 操作",
      "優先サポート",
    ],
    priceIdEnv: "STRIPE_PRICE_ID_PRO",
    highlighted: true,
  },
  elite: {
    id: "elite",
    name: "Elite",
    priceJpy: 50000,
    description: "独立志向・年商5,000万超の弁護士向け。経営支援。",
    features: [
      "Pro の全機能",
      "💎 完全ローカル LLM オプション（機密案件対応）",
      "💎 集客支援（SEO記事、SNS投稿生成）",
      "💎 24時間 AI 初回相談窓口",
      "💎 経営ダッシュボード",
      "💎 専任 CS サポート（月1回30分コーチング）",
    ],
    priceIdEnv: "STRIPE_PRICE_ID_ELITE",
  },
};

export function getPriceId(planId: PlanId): string | undefined {
  return process.env[PLANS[planId].priceIdEnv];
}
