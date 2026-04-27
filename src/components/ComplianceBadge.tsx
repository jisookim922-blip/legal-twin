"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  MapPin,
  FileText,
  ChevronDown,
} from "lucide-react";
import type { CaseInfo } from "@/types";

interface ComplianceBadgeProps {
  activeCase: CaseInfo | null;
}

export default function ComplianceBadge({ activeCase }: ComplianceBadgeProps) {
  const [open, setOpen] = useState(false);
  const isConfidential = activeCase?.confidentialMode ?? false;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
          isConfidential
            ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
            : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
        }`}
      >
        {isConfidential ? (
          <>
            <Lock size={11} />
            機密案件モード
          </>
        ) : (
          <>
            <ShieldCheck size={11} />
            コンプラ準拠
          </>
        )}
        <ChevronDown
          size={11}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 rounded-[20px] shadow-xl p-4 z-50">
          <h4 className="text-[12px] font-semibold text-gray-900 mb-3">
            コンプライアンス状態
          </h4>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2 text-[12px]">
              <ShieldCheck size={14} className="text-green-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="font-medium text-gray-900">PII自動マスキング</span>
                <p className="text-gray-500 text-[11px]">
                  依頼者名・電話・メール等は送信前に[CLIENT_A]に置換
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-[12px]">
              <MapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="font-medium text-gray-900">国内処理 (Tokyo)</span>
                <p className="text-gray-500 text-[11px]">
                  Vercel Functions hnd1 リージョン経由
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-[12px]">
              <FileText size={14} className="text-purple-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="font-medium text-gray-900">改ざん防止監査ログ</span>
                <p className="text-gray-500 text-[11px]">
                  全AI入出力を SHA-256 ハッシュチェーンで記録
                </p>
              </div>
            </div>
            {isConfidential && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-start gap-2 text-[12px]">
                  <Lock size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-red-700">機密案件モードON</span>
                    <p className="text-red-600 text-[11px]">
                      外部AIへの送信は完全ブロックされています
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <a
            href="/settings"
            className="block text-center text-[11px] text-blue-600 hover:text-blue-700 font-medium mt-3 pt-3 border-t border-gray-100"
          >
            コンプラ設定を変更
          </a>
        </div>
      )}
    </div>
  );
}
