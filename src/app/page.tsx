import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Scale,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  FileText,
  Brain,
  ArrowRight,
  Check,
} from "lucide-react";
import Footer from "@/components/Footer";

export default async function LandingPage() {
  const user = await currentUser();
  if (user) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-2 rounded-xl shadow-sm text-white">
            <Scale size={18} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg">LegalTwin</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="px-4 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            料金
          </Link>
          <Link
            href="/sign-in"
            className="px-4 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            ログイン
          </Link>
          <Link
            href="/sign-up"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-medium rounded-full transition-colors shadow-sm"
          >
            14日間無料ではじめる
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-6">
          <Sparkles size={12} className="text-blue-600" />
          <span className="text-[12px] font-semibold text-blue-700">
            弁護士個人のための分身AI
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          もう一人の自分を、
          <br />
          24時間雇う。
        </h1>
        <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
          あなたの過去の書面・文体・判断パターンを学習したAIが、
          <br className="hidden md:block" />
          訴状起案から判例検索まで、月20時間以上の業務を自動化します。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/sign-up"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors shadow-md flex items-center gap-2"
          >
            14日間無料ではじめる
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-4 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-full transition-colors"
          >
            料金を見る
          </Link>
        </div>
        <p className="text-[12px] text-gray-400 mt-4">
          クレジットカード登録不要 ・ いつでも解約可能
        </p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Brain,
              title: "あなたの文体で書面を起案",
              desc: "過去の訴状・準備書面をRAGで学習。分身AIがあなたの判断パターンと表現を再現します。",
              color: "purple",
            },
            {
              icon: ShieldCheck,
              title: "ハルシネーション撲滅",
              desc: "別AIによる二重検証と、e-Gov法令APIによる条文・判例の実在確認を標準搭載。",
              color: "green",
            },
            {
              icon: TrendingUp,
              title: "ROIが可視化",
              desc: "節約時間・金額換算をリアルタイム表示。月¥30,000の投資対効果を数値で確認できます。",
              color: "blue",
            },
            {
              icon: FileText,
              title: "Word (.docx) 出力",
              desc: "既存のWordワークフローと完全互換。トラックチェンジも使えます。",
              color: "indigo",
            },
            {
              icon: Sparkles,
              title: "5フェーズ一気通貫",
              desc: "相談受付→調査→書面→期日→終結まで、全業務を1つのツールで。",
              color: "amber",
            },
            {
              icon: ShieldCheck,
              title: "個人データは完全隔離",
              desc: "事務所に依存しない個人アカウント。転職時もあなたの分身AIを連れていけます。",
              color: "red",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-${f.color}-50 text-${f.color}-600`}
                style={{
                  backgroundColor: `var(--tw-color-${f.color}-50, #eff6ff)`,
                }}
              >
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-[15px] mb-2">{f.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-[32px] p-10 text-center">
          <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed mb-4">
            「開業5年目、月20時間節約できた理由は
            <br className="hidden md:block" />
            自分の分身AIを作ったから」
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 flex-wrap text-[13px] text-gray-600">
            <span className="flex items-center gap-1">
              <Check size={14} className="text-green-500" />
              月¥300,000相当の時間削減
            </span>
            <span className="flex items-center gap-1">
              <Check size={14} className="text-green-500" />
              新規受任8件増
            </span>
            <span className="flex items-center gap-1">
              <Check size={14} className="text-green-500" />
              月¥180,000の請求漏れ防止
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          今すぐ、分身AIを作成する。
        </h2>
        <p className="text-gray-500 mb-8">
          14日間無料。クレカ不要。いつでも解約。
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors shadow-md"
        >
          無料ではじめる
          <ArrowRight size={16} />
        </Link>
      </section>

      <Footer />
    </div>
  );
}
