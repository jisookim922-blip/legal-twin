"use client";

import { useState, useEffect, useRef } from "react";
import {
  Brain,
  Upload,
  Loader2,
  Trash2,
  FileText,
  X,
  Sparkles,
  Check,
} from "lucide-react";
import { extractTextFromFile } from "@/lib/utils";

interface PastDocument {
  id: string;
  title: string;
  documentType: string | null;
  caseCategory: string | null;
  uploadedAt: string;
  metadata: { fileName?: string; fileSize?: number } | null;
}

interface PastDocumentsPanelProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const DOC_TYPES = [
  "訴状",
  "準備書面",
  "答弁書",
  "内容証明",
  "契約書",
  "和解契約書",
  "意見書",
  "その他",
];

export default function PastDocumentsPanel({
  userId,
  isOpen,
  onClose,
}: PastDocumentsPanelProps) {
  const [documents, setDocuments] = useState<PastDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState(DOC_TYPES[0]);
  const [uploadContent, setUploadContent] = useState("");
  const [readingFile, setReadingFile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDocs = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rag/list?userId=${userId}`);
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  const handleFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReadingFile(true);
    try {
      const text = await extractTextFromFile(file);
      setUploadContent(text);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch {
      alert("ファイルの読み込みに失敗しました");
    } finally {
      setReadingFile(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim() || !uploadContent.trim()) return;
    setUploading(true);
    try {
      const res = await fetch("/api/rag/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: uploadTitle,
          content: uploadContent,
          documentType: uploadType,
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      setUploadTitle("");
      setUploadContent("");
      await loadDocs();
    } catch {
      alert("アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この書面を分身AIの学習データから削除しますか？")) return;
    try {
      await fetch(`/api/rag/list?userId=${userId}&documentId=${id}`, {
        method: "DELETE",
      });
      await loadDocs();
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl h-[85vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-[17px] font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="text-purple-500" size={20} />
            分身AIの学習データ
            <span className="text-[13px] font-normal text-gray-500 ml-2 hidden sm:inline">
              過去書面を学習させて、あなたの文体を再現
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-gray-50/50">
          {/* Left: list */}
          <div className="w-full md:w-1/2 border-r border-gray-100 flex flex-col min-h-0 bg-white">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-[14px] font-semibold text-gray-800">
                学習済み書面 ({documents.length})
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                書面生成時に自動参照し、あなたの文体で出力します
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="text-center text-gray-400 py-8">
                  <Loader2
                    size={24}
                    className="animate-spin mx-auto mb-2 text-blue-500"
                  />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center text-gray-400 text-[13px] py-10 flex flex-col items-center gap-3">
                  <FileText size={32} className="opacity-30" />
                  過去書面はまだアップロードされていません
                  <br />
                  右側から追加してください
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm relative group hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-2">
                      <FileText size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-[13px] pr-6 leading-snug truncate">
                          {doc.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {doc.documentType && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                              {doc.documentType}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400">
                            {new Date(doc.uploadedAt).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: upload */}
          <div className="w-full md:w-1/2 flex flex-col min-h-0">
            <div className="px-5 py-4 border-b border-gray-100 bg-white">
              <h3 className="text-[14px] font-semibold text-gray-800 flex items-center gap-2">
                <Upload size={16} className="text-blue-500" /> 過去書面を追加
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                訴状・準備書面・契約書などを読み込ませると、書面生成時にあなたの文体が再現されます
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-2">
                  書面タイトル
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl p-3 text-[14px] outline-none transition-all"
                  placeholder="例：山田太郎事件 第1準備書面"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-2">
                  書面種別
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DOC_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setUploadType(t)}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                        uploadType === t
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-[12px] font-semibold text-gray-500">
                    本文
                  </label>
                  <input
                    type="file"
                    ref={fileRef}
                    onChange={handleFileRead}
                    accept=".txt,.md,.csv,.docx,.pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={readingFile}
                    className="text-[11px] text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
                  >
                    {readingFile ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Upload size={12} />
                    )}
                    {readingFile ? "抽出中..." : "ファイルから読み込む"}
                  </button>
                </div>
                <textarea
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  className="w-full flex-1 bg-white border border-gray-200 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl p-4 text-[13px] outline-none transition-all resize-none leading-relaxed"
                  placeholder="過去書面の本文をコピペするか、上のボタンからファイル読込"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={
                  uploading || !uploadTitle.trim() || !uploadContent.trim()
                }
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium text-[15px] flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> 分身AIに学習中...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> 分身AIに追加
                  </>
                )}
              </button>

              <p className="text-[11px] text-gray-400 text-center">
                <Check size={10} className="inline" /> 書面は自動でチャンク化・ベクトル化され、
                類似書面検索に使われます
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
