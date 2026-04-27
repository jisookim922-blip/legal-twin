"use client";

import { useRef, useState } from "react";
import {
  Upload,
  Cloud,
  CloudOff,
  CloudLightning,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { phases } from "@/lib/constants";
import { extractTextFromFile } from "@/lib/utils";
import type { TaskMap, SyncStatus, KnowledgeItem, CaseInfo } from "@/types";
import TaskList from "./TaskList";
import SearchPanel from "./SearchPanel";
import DraftEditor from "./DraftEditor";
import DocumentGenerator from "./DocumentGenerator";
import FactTimeline from "./FactTimeline";
import ComplianceBadge from "./ComplianceBadge";
import CourtCaseBrowser from "./CourtCaseBrowser";

interface MainWorkspaceProps {
  activePhase: number;
  tasks: TaskMap;
  draftText: string;
  syncStatus: SyncStatus;
  searchQuery: string;
  searchResults: string | null;
  isSearching: boolean;
  onDraftChange: (text: string) => void;
  onDraftDirect: (text: string) => Promise<void>;
  onToggleTask: (phaseId: number, taskId: string) => void;
  onAddTask: (phaseId: number, text: string) => void;
  onDeleteTask: (phaseId: number, taskId: string) => void;
  onSearchQueryChange: (q: string) => void;
  onSearch: () => void;
  knowledgeItems: KnowledgeItem[];
  sendAutoMessage: (
    userText: string,
    contextPayload: string,
    knowledgeItems: KnowledgeItem[]
  ) => Promise<void>;
  activeCase: CaseInfo | null;
  userId: string;
}

export default function MainWorkspace({
  activePhase,
  tasks,
  draftText,
  syncStatus,
  onDraftChange,
  onDraftDirect,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  searchQuery,
  searchResults,
  isSearching,
  onSearchQueryChange,
  onSearch,
  knowledgeItems,
  sendAutoMessage,
  activeCase,
  userId,
}: MainWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const currentPhase = phases.find((p) => p.id === activePhase);
  const currentPhaseTasks = tasks[activePhase] || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    try {
      const text = await extractTextFromFile(file);
      await onDraftDirect(text);

      const autoMessage = `資料アップロード報告：ファイル「${file.name}」をエディタに読み込みました。内容を把握し、要点の整理や法的リスクの初期レビューを行ってください。`;
      const contextPayload =
        autoMessage + `\n\n【読み込んだ資料内容】\n${text}`;
      await sendAutoMessage(autoMessage, contextPayload, knowledgeItems);
    } catch {
      await onDraftDirect(
        "エラー: ファイルの読み込みに失敗しました。\nパスワードで保護されているか、非対応の形式である可能性があります。"
      );
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // No active case — show empty state
  if (!activeCase) {
    return (
      <main className="bg-white border border-gray-200/60 shadow-sm rounded-[32px] overflow-hidden flex flex-col flex-1 min-w-0 items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={36} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-400 mb-2">
            案件を選択してください
          </h2>
          <p className="text-gray-400 text-[13px]">
            左のサイドバーから案件を選択するか、新規作成してください
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white border border-gray-200/60 shadow-sm rounded-[32px] overflow-hidden flex flex-col flex-1 min-w-0">
      {/* Header */}
      <header className="glass-header px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 sticky top-0">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              Phase {activePhase}
            </span>
            <span className="text-[11px] text-gray-400">
              {activeCase.name}
            </span>
            <ComplianceBadge activeCase={activeCase} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {currentPhase?.name}
          </h2>
          <p className="text-gray-500 text-[13px]">
            {currentPhase?.description}
          </p>
        </div>

        <div className="sm:text-right shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.md,.csv,.docx,.pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isReadingFile}
            className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-full flex items-center justify-center font-medium text-white shadow-sm px-5 py-2.5 text-[13px] gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReadingFile ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {isReadingFile ? "抽出中..." : "資料を読み込む"}
          </button>
          <div className="flex flex-col items-center sm:items-end mt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
              {syncStatus === "synced" && (
                <>
                  <Cloud size={12} /> 同期済み
                </>
              )}
              {syncStatus === "saving" && (
                <>
                  <CloudLightning
                    size={12}
                    className="text-blue-500 animate-pulse"
                  />{" "}
                  保存中...
                </>
              )}
              {syncStatus === "error" && (
                <>
                  <CloudOff size={12} className="text-red-500" /> 同期エラー
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-gray-50/30">
        {/* Tasks */}
        <TaskList
          tasks={currentPhaseTasks}
          phaseId={activePhase}
          onToggle={onToggleTask}
          onAdd={onAddTask}
          onDelete={onDeleteTask}
        />

        {/* Phase 1: Fact timeline */}
        {activePhase === 1 && (
          <FactTimeline
            draftText={draftText}
            caseName={activeCase.name}
          />
        )}

        {/* Phase 2: Search */}
        {activePhase === 2 && (
          <>
            <CourtCaseBrowser />
            <SearchPanel
              searchQuery={searchQuery}
              onQueryChange={onSearchQueryChange}
              onSearch={onSearch}
              isSearching={isSearching}
              searchResults={searchResults}
            />
          </>
        )}

        {/* Phase 3: Document Generator */}
        {activePhase === 3 && (
          <DocumentGenerator
            activeCase={activeCase}
            draftText={draftText}
            userId={userId}
          />
        )}

        {/* Draft editor - always visible */}
        <DraftEditor draftText={draftText} onChange={onDraftChange} />
      </div>
    </main>
  );
}
