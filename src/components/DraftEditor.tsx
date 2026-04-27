"use client";

import { AlignLeft } from "lucide-react";

interface DraftEditorProps {
  draftText: string;
  onChange: (text: string) => void;
}

export default function DraftEditor({ draftText, onChange }: DraftEditorProps) {
  return (
    <div className="p-6 flex-1 flex flex-col min-h-[300px]">
      <h3 className="text-[15px] font-semibold flex items-center gap-2 text-gray-900 mb-3">
        <AlignLeft size={16} className="text-blue-500" /> ドラフト・メモ
      </h3>
      <textarea
        className="bg-white focus:bg-white border border-transparent focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none text-gray-900 placeholder-gray-400 transition-all w-full flex-1 p-5 text-[14px] leading-relaxed resize-none shadow-sm"
        placeholder="ここにヒアリングメモや契約書のテキストを入力してください。AIが自動で内容を把握します。"
        value={draftText}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
