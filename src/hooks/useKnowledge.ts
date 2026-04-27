"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db, APP_ID, isConfigured } from "@/lib/firebase";
import type { KnowledgeItem } from "@/types";
import type { User } from "firebase/auth";

export function useKnowledge(user: User | null) {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);

  useEffect(() => {
    if (!isConfigured || !user || !db) return;

    const colRef = collection(
      db,
      "artifacts",
      APP_ID,
      "users",
      user.uid,
      "knowledge"
    );

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const items: KnowledgeItem[] = [];
      snapshot.forEach((d) =>
        items.push({ id: d.id, ...d.data() } as KnowledgeItem)
      );
      items.sort((a, b) => b.timestamp - a.timestamp);
      setKnowledgeItems(items);
    });

    return () => unsubscribe();
  }, [user]);

  const addKnowledge = useCallback(
    async (title: string, content: string) => {
      if (isConfigured && user && db) {
        await addDoc(
          collection(db, "artifacts", APP_ID, "users", user.uid, "knowledge"),
          { title, content, timestamp: Date.now() }
        );
      } else {
        // Local-only mode
        setKnowledgeItems((prev) => [
          { id: Date.now().toString(), title, content, timestamp: Date.now() },
          ...prev,
        ]);
      }
    },
    [user]
  );

  const removeKnowledge = useCallback(
    async (id: string) => {
      if (isConfigured && user && db) {
        await deleteDoc(
          doc(db, "artifacts", APP_ID, "users", user.uid, "knowledge", id)
        );
      } else {
        setKnowledgeItems((prev) => prev.filter((item) => item.id !== id));
      }
    },
    [user]
  );

  return { knowledgeItems, addKnowledge, removeKnowledge };
}
