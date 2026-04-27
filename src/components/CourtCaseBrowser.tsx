"use client";

import { useState } from "react";
import { Search, Loader2, ExternalLink, Database } from "lucide-react";

interface CourtCase {
  id: string;
  case_number: string;
  court: string;
  decision_date: string;
  case_type: string | null;
  field: string | null;
  summary: string | null;
  outcome: string | null;
  citation: string | null;
  source_url: string | null;
  similarity?: number;
}

const FIELDS = [
  "全分野",
  "労働",
  "不動産",
  "相続",
  "離婚",
  "債権",
  "刑事",
  "知的財産",
  "企業法務",
];

export default function CourtCaseBrowser() {
  const [query, setQuery] = useState("");
  const [field, setField] = useState("全分野");
  const [results, setResults] = useState<CourtCase[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cases/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          field: field === "全分野" ? undefined : field,
          limit: 15,
        }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border-b border-gray-100 bg-white shrink-0">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-3">
        <Database size={16} className="text-blue-500" />
        検証済み判例DB検索
        <span className="text-[11px] text-gray-400 font-normal ml-1">
          実在判例のみ・出典付き
        </span>
      </h3>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="争点・キーワードを入力（例：労働者派遣、賃貸借更新拒絶）"
          className="flex-1 bg-gray-50 focus:bg-white border border-transparent focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-2.5 text-[14px] outline-none transition-all"
        />
        <button
          onClick={search}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Search size={14} />
          )}
        </button>
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        {FIELDS.map((f) => (
          <button
            key={f}
            onClick={() => setField(f)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
              field === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar mt-3">
          {results.map((r) => (
            <div
              key={r.id}
              className="bg-gray-50 border border-gray-100 rounded-2xl p-3 hover:bg-white hover:border-blue-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                    <span className="text-[12px] font-mono font-semibold text-blue-700">
                      {r.case_number}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {r.court}
                    </span>
                    {r.field && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">
                        {r.field}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-700 leading-snug line-clamp-2">
                    {r.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                    <span>
                      {new Date(r.decision_date).toLocaleDateString("ja-JP")}
                    </span>
                    {r.outcome && (
                      <span className="text-gray-500">{r.outcome}</span>
                    )}
                    {r.citation && (
                      <span className="text-gray-500">{r.citation}</span>
                    )}
                  </div>
                </div>
                {typeof r.similarity === "number" && (
                  <span className="text-[10px] font-bold text-blue-600 shrink-0">
                    {Math.round(r.similarity * 100)}%
                  </span>
                )}
              </div>
              {r.source_url && (
                <a
                  href={r.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 mt-1"
                >
                  <ExternalLink size={10} />
                  裁判所サイトで全文を確認
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <p className="text-[12px] text-gray-400 text-center py-4">
          該当する判例が見つかりませんでした。
          <br />
          管理画面でデータを投入してください。
        </p>
      )}
    </div>
  );
}
