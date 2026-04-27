"use client";

import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";

interface Citation {
  originalText: string;
  type: "law" | "case" | "regulation" | "book";
  normalized: string;
  lawName?: string;
  article?: string;
  courtDate?: string;
  status: "verified" | "unverified" | "not_found";
  sourceUrl?: string | null;
}

interface CitationVerifierProps {
  content: string;
}

export default function CitationVerifier({ content }: CitationVerifierProps) {
  const [citations, setCitations] = useState<Citation[] | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/verify-law", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Verification failed");
      const data = await res.json();
      setCitations(data.citations ?? []);
    } catch {
      setCitations([]);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: Citation["status"]) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 rounded-full">
            <ShieldCheck size={10} /> 確認済
          </span>
        );
      case "not_found":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 rounded-full">
            <AlertTriangle size={10} /> 見つからず
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            <HelpCircle size={10} /> 未検証
          </span>
        );
    }
  };

  const typeLabel = (t: Citation["type"]) =>
    ({ law: "条文", case: "判例", regulation: "政省令", book: "文献" }[t]);

  return (
    <div>
      <button
        onClick={verify}
        disabled={loading || !content.trim()}
        className="w-full py-2.5 rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 font-medium text-[13px] flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            引用をチェック中...
          </>
        ) : (
          <>
            <Search size={14} />
            引用条文・判例を検証
          </>
        )}
      </button>

      {citations !== null && (
        <div className="mt-3 space-y-2">
          {citations.length === 0 ? (
            <p className="text-[12px] text-gray-400 text-center py-2">
              引用が見つかりませんでした
            </p>
          ) : (
            citations.map((c, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border ${
                  c.status === "verified"
                    ? "bg-green-50/50 border-green-100"
                    : c.status === "not_found"
                      ? "bg-red-50/50 border-red-100"
                      : "bg-amber-50/50 border-amber-100"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-gray-500 font-medium">
                        {typeLabel(c.type)}
                      </span>
                      {statusBadge(c.status)}
                    </div>
                    <p className="text-[13px] text-gray-900 font-medium mt-1 leading-snug">
                      {c.normalized || c.originalText}
                    </p>
                    {c.sourceUrl && (
                      <a
                        href={c.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 mt-1"
                      >
                        <ExternalLink size={10} />
                        e-Govで確認
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
