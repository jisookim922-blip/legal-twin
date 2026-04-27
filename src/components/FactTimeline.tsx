"use client";

import { useState } from "react";
import { Clock, Users, Loader2, Sparkles, AlertCircle } from "lucide-react";
import type { TimelineEvent, PersonNode } from "@/types";

interface FactTimelineProps {
  draftText: string;
  caseName: string;
}

export default function FactTimeline({
  draftText,
  caseName,
}: FactTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [persons, setPersons] = useState<PersonNode[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const analyze = async () => {
    if (!draftText.trim()) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/analyze-facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draftText, caseName }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();
      setEvents(data.events ?? []);
      setPersons(data.persons ?? []);
      setAnalyzed(true);
    } catch {
      setEvents([]);
      setPersons([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const roleColors: Record<string, string> = {
    依頼者: "bg-blue-100 text-blue-700 border-blue-200",
    相手方: "bg-red-100 text-red-700 border-red-200",
    関係者: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="p-6 border-b border-gray-100 bg-white shrink-0">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-3">
        <Clock size={16} className="text-blue-500" />
        事実関係の整理
        <span className="text-[11px] text-gray-400 font-normal ml-1">
          エディタの内容をAIが自動解析
        </span>
      </h3>

      {!analyzed ? (
        <button
          onClick={analyze}
          disabled={isAnalyzing || !draftText.trim()}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-700 font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={16} className="animate-spin" /> 分析中...
            </>
          ) : !draftText.trim() ? (
            <>
              <AlertCircle size={16} />
              エディタにヒアリング内容を入力してください
            </>
          ) : (
            <>
              <Sparkles size={16} /> 事実関係を自動整理する
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          {/* Persons */}
          {persons.length > 0 && (
            <div>
              <h4 className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                <Users size={14} className="text-blue-500" /> 関係者
              </h4>
              <div className="flex flex-wrap gap-2">
                {persons.map((p) => {
                  const colorClass =
                    roleColors[p.role] ?? roleColors["関係者"];
                  return (
                    <div
                      key={p.id}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-medium border ${colorClass}`}
                    >
                      {p.name}
                      <span className="opacity-60 ml-1">({p.role})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          {events.length > 0 && (
            <div>
              <h4 className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                <Clock size={14} className="text-blue-500" /> 時系列
              </h4>
              <div className="space-y-0 relative ml-3">
                <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-gray-100" />
                {events.map((evt) => (
                  <div key={evt.id} className="flex gap-3 pb-3 relative">
                    <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm mt-1.5 shrink-0 z-10" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[11px] text-blue-600 font-mono font-semibold">
                          {evt.date}
                        </span>
                        <span className="text-[13px] font-semibold text-gray-900">
                          {evt.title}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                        {evt.description}
                      </p>
                      {evt.legalNote && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg mt-1 inline-block">
                          ⚖ {evt.legalNote}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={analyze}
            disabled={isAnalyzing}
            className="text-[12px] text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
          >
            <Sparkles size={12} /> 再分析する
          </button>
        </div>
      )}
    </div>
  );
}
