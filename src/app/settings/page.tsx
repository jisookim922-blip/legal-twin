"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Check,
  ShieldCheck,
  Lock,
  FileText,
  Banknote,
  Download,
  ShieldAlert,
} from "lucide-react";

interface Settings {
  piiMaskingEnabled: boolean;
  auditLogFullPayload: boolean;
  defaultConfidentialMode: boolean;
  hourlyRate: number;
}

interface AuditVerifyResult {
  valid: boolean;
  brokenAt?: number;
  total: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [verify, setVerify] = useState<AuditVerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const update = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  const verifyChain = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/audit?action=verify");
      const data = await res.json();
      setVerify(data);
    } finally {
      setVerifying(false);
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold mb-2">設定</h1>
        <p className="text-gray-500 text-[14px] mb-10">
          コンプライアンス・監査ログ・課金設定を管理します
        </p>

        {/* Compliance section */}
        <section className="bg-white rounded-[24px] border border-gray-100 p-6 mb-5 shadow-sm">
          <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-green-500" />
            コンプライアンス
          </h2>

          <div className="space-y-4">
            <Toggle
              icon={<ShieldCheck size={16} className="text-green-500" />}
              title="PII自動マスキング"
              description="依頼者名・電話番号・メール等を AI 送信前に [CLIENT_A] 等に置換します。OFF にすると速度は上がりますが守秘義務違反リスクが高まります。"
              checked={settings.piiMaskingEnabled}
              onChange={(v) => update("piiMaskingEnabled", v)}
            />
            <Toggle
              icon={<FileText size={16} className="text-purple-500" />}
              title="監査ログに本文を保存"
              description="ハッシュ値だけでなく入出力本文も保存します。OFF だと容量を削減できますが、後から AI 出力を見返せません。"
              checked={settings.auditLogFullPayload}
              onChange={(v) => update("auditLogFullPayload", v)}
            />
            <Toggle
              icon={<Lock size={16} className="text-red-500" />}
              title="新規案件はデフォルトで機密モード"
              description="ON にすると新しく作成する案件すべてで外部AI送信が初期状態でブロックされます。M&A・刑事・大型訴訟が多い場合に推奨。"
              checked={settings.defaultConfidentialMode}
              onChange={(v) => update("defaultConfidentialMode", v)}
            />
          </div>
        </section>

        {/* ROI calculation section */}
        <section className="bg-white rounded-[24px] border border-gray-100 p-6 mb-5 shadow-sm">
          <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2">
            <Banknote size={18} className="text-blue-500" />
            ROI 計算
          </h2>
          <label className="block">
            <span className="text-[13px] font-semibold text-gray-700">
              あなたの時給（¥/h）
            </span>
            <p className="text-[11px] text-gray-500 mb-2">
              ROI ダッシュボードの金額換算に使われます。タイムチャージ単価が目安。
            </p>
            <input
              type="number"
              value={settings.hourlyRate}
              onChange={(e) =>
                update("hourlyRate", parseInt(e.target.value) || 0)
              }
              min={1000}
              max={100000}
              step={1000}
              className="w-40 bg-gray-50 focus:bg-white border border-transparent focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl p-3 text-[14px] outline-none transition-all"
            />
            <span className="ml-2 text-[13px] text-gray-500">/ 時間</span>
          </label>
        </section>

        {/* Audit log section */}
        <section className="bg-white rounded-[24px] border border-gray-100 p-6 mb-5 shadow-sm">
          <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-500" />
            監査ログ
          </h2>
          <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
            全 AI 入出力は SHA-256 ハッシュチェーンで記録され、改ざん検知できます。
            弁護士会照会・監督対応時に CSV で提出できます。
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={verifyChain}
              disabled={verifying}
              className="flex-1 py-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-[13px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {verifying ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ShieldCheck size={14} />
              )}
              ハッシュチェーンを検証
            </button>
            <a
              href="/api/audit/export-csv"
              className="flex-1 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-[13px] flex items-center justify-center gap-2 transition-colors"
            >
              <Download size={14} />
              CSV エクスポート
            </a>
          </div>

          {verify && (
            <div
              className={`mt-3 p-3 rounded-2xl ${
                verify.valid
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {verify.valid ? (
                <p className="text-[13px] text-green-700 font-medium flex items-center gap-1.5">
                  <Check size={14} />
                  検証成功：{verify.total} 件のログは改ざんされていません
                </p>
              ) : (
                <p className="text-[13px] text-red-700 font-medium">
                  検証失敗：ログ ID #{verify.brokenAt} で連鎖が破損しています
                </p>
              )}
            </div>
          )}
        </section>

        {/* Save status */}
        {(saving || savedAt) && (
          <div className="text-center text-[12px] text-gray-400">
            {saving
              ? "保存中..."
              : savedAt
                ? `保存しました ${new Date(savedAt).toLocaleTimeString("ja-JP")}`
                : ""}
          </div>
        )}
      </main>
    </div>
  );
}

function Toggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl hover:bg-gray-50 transition-colors">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-gray-900">{title}</div>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
    </label>
  );
}
