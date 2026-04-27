"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, APP_ID, isConfigured } from "@/lib/firebase";
import type { ChatMessage, KnowledgeItem } from "@/types";
import type { User } from "firebase/auth";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "ai",
  text: "こんにちは。あなたの「分身AI」です。\nエディタにメモや書面を入力し、レビュー指示やタスクの進捗管理を行ってください。\n\nVercel AI Gatewayで駆動中です。",
  timestamp: Date.now(),
};

function buildKnowledgeContext(items: KnowledgeItem[]): string {
  if (items.length === 0) return "";
  let ctx =
    "【登録済みのナレッジ（あなたの過去の知見）】\n以下の知見を最優先で考慮して回答してください。\n";
  items.slice(0, 5).forEach((item, i) => {
    ctx += `\n[知見${i + 1}] ${item.title}\n${item.content}\n`;
  });
  return ctx;
}

interface ChatCallContext {
  caseId?: string;
  knownEntities?: { clientName?: string; opposingParty?: string; caseName?: string };
  confidentialMode?: boolean;
}

async function callChatAPI(
  messages: { role: "user" | "assistant"; content: string }[],
  knowledgeContext: string,
  callContext: ChatCallContext = {}
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, knowledgeContext, ...callContext }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  // toTextStreamResponse returns plain text stream
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
  }

  return fullText || "応答を生成できませんでした。";
}

export function useChat(user: User | null) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    WELCOME_MESSAGE,
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isConfigured || !user || !db) return;

    const chatColRef = collection(
      db,
      "artifacts",
      APP_ID,
      "users",
      user.uid,
      "chatMessages"
    );

    const unsubscribe = onSnapshot(chatColRef, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((d) =>
        msgs.push({ id: d.id, ...d.data() } as ChatMessage)
      );
      msgs.sort((a, b) => a.timestamp - b.timestamp);

      if (msgs.length === 0) {
        addDoc(chatColRef, {
          role: "ai",
          text: "こんにちは。あなたの「分身AI」です。クラウド同期が完了しました。\nエディタにメモや書面を入力し、レビュー指示やタスクの進捗管理を行ってください。",
          timestamp: Date.now(),
        });
      } else {
        setChatMessages(msgs);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const addLocalMessage = useCallback(
    (role: "user" | "ai", text: string) => {
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role, text, timestamp: Date.now() },
      ]);
    },
    []
  );

  const sendMessage = useCallback(
    async (
      text: string,
      draftText: string,
      knowledgeItems: KnowledgeItem[],
      callContext: ChatCallContext = {}
    ) => {
      if (!text.trim()) return;

      const chatColRef =
        isConfigured && user && db
          ? collection(db, "artifacts", APP_ID, "users", user.uid, "chatMessages")
          : null;

      setIsTyping(true);

      try {
        if (chatColRef) {
          await addDoc(chatColRef, { role: "user", text, timestamp: Date.now() });
        } else {
          addLocalMessage("user", text);
        }

        const history = chatMessages.slice(-10).map((msg) => ({
          role: (msg.role === "ai" ? "assistant" : "user") as
            | "user"
            | "assistant",
          content: msg.text,
        }));

        const contextText = draftText.trim()
          ? `\n\n【現在エディタに入力されているテキスト（参考資料）】\n${draftText}`
          : "";

        history.push({ role: "user", content: text + contextText });

        const knowledgeContext = buildKnowledgeContext(knowledgeItems);
        const aiText = await callChatAPI(history, knowledgeContext, callContext);

        if (chatColRef) {
          await addDoc(chatColRef, {
            role: "ai",
            text: aiText,
            timestamp: Date.now(),
          });
        } else {
          addLocalMessage("ai", aiText);
        }
      } catch {
        const errMsg =
          "通信エラーが発生しました。機密案件モードがONの場合は外部AI送信がブロックされている可能性があります。";
        if (chatColRef) {
          await addDoc(chatColRef, {
            role: "ai",
            text: errMsg,
            timestamp: Date.now(),
          });
        } else {
          addLocalMessage("ai", errMsg);
        }
      } finally {
        setIsTyping(false);
      }
    },
    [user, chatMessages, addLocalMessage]
  );

  const sendAutoMessage = useCallback(
    async (
      userText: string,
      contextPayload: string,
      knowledgeItems: KnowledgeItem[],
      callContext: ChatCallContext = {}
    ) => {
      const chatColRef =
        isConfigured && user && db
          ? collection(db, "artifacts", APP_ID, "users", user.uid, "chatMessages")
          : null;

      setIsTyping(true);

      try {
        if (chatColRef) {
          await addDoc(chatColRef, {
            role: "user",
            text: userText,
            timestamp: Date.now(),
          });
        } else {
          addLocalMessage("user", userText);
        }

        const history = chatMessages.slice(-5).map((msg) => ({
          role: (msg.role === "ai" ? "assistant" : "user") as
            | "user"
            | "assistant",
          content: msg.text,
        }));
        history.push({ role: "user", content: contextPayload });

        const knowledgeContext = buildKnowledgeContext(knowledgeItems);
        const aiText = await callChatAPI(history, knowledgeContext, callContext);

        if (chatColRef) {
          await addDoc(chatColRef, {
            role: "ai",
            text: aiText,
            timestamp: Date.now(),
          });
        } else {
          addLocalMessage("ai", aiText);
        }
      } catch {
        // silent
      } finally {
        setIsTyping(false);
      }
    },
    [user, chatMessages, addLocalMessage]
  );

  return { chatMessages, isTyping, sendMessage, sendAutoMessage };
}
