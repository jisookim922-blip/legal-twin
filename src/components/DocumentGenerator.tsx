"use client";

import { useState } from "react";
import {
  FileText,
  Loader2,
  Check,
  X,
  RotateCcw,
  Download,
  Sparkles,
  FileDown,
} from "lucide-react";
import type {
  DocumentType,
  ApprovalStatus,
  DraftDocument,
  CaseInfo,
} from "@/types";
import { DOCUMENT_TYPE_LABELS } from "@/types";
import SelfReviewPanel from "./SelfReviewPanel";
import CitationVerifier from "./CitationVerifier";

interface DocumentGeneratorProps {
  activeCase: CaseInfo | null;
  draftText: string;
  userId: string;
}

export default function DocumentGenerator({
  activeCase,
  draftText,
  userId,
}: DocumentGeneratorProps) {
  const [documents, setDocuments] = useState<DraftDocument[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>("notice");
  const [activeDoc, setActiveDoc] = useState<DraftDocument | null>(null);

  const logUsage = async (operation: string) => {
    try {
      await fetch("/api/usage/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          operation,
          caseId: activeCase?.id,
        }),
      });
    } catch {
      // ignore
    }
  };

  const generateDocument = async () => {
    if (!activeCase) return;
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: selectedType,
          caseInfo: {
            id: activeCase.id,
            name: activeCase.name,
            clientName: activeCase.clientName,
            category: activeCase.category,
            opposingParty: activeCase.opposingParty,
            description: activeCase.description,
          },
          additionalContext: draftText.trim() || undefined,
          confidentialMode: activeCase.confidentialMode,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          alert(data.error ?? "機密案件モードのため外部AIに送信できません");
        }
        throw new Error("Generation failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let content = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
      }

      const newDoc: DraftDocument = {
        id: Date.now().toString(),
        type: selectedType,
        title: `${DOCUMENT_TYPE_LABELS[selectedType]} - ${activeCase.name}`,
        content,
        status: "draft",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        aiGenerated: true,
        revisionHistory: [],
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setActiveDoc(newDoc);
      logUsage("document_generate");
    } catch {
      // error handled silently
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStatus = (docId: string, status: ApprovalStatus, note?: string) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d;
        return {
          ...d,
          status,
          updatedAt: Date.now(),
          revisionHistory: [
            ...d.revisionHistory,
            { timestamp: Date.now(), action: status, note },
          ],
        };
      })
    );
    if (activeDoc?.id === docId) {
      setActiveDoc((prev) =>
        prev
          ? {
              ...prev,
              status,
              updatedAt: Date.now(),
              revisionHistory: [
                ...prev.revisionHistory,
                { timestamp: Date.now(), action: status, note },
              ],
            }
          : null
      );
    }
  };

  const downloadDocx = async () => {
    if (!activeDoc) return;
    try {
      const res = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeDoc.title,
          content: activeDoc.content,
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeDoc.title}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Wordファイル生成に失敗しました");
    }
  };

  const downloadTxt = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDoc.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: ApprovalStatus) => {
    const styles: Record<ApprovalStatus, string> = {
      draft: "bg-amber-50 text-amber-700 border-amber-200",
      approved: "bg-green-50 text-green-700 border-green-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
      revised: "bg-blue-50 text-blue-700 border-blue-200",
    };
    const labels: Record<ApprovalStatus, string> = {
      draft: "ドラフト",
      approved: "承認済み",
      rejected: "却下",
      revised: "修正済み",
    };
    return (
      <span
        className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  if (!activeCase) {
    return (
      <div className="p-6 border-b border-gray-100 bg-white">
        <p className="text-gray-400 text-[13px] text-center py-4">
          案件を選択すると書面を生成できます
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border-b border-gray-100 bg-white shrink-0">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <FileText size={16} className="text-blue-500" />
        書面生成
        <span className="text-[11px] text-gray-400 font-normal ml-1">
          過去書面RAG + セルフレビュー付き
        </span>
      </h3>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(
          Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
              selectedType === key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={generateDocument}
        disabled={isGenerating}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            分身AIが起案中... (過去書面を参照)
          </>
        ) : (
          <>
            <Sparkles size={16} />
            {DOCUMENT_TYPE_LABELS[selectedType]}を起案する
          </>
        )}
      </button>

      {documents.length > 0 && (
        <div className="mt-4 space-y-2">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc)}
              className={`w-full text-left p-3 rounded-2xl border transition-all ${
                activeDoc?.id === doc.id
                  ? "border-blue-200 bg-blue-50/50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-gray-900 truncate">
                  {doc.title}
                </span>
                {statusBadge(doc.status)}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {new Date(doc.createdAt).toLocaleString("ja-JP")}
              </p>
            </button>
          ))}
        </div>
      )}

      {activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-5xl w-full h-[90vh] flex overflow-hidden">
            {/* Left: content */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-gray-100">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <h2 className="text-[17px] font-semibold text-gray-900 truncate">
                    {activeDoc.title}
                  </h2>
                  {statusBadge(activeDoc.status)}
                </div>
                <button
                  onClick={() => setActiveDoc(null)}
                  className="p-2 text-gray-400 hover:text-gray-800 bg-gray-50 rounded-full shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="text-[14px] leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {activeDoc.content}
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                {activeDoc.status === "draft" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(activeDoc.id, "approved")}
                      className="flex-1 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Check size={16} /> 承認
                    </button>
                    <button
                      onClick={() => updateStatus(activeDoc.id, "revised")}
                      className="flex-1 py-3 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-medium flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                    >
                      <RotateCcw size={16} /> 修正
                    </button>
                    <button
                      onClick={() => updateStatus(activeDoc.id, "rejected")}
                      className="py-3 px-5 rounded-full border border-red-200 bg-red-50 text-red-600 font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                    >
                      <X size={16} /> 却下
                    </button>
                  </div>
                )}
                {activeDoc.status === "approved" && (
                  <div className="flex gap-2">
                    <button
                      onClick={downloadDocx}
                      className="flex-1 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <FileDown size={16} /> Word (.docx) でダウンロード
                    </button>
                    <button
                      onClick={downloadTxt}
                      className="py-3 px-5 rounded-full border border-gray-200 bg-white text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <Download size={16} /> テキスト
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: review + citations */}
            <div className="w-[380px] shrink-0 flex flex-col bg-gray-50/30 min-h-0">
              <div className="p-5 border-b border-gray-100 bg-white">
                <h3 className="text-[14px] font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-500" />
                  AI品質チェック
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  別AIによる二重検証＋引用の実在確認
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">
                <CitationVerifier content={activeDoc.content} />
                <SelfReviewPanel
                  documentContent={activeDoc.content}
                  documentType={DOCUMENT_TYPE_LABELS[activeDoc.type]}
                  caseId={activeCase?.id}
                  knownEntities={
                    activeCase
                      ? {
                          clientName: activeCase.clientName,
                          opposingParty: activeCase.opposingParty,
                          caseName: activeCase.name,
                        }
                      : undefined
                  }
                  confidentialMode={activeCase?.confidentialMode}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
