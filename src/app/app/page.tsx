"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useAuth as useFirebaseAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useChat } from "@/hooks/useChat";
import { useKnowledge } from "@/hooks/useKnowledge";
import { useSearch } from "@/hooks/useSearch";
import Sidebar from "@/components/Sidebar";
import MainWorkspace from "@/components/MainWorkspace";
import ChatPanel from "@/components/ChatPanel";
import KnowledgeModal from "@/components/KnowledgeModal";
import Onboarding from "@/components/Onboarding";
import PastDocumentsPanel from "@/components/PastDocumentsPanel";
import ROIDashboard from "@/components/ROIDashboard";
import EvaluationDashboard from "@/components/EvaluationDashboard";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import type { CaseInfo } from "@/types";

export default function Home() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { user, loading: authLoading } = useFirebaseAuth();
  const {
    tasks,
    draftText,
    syncStatus,
    saveDraft,
    setDraftDirect,
    addTask,
    deleteTask,
    toggleTask,
  } = useWorkspace(user);
  const { chatMessages, isTyping, sendMessage, sendAutoMessage } =
    useChat(user);
  const { knowledgeItems, addKnowledge, removeKnowledge } =
    useKnowledge(user);
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    handleSearch,
  } = useSearch();

  const [activePhase, setActivePhase] = useState(1);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [showPastDocsPanel, setShowPastDocsPanel] = useState(false);
  const [showROI, setShowROI] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [cases, setCases] = useState<CaseInfo[]>([]);
  const [activeCase, setActiveCase] = useState<CaseInfo | null>(null);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    if (clerkUser?.id) {
      setUserId(clerkUser.id);
    }
    const seen = localStorage.getItem("legaltwin_onboarded");
    if (!seen) setShowOnboarding(true);
  }, [clerkUser?.id]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("legaltwin_onboarded", "true");
    setShowOnboarding(false);
  };

  const handleCreateCase = useCallback(
    (data: Omit<CaseInfo, "id" | "createdAt" | "status">) => {
      const newCase: CaseInfo = {
        ...data,
        id: Date.now().toString(),
        createdAt: Date.now(),
        status: "active",
      };
      setCases((prev) => [newCase, ...prev]);
      setActiveCase(newCase);
      setActivePhase(1);
    },
    []
  );

  const logUsage = useCallback(
    (operation: string) => {
      if (!userId) return;
      fetch("/api/usage/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          operation,
          caseId: activeCase?.id,
        }),
      }).catch(() => {});
    },
    [userId, activeCase]
  );

  const buildCaseContext = useCallback(() => {
    if (!activeCase) return {};
    return {
      caseId: activeCase.id,
      knownEntities: {
        clientName: activeCase.clientName,
        opposingParty: activeCase.opposingParty,
        caseName: activeCase.name,
      },
      confidentialMode: activeCase.confidentialMode,
    };
  }, [activeCase]);

  const handleToggleTask = useCallback(
    async (phaseId: number, taskId: string) => {
      const result = await toggleTask(phaseId, taskId);
      if (result?.isCompleting && !activeCase?.confidentialMode) {
        const autoMsg = `タスク完了：「${result.taskText}」が完了しました。フェーズ${phaseId}の次のステップや留意点を教えてください。`;
        await sendAutoMessage(autoMsg, autoMsg, knowledgeItems, buildCaseContext());
      }
    },
    [toggleTask, sendAutoMessage, knowledgeItems, activeCase, buildCaseContext]
  );

  const handleSendChat = useCallback(
    (text: string) => {
      sendMessage(text, draftText, knowledgeItems, buildCaseContext());
      logUsage("chat");
    },
    [sendMessage, draftText, knowledgeItems, logUsage, buildCaseContext]
  );

  if (authLoading || !clerkLoaded) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center text-gray-500">
        <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
        <p className="font-medium tracking-tight">
          セキュアワークスペースを構築中...
        </p>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      <div className="min-h-screen bg-[#F5F5F7] text-gray-900 p-3 md:p-5 tracking-tight flex flex-col md:flex-row gap-5 selection:bg-blue-100">
        <Sidebar
          activePhase={activePhase}
          onPhaseChange={setActivePhase}
          tasks={tasks}
          onOpenKnowledge={() => setShowKnowledgeModal(true)}
          onOpenPastDocs={() => setShowPastDocsPanel(true)}
          onToggleROI={() => setShowROI((v) => !v)}
          cases={cases}
          activeCase={activeCase}
          onSelectCase={setActiveCase}
          onCreateCase={handleCreateCase}
        />

        <div className="flex-1 flex flex-col gap-5 min-w-0">
          <SubscriptionBanner />
          {showROI && userId && (
            <div className="space-y-5">
              <div className="bg-white border border-gray-200/60 shadow-sm rounded-[32px] overflow-hidden">
                <ROIDashboard userId={userId} />
              </div>
              <div className="bg-white border border-gray-200/60 shadow-sm rounded-[32px] overflow-hidden">
                <EvaluationDashboard />
              </div>
            </div>
          )}

          <MainWorkspace
            activePhase={activePhase}
            tasks={tasks}
            draftText={draftText}
            syncStatus={syncStatus}
            searchQuery={searchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            onDraftChange={saveDraft}
            onDraftDirect={setDraftDirect}
            onToggleTask={handleToggleTask}
            onAddTask={addTask}
            onDeleteTask={deleteTask}
            onSearchQueryChange={setSearchQuery}
            onSearch={() => {
              handleSearch({ confidentialMode: activeCase?.confidentialMode });
              logUsage("search");
            }}
            knowledgeItems={knowledgeItems}
            sendAutoMessage={sendAutoMessage}
            activeCase={activeCase}
            userId={userId}
          />
        </div>

        <ChatPanel
          messages={chatMessages}
          isTyping={isTyping}
          onSend={handleSendChat}
        />

        {showKnowledgeModal && (
          <KnowledgeModal
            items={knowledgeItems}
            onAdd={addKnowledge}
            onDelete={removeKnowledge}
            onClose={() => setShowKnowledgeModal(false)}
          />
        )}

        {userId && (
          <PastDocumentsPanel
            userId={userId}
            isOpen={showPastDocsPanel}
            onClose={() => setShowPastDocsPanel(false)}
          />
        )}
      </div>
    </>
  );
}
