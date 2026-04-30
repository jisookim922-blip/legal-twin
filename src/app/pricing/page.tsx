"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Check, Loader2, Scale, ArrowRight } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";
import Footer from "@/components/Footer";

export default function PricingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  const handleSubscribe = async (plan: PlanId) => {
    if (!isSignedIn) {
      window.location.href = `/sign-up?redirect_url=/pricing`;
      return;
    }
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "エラーが発生しました");
      }
    } catch {
      alert("決済ページへの遷移に失敗しました");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-blue-600 p-2 rounded-xl shadow-sm text-white">
            <Scale size={18} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg">LegalTwin</span>
        </Link>
        <div className="flex items-center gap-2">
          {isLoaded && isSignedIn ? (
            <Link
              href="/app"
              className="px-4 md:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] md:text-[14px] font-medium rounded-full transition-colors shadow-sm whitespace-nowrap"
            >
              ワークスペースへ
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="px-4 py-2 text-[13px] md:text-[14px] font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap"
            >
              ログイン
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">料金プラン</h1>
        <p className="text-lg text-gray-500">
          14日間無料トライアル ・ クレカ登録不要 ・ いつでも解約可能
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(Object.values(PLANS) as (typeof PLANS)[PlanId][]).map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-[32px] p-8 flex flex-col relative ${
                p.highlighted
                  ? "border-2 border-blue-500 shadow-xl"
                  : "border border-gray-100 shadow-sm"
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  おすすめ
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {p.name}
              </h3>
              <p className="text-[13px] text-gray-500 mb-6 min-h-[40px]">
                {p.description}
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ¥{p.priceJpy.toLocaleString()}
                </span>
                <span className="text-gray-500 text-[14px] ml-1">/ 月</span>
                <p className="text-[11px] text-gray-400 mt-1">税抜き・年払い10%引き</p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {p.features.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[13px] text-gray-700"
                  >
                    <Check
                      size={14}
                      className="text-green-500 mt-0.5 shrink-0"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(p.id)}
                disabled={loadingPlan === p.id}
                className={`w-full py-3.5 rounded-full font-medium text-[14px] flex items-center justify-center gap-2 transition-colors ${
                  p.highlighted
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } disabled:opacity-50`}
              >
                {loadingPlan === p.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {isSignedIn ? "このプランで始める" : "14日間無料ではじめる"}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 text-[13px] text-gray-500">
          <p>
            すべてのプランに 14日間無料トライアル付き。
            <br />
            トライアル終了時に自動でサブスクリプションが開始されます。
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold mb-8 text-center">よくある質問</h2>
        <div className="space-y-4">
          {[
            {
              q: "途中でプランを変更できますか？",
              a: "はい、いつでもアップグレード・ダウングレードできます。アップグレードは即時反映、ダウングレードは次回更新時に適用されます。",
            },
            {
              q: "データは事務所に共有されますか？",
              a: "いいえ。LegalTwinは個人アカウント制です。あなたの書面・分身AIの学習データは、あなた本人のみがアクセスできます。転職時もデータをエクスポートして持ち出せます。",
            },
            {
              q: "守秘義務違反にならないですか？",
              a: "全データは暗号化保存され、AI送信時は Zero Retention 契約（学習に使われない）を結んでいます。ただし機密性の高い案件では依頼者の同意取得を推奨します。",
            },
            {
              q: "解約はどこからできますか？",
              a: "ワークスペース内の「プラン管理」からStripeカスタマーポータルに遷移し、いつでも解約できます。違約金は一切ありません。",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-2xl p-5"
            >
              <h3 className="font-semibold text-[14px] mb-2">{f.q}</h3>
              <p className="text-[13px] text-gray-600 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
