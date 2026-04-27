"use client";

import { Search, Loader2 } from "lucide-react";

interface SearchPanelProps {
  searchQuery: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  searchResults: string | null;
}

export default function SearchPanel({
  searchQuery,
  onQueryChange,
  onSearch,
  isSearching,
  searchResults,
}: SearchPanelProps) {
  return (
    <div className="p-6 border-b border-gray-100 bg-white shrink-0">
      <h3 className="text-[15px] font-semibold mb-3 flex items-center gap-2 text-gray-900">
        <Search size={16} className="text-blue-500" /> 判例・文献データベース
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="キーワード、争点、当事者属性を入力..."
          className="bg-gray-100/80 focus:bg-white border border-transparent focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none text-gray-900 placeholder-gray-400 transition-all flex-1 px-4 py-2.5 text-[14px]"
          value={searchQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-full flex items-center justify-center font-medium text-white shadow-sm px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onSearch}
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? <Loader2 size={18} className="animate-spin" /> : "検索"}
        </button>
      </div>

      {(isSearching || searchResults) && (
        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-[20px] max-h-60 overflow-y-auto custom-scrollbar p-5">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center text-gray-400 py-4">
              <Loader2 size={24} className="mb-2 animate-spin text-blue-500" />
              <p className="text-xs">ナレッジベースを検索中...</p>
            </div>
          ) : (
            <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
              {searchResults}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
