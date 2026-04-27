"use client";

import { useState, useCallback } from "react";

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (callContext: { confidentialMode?: boolean } = {}) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, ...callContext }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      // toTextStreamResponse returns plain text
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      setSearchResults(fullText || "検索結果が見つかりませんでした。");
    } catch {
      setSearchResults("検索中にエラーが発生しました。");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    handleSearch,
  };
}
