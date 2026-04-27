"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Shield,
  AlertCircle,
  Database,
  TrendingUp,
  Clock,
} from "lucide-react";

interface EvalData {
  thisMonth: {
    operations: number;
    casesTouched: number;
    avgDurationMs: number;
    piiMasked: number;
    errors: number;
    confidentialOps: number;
  };
  byOperation: Array<{ operation: string; count: number; avg_ms: number | null }>;
  piiBreakdown: Array<{ pii_type: string; count: number }>;
  knowledge: { past_docs: number; court_cases: number; guidelines: number };
  quality: {
    reviewsRun: number;
    avgScore: number | null;
    criticalIssues: number;
    hallucinations: number;
    citationAccuracy: number | null;
  };
}

const OP_LABELS: Record<string, string> = {
  chat: "AIチャット",
  document_generate: "書面生成",
  search: "判例検索",
  analyze_facts: "事実整理",
  self_review: "セルフレビュー",
  rag_ingest: "ナレッジ追加",
  rag_search_for_generate: "RAG検索",
  court_case_search: "判例DB検索",
  guideline_search: "ガイドライン検索",
  court_case_seed: "判例投入",
  guideline_seed: "ガイドライン投入",
};

export default function EvaluationDashboard() {
  const [data, setData] = useState<EvalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/evaluation")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-32 bg-gray-50 rounded-2xl animate-pulse" />
      </div>
    );
  }
  if (!data) return null;

  const errorRate =
    data.thisMonth.operations > 0
      ? Math.round((data.thisMonth.errors / data.thisMonth.operations) * 100)
      : 0;

  return (
    <div className="p-6 border-b border-gray-100 bg-white">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Activity size={16} className="text-purple-500" />
        モデル品質ダッシュボード
        <span className="text-[11px] text-gray-400 font-normal ml-1">
          今月の AI 動作品質を可視化
        </span>
      </h3>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Metric
          icon={<TrendingUp size={14} className="text-blue-500" />}
          label="操作回数"
          value={data.thisMonth.operations}
          sub="件"
        />
        <Metric
          icon={<Shield size={14} className="text-green-500" />}
          label="PII マスク"
          value={data.thisMonth.piiMasked}
          sub="件マスク済"
          color="green"
        />
        <Metric
          icon={<AlertCircle size={14} className="text-amber-500" />}
          label="エラー率"
          value={errorRate}
          sub="%"
          color="amber"
        />
        <Metric
          icon={<Clock size={14} className="text-gray-500" />}
          label="平均応答"
          value={Math.round(data.thisMonth.avgDurationMs / 100) / 10}
          sub="秒"
        />
      </div>

      {/* Quality */}
      {data.quality.reviewsRun > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4 mb-4">
          <h4 className="text-[12px] font-semibold text-purple-700 uppercase tracking-wider mb-2">
            セルフレビュー結果（{data.quality.reviewsRun} 件）
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[13px]">
            <div>
              <span className="text-gray-500">平均スコア</span>
              <div className="text-2xl font-bold text-gray-900">
                {data.quality.avgScore ?? "-"}
                <span className="text-[12px] text-gray-400">/100</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">致命的問題</span>
              <div className="text-2xl font-bold text-red-600">
                {data.quality.criticalIssues}
              </div>
            </div>
            <div>
              <span className="text-gray-500">ハルシネーション</span>
              <div className="text-2xl font-bold text-amber-600">
                {data.quality.hallucinations}
              </div>
            </div>
            <div>
              <span className="text-gray-500">引用正確性</span>
              <div className="text-2xl font-bold text-green-600">
                {data.quality.citationAccuracy ?? "-"}
                <span className="text-[12px] text-gray-400">%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge base */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <KnowledgeCard
          label="過去書面"
          value={data.knowledge.past_docs}
          color="blue"
        />
        <KnowledgeCard
          label="検証済み判例"
          value={data.knowledge.court_cases}
          color="purple"
        />
        <KnowledgeCard
          label="ガイドライン"
          value={data.knowledge.guidelines}
          color="green"
        />
      </div>

      {/* Operations */}
      {data.byOperation.length > 0 && (
        <details className="text-[12px]">
          <summary className="cursor-pointer text-gray-500 font-medium">
            操作別の内訳を表示
          </summary>
          <div className="mt-2 space-y-1">
            {data.byOperation.map((op) => (
              <div
                key={op.operation}
                className="flex items-center justify-between py-1 text-[12px]"
              >
                <span className="text-gray-700">
                  {OP_LABELS[op.operation] ?? op.operation}
                </span>
                <span className="text-gray-500 font-mono">
                  {op.count}回 ・ 平均 {Math.round((op.avg_ms ?? 0) / 100) / 10}秒
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  color = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
  color?: "blue" | "green" | "amber";
}) {
  const colorClass =
    color === "green"
      ? "from-green-50 to-emerald-50 border-green-100"
      : color === "amber"
        ? "from-amber-50 to-orange-50 border-amber-100"
        : "from-blue-50 to-indigo-50 border-blue-100";
  return (
    <div
      className={`bg-gradient-to-br border rounded-2xl p-3 ${colorClass}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 mb-1">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-[11px] text-gray-400">{sub}</span>
      </div>
    </div>
  );
}

function KnowledgeCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "purple" | "green";
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    green: "bg-green-50 text-green-700 border-green-100",
  };
  return (
    <div
      className={`border rounded-2xl p-3 flex items-center gap-3 ${colorMap[color]}`}
    >
      <Database size={18} />
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
          {label}
        </div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
