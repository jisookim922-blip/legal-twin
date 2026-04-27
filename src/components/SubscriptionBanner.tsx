"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";

interface SubStatus {
  plan: string;
  status: string;
  trialDaysLeft: number | null;
  hasProAccess: boolean;
}

export default function SubscriptionBanner() {
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then(setSub)
      .catch(() => {});
  }, []);

  if (!sub || dismissed) return null;

  // Trial with days left
  if (sub.status === "trialing" && sub.trialDaysLeft !== null) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-[20px] p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-900">
              無料トライアル中（残り {sub.trialDaysLeft} 日）
            </p>
            <p className="text-[12px] text-gray-500 truncate">
              トライアル終了後も使い続けるには、プランを選択してください
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/pricing"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium rounded-full transition-colors flex items-center gap-1"
          >
            プランを見る
            <ArrowRight size={12} />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Expired trial / canceled
  if (sub.status === "canceled" || (sub.status === "trialing" && sub.trialDaysLeft === 0)) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-[20px] p-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-red-900">
            トライアル期間が終了しました
          </p>
          <p className="text-[12px] text-red-700">
            続けてご利用いただくには、プランを選択してください
          </p>
        </div>
        <Link
          href="/pricing"
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[12px] font-medium rounded-full transition-colors"
        >
          プランを選ぶ
        </Link>
      </div>
    );
  }

  return null;
}
