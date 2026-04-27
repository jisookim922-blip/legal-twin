"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Clock, Banknote, Sparkles } from "lucide-react";

interface ROIData {
  thisMonth: {
    operations: number;
    minutesSaved: number;
    yenValue: number;
    roi: number;
  };
  allTime: {
    operations: number;
    minutesSaved: number;
    yenValue: number;
  };
  byOperation: Array<{
    operation: string;
    count: number;
    minutes: number;
    yen: number;
  }>;
}

const OP_LABELS: Record<string, string> = {
  document_generate: "書面起案",
  chat: "AIチャット",
  search: "判例検索",
  analyze_facts: "事実整理",
  self_review: "セルフレビュー",
  rag_ingest: "ナレッジ追加",
};

interface ROIDashboardProps {
  userId: string;
}

export default function ROIDashboard({ userId }: ROIDashboardProps) {
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/usage/summary?userId=${userId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 border-b border-gray-100 bg-white">
        <div className="h-32 bg-gray-50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const hours = Math.floor(data.thisMonth.minutesSaved / 60);
  const mins = data.thisMonth.minutesSaved % 60;

  return (
    <div className="p-6 border-b border-gray-100 bg-white shrink-0">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-green-500" />
        今月のROI
        <span className="text-[11px] text-gray-400 font-normal ml-1">
          LegalTwinが節約した時間と金額
        </span>
      </h3>

      {/* Headline stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[11px] text-blue-600 font-semibold uppercase tracking-wider mb-1">
            <Clock size={12} /> 節約時間
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {hours > 0 && <>{hours}時間</>}
            {mins > 0 && <>{mins}分</>}
            {hours === 0 && mins === 0 && "0分"}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {data.thisMonth.operations} 件の操作
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[11px] text-green-600 font-semibold uppercase tracking-wider mb-1">
            <Banknote size={12} /> 金額換算
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ¥{data.thisMonth.yenValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            弁護士時給¥15,000で計算
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[11px] text-purple-600 font-semibold uppercase tracking-wider mb-1">
            <Sparkles size={12} /> ROI倍率
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.thisMonth.roi.toFixed(1)}x
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            月額¥30,000に対する効果
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {data.byOperation.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            内訳（今月）
          </div>
          {data.byOperation.map((op) => {
            const maxYen = Math.max(...data.byOperation.map((o) => o.yen), 1);
            const pct = (op.yen / maxYen) * 100;
            return (
              <div key={op.operation} className="flex items-center gap-3">
                <div className="w-20 text-[12px] text-gray-600 font-medium shrink-0">
                  {OP_LABELS[op.operation] ?? op.operation}
                </div>
                <div className="flex-1 h-6 bg-gray-50 rounded-lg relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg transition-all"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-[11px] font-medium text-gray-700">
                    {op.count}回 ・ ¥{op.yen.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data.allTime.operations > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-[12px] text-gray-500">
          累計：
          <span className="font-semibold text-gray-700">
            {" "}
            {Math.floor(data.allTime.minutesSaved / 60)}時間
          </span>{" "}
          節約・
          <span className="font-semibold text-gray-700">
            ¥{data.allTime.yenValue.toLocaleString()}
          </span>{" "}
          相当の価値を創出
        </div>
      )}
    </div>
  );
}
