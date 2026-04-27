"use client";

import { useState } from "react";
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";

interface ReviewIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  description: string;
  suggestion: string;
  quote?: string;
}

interface ReviewCitation {
  text: string;
  type: "law" | "case" | "regulation";
  verified: "likely_real" | "suspicious" | "unknown";
  note: string;
}

interface ReviewResult {
  overallScore: number;
  issues: ReviewIssue[];
  citations: ReviewCitation[];
  summary: string;
}

interface SelfReviewPanelProps {
  documentContent: string;
  documentType: string;
  caseId?: string;
  knownEntities?: { clientName?: string; opposingParty?: string; caseName?: string };
  confidentialMode?: boolean;
}

export default function SelfReviewPanel({
  documentContent,
  documentType,
  caseId,
  knownEntities,
  confidentialMode,
}: SelfReviewPanelProps) {
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runReview = async () => {
    if (!documentContent.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/self-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentContent,
          documentType,
          caseId,
          knownEntities,
          confidentialMode,
        }),
      });
      if (!res.ok) throw new Error("Review failed");
      const data = await res.json();
      setResult(data);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  const severityIcon = (s: ReviewIssue["severity"]) => {
    if (s === "critical") return <AlertCircle size={14} className="text-red-500" />;
    if (s === "warning") return <AlertTriangle size={14} className="text-amber-500" />;
    return <Info size={14} className="text-blue-500" />;
  };

  const severityBg = (s: ReviewIssue["severity"]) =>
    s === "critical"
      ? "bg-red-50 border-red-200"
      : s === "warning"
        ? "bg-amber-50 border-amber-200"
        : "bg-blue-50 border-blue-200";

  const criticalCount =
    result?.issues.filter((i) => i.severity === "critical").length ?? 0;

  return (
    <div className="space-y-3">
      <button
        onClick={runReview}
        disabled={loading || !documentContent.trim()}
        className="w-full py-2.5 rounded-2xl border border-purple-200 bg-purple-50 text-purple-700 font-medium text-[13px] flex items-center justify-center gap-2 hover:bg-purple-100 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            AIが二重チェック中...
          </>
        ) : (
          <>
            <Sparkles size={14} />
            セルフレビューを実行（別AIで再検証）
          </>
        )}
      </button>

      {result && (
        <div className="space-y-3">
          {/* Score */}
          <div
            className={`p-4 rounded-2xl border ${
              criticalCount > 0
                ? "bg-red-50 border-red-200"
                : result.overallScore >= 80
                  ? "bg-green-50 border-green-200"
                  : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider">
                品質スコア
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {result.overallScore}
                <span className="text-[14px] text-gray-400">/100</span>
              </span>
            </div>
            <p className="text-[12px] text-gray-700 leading-relaxed">
              {result.summary}
            </p>
            {criticalCount > 0 && (
              <p className="text-[12px] text-red-700 font-semibold mt-2 flex items-center gap-1">
                <AlertCircle size={12} />
                送付前に必ず修正が必要な問題が{criticalCount}件あります
              </p>
            )}
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                指摘事項
              </h4>
              {result.issues.map((issue, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border ${severityBg(issue.severity)}`}
                >
                  <div className="flex items-start gap-2 mb-1">
                    {severityIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-gray-600 uppercase">
                          {issue.category}
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-900 font-medium">
                        {issue.description}
                      </p>
                      {issue.quote && (
                        <blockquote className="mt-1 text-[12px] text-gray-500 italic border-l-2 border-gray-300 pl-2">
                          「{issue.quote}」
                        </blockquote>
                      )}
                      <p className="text-[12px] text-gray-600 mt-1">
                        💡 {issue.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Citations */}
          {result.citations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                引用の検証
              </h4>
              {result.citations.map((c, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg border text-[12px] ${
                    c.verified === "suspicious"
                      ? "bg-red-50 border-red-200"
                      : c.verified === "likely_real"
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {c.verified === "likely_real" ? (
                      <ShieldCheck size={12} className="text-green-500" />
                    ) : c.verified === "suspicious" ? (
                      <AlertCircle size={12} className="text-red-500" />
                    ) : (
                      <Info size={12} className="text-gray-400" />
                    )}
                    <span className="font-medium text-gray-900">{c.text}</span>
                  </div>
                  <p className="text-gray-500 mt-0.5 ml-5">{c.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
