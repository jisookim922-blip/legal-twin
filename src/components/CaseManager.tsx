"use client";

import { useState } from "react";
import {
  Plus,
  FolderOpen,
  X,
  ShieldAlert,
  Loader2,
  Check,
  AlertTriangle,
  Lock,
} from "lucide-react";
import type { CaseInfo, CaseCategory, ConflictMatch } from "@/types";
import { CASE_CATEGORY_LABELS } from "@/types";

interface CaseManagerProps {
  cases: CaseInfo[];
  activeCase: CaseInfo | null;
  onSelectCase: (c: CaseInfo) => void;
  onCreateCase: (c: Omit<CaseInfo, "id" | "createdAt" | "status">) => void;
}

export default function CaseManager({
  cases,
  activeCase,
  onSelectCase,
  onCreateCase,
}: CaseManagerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [opposingParty, setOpposingParty] = useState("");
  const [category, setCategory] = useState<CaseCategory>("other");
  const [description, setDescription] = useState("");
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictResults, setConflictResults] = useState<ConflictMatch[]>([]);
  const [conflictChecked, setConflictChecked] = useState(false);
  const [confidentialMode, setConfidentialMode] = useState(false);

  const checkConflict = async () => {
    if (!clientName.trim() && !opposingParty.trim()) return;
    setIsCheckingConflict(true);
    setConflictResults([]);

    const namesToCheck = [clientName, opposingParty].filter(Boolean);
    const matches: ConflictMatch[] = [];

    for (const searchName of namesToCheck) {
      for (const c of cases) {
        const targets = [c.clientName, c.opposingParty ?? ""].filter(Boolean);
        for (const target of targets) {
          if (
            target &&
            searchName &&
            target.includes(searchName.trim())
          ) {
            matches.push({
              caseId: c.id,
              caseName: c.name,
              matchedName: target,
              role:
                target === c.clientName ? "依頼者" : "相手方",
              similarity: 100,
            });
          }
        }
      }
    }

    // Simulate async for future API integration
    await new Promise((r) => setTimeout(r, 500));
    setConflictResults(matches);
    setConflictChecked(true);
    setIsCheckingConflict(false);
  };

  const handleCreate = () => {
    if (!name.trim() || !clientName.trim()) return;
    onCreateCase({
      name: name.trim(),
      clientName: clientName.trim(),
      category,
      description: description.trim(),
      opposingParty: opposingParty.trim() || undefined,
      confidentialMode,
    });
    setName("");
    setClientName("");
    setOpposingParty("");
    setCategory("other");
    setDescription("");
    setConfidentialMode(false);
    setConflictResults([]);
    setConflictChecked(false);
    setShowCreate(false);
  };

  if (!showCreate && !activeCase && cases.length === 0) {
    // Empty state - first time
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-6">
          <FolderOpen size={36} className="text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          最初の案件を作成しましょう
        </h2>
        <p className="text-gray-500 text-[14px] max-w-sm mb-6 leading-relaxed">
          案件を作成すると、受任から終結まで全5フェーズをAIがサポートします。
          タスク・書面・チャットは全て案件ごとに管理されます。
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3.5 font-medium text-[15px] flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          新規案件を作成
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Case selector button in sidebar */}
      {activeCase && (
        <div className="px-3 mb-3">
          <div className="bg-blue-50 rounded-2xl p-3">
            <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider mb-1">
              現在の案件
            </p>
            <p className="text-[14px] font-semibold text-gray-900 truncate">
              {activeCase.name}
            </p>
            <p className="text-[12px] text-gray-500 truncate">
              {activeCase.clientName} ・{" "}
              {CASE_CATEGORY_LABELS[activeCase.category]}
            </p>
          </div>
        </div>
      )}

      {/* Case list */}
      <div className="px-3 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1">
            案件一覧
          </span>
          <button
            onClick={() => setShowCreate(true)}
            className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCase(c)}
              className={`w-full text-left px-3 py-2 rounded-xl text-[13px] transition-all truncate ${
                activeCase?.id === c.id
                  ? "bg-white shadow-sm ring-1 ring-black/5 font-medium text-gray-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-[17px] font-semibold text-gray-900 flex items-center gap-2">
                <Plus size={18} className="text-blue-500" />
                新規案件を作成
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-2 text-gray-400 hover:text-gray-800 bg-gray-50 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Case name */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                  案件名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：山田太郎 離婚調停事件"
                  className="w-full bg-gray-50 focus:bg-white border border-transparent focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl p-3 text-[14px] outline-none transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                  案件種別
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    Object.entries(CASE_CATEGORY_LABELS) as [
                      CaseCategory,
                      string,
                    ][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                        category === key
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client name */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                  依頼者名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    setConflictChecked(false);
                  }}
                  placeholder="例：山田太郎"
                  className="w-full bg-gray-50 focus:bg-white border border-transparent focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl p-3 text-[14px] outline-none transition-all"
                />
              </div>

              {/* Opposing party */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                  相手方（任意）
                </label>
                <input
                  type="text"
                  value={opposingParty}
                  onChange={(e) => {
                    setOpposingParty(e.target.value);
                    setConflictChecked(false);
                  }}
                  placeholder="例：山田花子"
                  className="w-full bg-gray-50 focus:bg-white border border-transparent focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl p-3 text-[14px] outline-none transition-all"
                />
              </div>

              {/* Conflict check */}
              <div>
                <button
                  onClick={checkConflict}
                  disabled={
                    isCheckingConflict ||
                    (!clientName.trim() && !opposingParty.trim())
                  }
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 text-orange-700 font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors disabled:opacity-50"
                >
                  {isCheckingConflict ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      チェック中...
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={16} />
                      利益相反チェックを実行
                    </>
                  )}
                </button>

                {conflictChecked && (
                  <div
                    className={`mt-3 p-3 rounded-2xl ${
                      conflictResults.length > 0
                        ? "bg-red-50 border border-red-200"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    {conflictResults.length > 0 ? (
                      <>
                        <p className="text-red-700 font-semibold text-[13px] flex items-center gap-1.5 mb-2">
                          <AlertTriangle size={14} />
                          利益相反の可能性があります
                        </p>
                        {conflictResults.map((m, i) => (
                          <p
                            key={i}
                            className="text-red-600 text-[12px] ml-5"
                          >
                            「{m.matchedName}」が案件「{m.caseName}」に
                            {m.role}として登場
                          </p>
                        ))}
                      </>
                    ) : (
                      <p className="text-green-700 font-medium text-[13px] flex items-center gap-1.5">
                        <Check size={14} />
                        利益相反は検出されませんでした
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                  概要メモ（任意）
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="相談内容や初期情報を入力..."
                  rows={3}
                  className="w-full bg-gray-50 focus:bg-white border border-transparent focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl p-3 text-[14px] outline-none transition-all resize-none"
                />
              </div>

              {/* Confidential Mode */}
              <div
                className={`rounded-2xl border p-3 transition-colors ${
                  confidentialMode
                    ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confidentialMode}
                    onChange={(e) => setConfidentialMode(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded accent-red-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <Lock
                        size={14}
                        className={
                          confidentialMode ? "text-red-600" : "text-gray-400"
                        }
                      />
                      <span className="text-[13px] font-semibold text-gray-900">
                        機密案件モード
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      ON にすると外部AIへの送信を完全ブロックします。M&A・刑事・大型訴訟など、特に機密性が高い案件向け。AIチャット・書面生成は使えなくなります（手動メモ・タスク管理のみ）。
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Create button */}
            <div className="p-6 pt-0">
              <button
                onClick={handleCreate}
                disabled={!name.trim() || !clientName.trim()}
                className="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-[15px] flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                案件を作成して開始
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
