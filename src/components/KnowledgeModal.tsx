"use client";

import { useState, useRef } from "react";
import {
  Brain,
  X,
  Plus,
  Upload,
  Trash2,
  Check,
  Archive,
  Loader2,
} from "lucide-react";
import { extractTextFromFile } from "@/lib/utils";
import type { KnowledgeItem } from "@/types";

interface KnowledgeModalProps {
  items: KnowledgeItem[];
  onAdd: (title: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export default function KnowledgeModal({
  items,
  onAdd,
  onDelete,
  onClose,
}: KnowledgeModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingFile(true);
    try {
      const text = await extractTextFromFile(file);
      setContent(text);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    } catch {
      setContent("エラー: ファイルからのテキスト抽出に失敗しました。");
    } finally {
      setIsReadingFile(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsSaving(true);
    try {
      await onAdd(title, content);
      setTitle("");
      setContent("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white w-full max-w-4xl h-[85vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-[17px] font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="text-purple-500" size={20} />
            ナレッジベース
            <span className="text-[13px] font-normal text-gray-500 ml-2 hidden sm:inline">
              AIの思考パターンを管理
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
          {/* Left: existing items */}
          <div className="w-full md:w-1/2 border-r border-gray-100 flex flex-col min-h-0 bg-white">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-[14px] font-semibold text-gray-800">
                登録済み ({items.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {items.length === 0 ? (
                <div className="text-center text-gray-400 text-[13px] py-10 flex flex-col items-center gap-3">
                  <Archive size={32} className="opacity-30" />
                  ナレッジはありません。
                  <br />
                  右側から追加してください。
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-100 p-4 rounded-[20px] shadow-sm relative group hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-semibold text-gray-900 text-[14px] mb-2 pr-6 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[13px] text-gray-500 leading-relaxed whitespace-pre-wrap line-clamp-4">
                      {item.content}
                    </p>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: add new */}
          <div className="w-full md:w-1/2 flex flex-col min-h-0">
            <div className="px-5 py-4 border-b border-gray-100 bg-white">
              <h3 className="text-[14px] font-semibold text-gray-800 flex items-center gap-2">
                <Plus size={16} className="text-blue-500" /> 新規追加
              </h3>
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar"
            >
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-2">
                  タイトル
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white focus:bg-white border border-transparent focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none text-gray-900 placeholder-gray-400 transition-all w-full p-3 text-[14px] shadow-sm"
                  placeholder="例: 損害賠償上限の交渉方針"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-[12px] font-semibold text-gray-500">
                    ナレッジ内容（AIへの指示）
                  </label>
                  <input
                    type="file"
                    ref={fileRef}
                    onChange={handleFileUpload}
                    accept=".txt,.md,.csv,.docx,.pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={isReadingFile}
                    className="text-[11px] text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isReadingFile ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Upload size={12} />
                    )}
                    {isReadingFile ? "抽出中..." : "ファイルから読み込む"}
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-white focus:bg-white border border-transparent focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none text-gray-900 placeholder-gray-400 transition-all w-full flex-1 p-4 text-[14px] resize-none leading-relaxed shadow-sm"
                  placeholder="例: ベンダー側で契約する場合、損害賠償の上限は原則として「受領済みの委託料の1ヶ月分」とするよう交渉する..."
                />
              </div>
              <button
                type="submit"
                disabled={isSaving || !title.trim() || !content.trim()}
                className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-full flex items-center justify-center font-medium text-white shadow-md w-full py-3.5 text-[15px] gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                クラウドに保存
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
