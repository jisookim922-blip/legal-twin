"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { Brain, Send } from "lucide-react";
import type { ChatMessage } from "@/types";

interface ChatPanelProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onSend: (text: string) => void;
}

export default function ChatPanel({
  messages,
  isTyping,
  onSend,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;
    onSend(inputText.trim());
    setInputText("");
  };

  const quickActions = [
    { label: "要約", text: "エディタの内容を要約して" },
    { label: "リスク指摘", text: "エディタの文章の法的リスクを指摘して" },
    { label: "戦略", text: "この状況における交渉戦略を提案して" },
  ];

  return (
    <aside className="bg-white border border-gray-200/60 shadow-sm rounded-[32px] overflow-hidden flex flex-col w-full md:w-[340px] lg:w-[380px] shrink-0 bg-gray-50/50">
      {/* Header */}
      <div className="glass-header p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm relative">
          <Brain size={18} className="text-white" />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        </div>
        <div>
          <h3 className="font-semibold text-[14px] text-gray-900">
            My Clone AI
          </h3>
          <p className="text-[11px] text-gray-500 font-medium">
            過去データ同期済
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id ?? msg.timestamp}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-[20px] text-[14px] leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-br-sm"
                  : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              {msg.text.split("\n").map((line, i, arr) => (
                <Fragment key={i}>
                  {line}
                  {i !== arr.length - 1 && <br />}
                </Fragment>
              ))}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-3.5 rounded-[20px] rounded-bl-sm flex gap-1 items-center shadow-sm">
              <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
              <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
              <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100/80">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => setInputText(action.text)}
              className="text-[11px] px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full font-medium transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            placeholder="メッセージを入力..."
            className="bg-white focus:bg-white border border-gray-200 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none text-gray-900 placeholder-gray-400 transition-all w-full py-2.5 pl-4 pr-11 text-[14px] shadow-sm"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="absolute right-1.5 p-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-full transition-colors"
          >
            <Send size={14} className="ml-0.5" />
          </button>
        </form>
      </div>
    </aside>
  );
}
