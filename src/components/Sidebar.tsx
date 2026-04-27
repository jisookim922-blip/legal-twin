"use client";

import {
  Briefcase,
  Search,
  FileText,
  Calendar,
  Archive,
  Brain,
  Scale,
  Sparkles,
  TrendingUp,
  CreditCard,
  Database,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { phases, type PhaseIconName } from "@/lib/constants";
import type { TaskMap, CaseInfo } from "@/types";
import CaseManager from "./CaseManager";

const iconMap: Record<PhaseIconName, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Briefcase,
  Search,
  FileText,
  Calendar,
  Archive,
};

interface SidebarProps {
  activePhase: number;
  onPhaseChange: (id: number) => void;
  tasks: TaskMap;
  onOpenKnowledge: () => void;
  onOpenPastDocs: () => void;
  onToggleROI: () => void;
  cases: CaseInfo[];
  activeCase: CaseInfo | null;
  onSelectCase: (c: CaseInfo) => void;
  onCreateCase: (c: Omit<CaseInfo, "id" | "createdAt" | "status">) => void;
}

export default function Sidebar({
  activePhase,
  onPhaseChange,
  tasks,
  onOpenKnowledge,
  onOpenPastDocs,
  onToggleROI,
  cases,
  activeCase,
  onSelectCase,
  onCreateCase,
}: SidebarProps) {
  return (
    <nav className="w-full md:w-[280px] shrink-0 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-6 flex items-center gap-3">
        <div className="bg-blue-600 p-2.5 rounded-xl shadow-sm text-white">
          <Scale size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-bold text-lg text-gray-900 tracking-tight leading-none">
            LegalTwin
          </h1>
          <p className="text-[11px] font-medium text-gray-500 mt-1 uppercase tracking-widest">
            分身AI Workspace
          </p>
        </div>
      </div>

      {/* Case Manager */}
      <CaseManager
        cases={cases}
        activeCase={activeCase}
        onSelectCase={onSelectCase}
        onCreateCase={onCreateCase}
      />

      {/* Phase navigation */}
      {activeCase && (
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar px-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3 mt-2">
            フェーズ
          </div>
          {phases.map((phase) => {
            const Icon = iconMap[phase.icon];
            const isActive = activePhase === phase.id;
            const pendingCount =
              tasks[phase.id]?.filter((t) => !t.completed).length ?? 0;

            return (
              <button
                key={phase.id}
                onClick={() => onPhaseChange(phase.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left group relative ${
                  isActive
                    ? "bg-white shadow-sm ring-1 ring-black/5 text-blue-600"
                    : "hover:bg-gray-200/50 text-gray-600"
                }`}
              >
                <div
                  className={
                    isActive
                      ? "text-blue-500"
                      : "text-gray-400 group-hover:text-gray-600"
                  }
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <div className="flex-1 min-w-0 font-medium text-[14px]">
                  {phase.name}
                </div>
                {pendingCount > 0 && !isActive && (
                  <span className="absolute right-3 bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom actions */}
      <div className="p-4 mt-auto space-y-2">
        <button
          onClick={onToggleROI}
          className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors border border-green-200 rounded-full flex items-center justify-center font-medium text-green-700 shadow-sm w-full py-2.5 text-[13px] gap-2"
        >
          <TrendingUp size={14} />
          今月のROI
        </button>
        <button
          onClick={onOpenPastDocs}
          className="bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-colors border border-purple-200 rounded-full flex items-center justify-center font-medium text-purple-700 shadow-sm w-full py-2.5 text-[13px] gap-2"
        >
          <Sparkles size={14} />
          分身AI学習データ
        </button>
        <button
          onClick={onOpenKnowledge}
          className="bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-full flex items-center justify-center font-medium text-gray-700 shadow-sm w-full py-2.5 text-[13px] gap-2"
        >
          <Brain size={14} className="text-gray-500" />
          ナレッジベース
        </button>
        <a
          href="/admin"
          className="bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-full flex items-center justify-center font-medium text-gray-700 shadow-sm w-full py-2.5 text-[13px] gap-2"
        >
          <Database size={14} className="text-gray-500" />
          判例DB管理
        </a>
        <button
          onClick={async () => {
            const res = await fetch("/api/stripe/portal", { method: "POST" });
            const data = await res.json();
            if (data.url) {
              window.location.href = data.url;
            } else {
              window.location.href = "/pricing";
            }
          }}
          className="bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-full flex items-center justify-center font-medium text-gray-700 shadow-sm w-full py-2.5 text-[13px] gap-2"
        >
          <CreditCard size={14} className="text-gray-500" />
          プラン管理
        </button>
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
          <span className="text-[11px] text-gray-400">アカウント</span>
        </div>
      </div>
    </nav>
  );
}
