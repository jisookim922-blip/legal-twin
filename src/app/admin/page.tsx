"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  BookOpen,
  Loader2,
  Sparkles,
  Trash2,
  Check,
} from "lucide-react";

interface Counts {
  cases: number;
  guidelines: number;
  guideline_chunks: number;
}

export default function AdminPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/admin/seed");
    if (res.ok) setCounts(await res.json());
  };

  useEffect(() => {
    refresh();
  }, []);

  const seed = async (target: "cases" | "guidelines" | "all") => {
    setLoading(true);
    try {
      await fetch(`/api/admin/seed?target=${target}`, { method: "POST" });
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!confirm("システムシードデータをすべて削除しますか？")) return;
    setLoading(true);
    try {
      await fetch("/api/admin/seed", { method: "DELETE" });
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <nav className="max-w-4xl mx-auto px-6 py-6">
        <Link
          href="/app"
          className="inline-flex items-center gap-1 text-[13px] text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={14} /> ワークスペースに戻る
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pb-16">
        <h1 className="text-3xl font-bold mb-2">ナレッジベース管理</h1>
        <p className="text-gray-500 text-[14px] mb-10">
          検証済み判例・公的ガイドラインを管理します。書面生成時に自動参照され、ハルシネーションを防ぎます。
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card
            icon={<Database size={20} className="text-blue-500" />}
            label="判例"
            value={counts?.cases ?? "-"}
            sub="件"
          />
          <Card
            icon={<BookOpen size={20} className="text-purple-500" />}
            label="ガイドライン"
            value={counts?.guidelines ?? "-"}
            sub="本"
          />
          <Card
            icon={<Sparkles size={20} className="text-green-500" />}
            label="チャンク"
            value={counts?.guideline_chunks ?? "-"}
            sub="個"
          />
        </div>

        {/* Seed actions */}
        <section className="bg-white rounded-[24px] border border-gray-100 p-6 mb-5 shadow-sm">
          <h2 className="text-[16px] font-bold mb-2">サンプルデータ投入</h2>
          <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
            動作確認用のサンプル判例 8件と公的ガイドライン 3本を一括投入します。
            ベクトル化されてRAG検索に使えるようになります。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => seed("all")}
              disabled={loading}
              className="py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-[13px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              全部投入
            </button>
            <button
              onClick={() => seed("cases")}
              disabled={loading}
              className="py-3 rounded-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-[13px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              判例のみ
            </button>
            <button
              onClick={() => seed("guidelines")}
              disabled={loading}
              className="py-3 rounded-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-[13px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              ガイドラインのみ
            </button>
          </div>
        </section>

        {/* Reset */}
        <section className="bg-white rounded-[24px] border border-gray-100 p-6 mb-5 shadow-sm">
          <h2 className="text-[16px] font-bold mb-2 text-red-700">
            データリセット
          </h2>
          <p className="text-[13px] text-gray-500 mb-4">
            システムシードデータを全削除します（ユーザー追加データは残ります）。
          </p>
          <button
            onClick={reset}
            disabled={loading}
            className="py-3 px-5 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-medium text-[13px] flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
            シードデータを削除
          </button>
        </section>

        {/* Help */}
        <section className="bg-blue-50 border border-blue-100 rounded-[20px] p-5 text-[13px] text-blue-900">
          <div className="flex gap-2">
            <Check size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold mb-1">使い方</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800/80">
                <li>「全部投入」を押してサンプルを登録</li>
                <li>ワークスペースに戻り、Phase 3 で書面生成</li>
                <li>生成された書面の右パネルで引用を確認</li>
                <li>登録済みの判例だけが引用される</li>
              </ol>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-[20px] border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="text-[13px] text-gray-400">{sub}</span>
      </div>
    </div>
  );
}
