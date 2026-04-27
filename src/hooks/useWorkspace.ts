"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, APP_ID, isConfigured } from "@/lib/firebase";
import { initialTasks } from "@/lib/constants";
import type { TaskMap, SyncStatus, Task } from "@/types";
import type { User } from "firebase/auth";

export function useWorkspace(user: User | null) {
  const [tasks, setTasks] = useState<TaskMap>(initialTasks);
  const [draftText, setDraftText] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const draftSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isConfigured || !user || !db) return;

    const workspaceRef = doc(
      db,
      "artifacts",
      APP_ID,
      "users",
      user.uid,
      "workspace",
      "main"
    );

    const unsubscribe = onSnapshot(
      workspaceRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTasks(data.tasks || initialTasks);
          if (draftSaveTimeout.current === null) {
            setDraftText(data.draftText ?? "");
          }
        } else {
          setDoc(workspaceRef, { tasks: initialTasks, draftText: "" });
        }
      },
      () => setSyncStatus("error")
    );

    return () => unsubscribe();
  }, [user]);

  const saveDraft = useCallback(
    (newVal: string) => {
      setDraftText(newVal);
      if (!isConfigured || !user || !db) return;
      const firestore = db;
      setSyncStatus("saving");
      if (draftSaveTimeout.current) clearTimeout(draftSaveTimeout.current);
      draftSaveTimeout.current = setTimeout(async () => {
        try {
          await updateDoc(
            doc(firestore, "artifacts", APP_ID, "users", user.uid, "workspace", "main"),
            { draftText: newVal }
          );
          setSyncStatus("synced");
        } catch {
          setSyncStatus("error");
        } finally {
          draftSaveTimeout.current = null;
        }
      }, 1500);
    },
    [user]
  );

  const setDraftDirect = useCallback(
    async (text: string) => {
      setDraftText(text);
      if (!isConfigured || !user || !db) return;
      const firestore = db;
      setSyncStatus("saving");
      try {
        await updateDoc(
          doc(firestore, "artifacts", APP_ID, "users", user.uid, "workspace", "main"),
          { draftText: text }
        );
        setSyncStatus("synced");
      } catch {
        setSyncStatus("error");
      }
    },
    [user]
  );

  const updateTasks = useCallback(
    async (newTasks: TaskMap) => {
      setTasks(newTasks);
      if (!isConfigured || !user || !db) return;
      const firestore = db;
      setSyncStatus("saving");
      try {
        await updateDoc(
          doc(firestore, "artifacts", APP_ID, "users", user.uid, "workspace", "main"),
          { tasks: newTasks }
        );
        setSyncStatus("synced");
      } catch {
        setSyncStatus("error");
      }
    },
    [user]
  );

  const addTask = useCallback(
    async (phaseId: number, text: string) => {
      const newTask: Task = {
        id: Date.now().toString(),
        text,
        completed: false,
      };
      const newTasks = {
        ...tasks,
        [phaseId]: [...(tasks[phaseId] || []), newTask],
      };
      await updateTasks(newTasks);
    },
    [tasks, updateTasks]
  );

  const deleteTask = useCallback(
    async (phaseId: number, taskId: string) => {
      const newTasks = {
        ...tasks,
        [phaseId]: tasks[phaseId].filter((t) => t.id !== taskId),
      };
      await updateTasks(newTasks);
    },
    [tasks, updateTasks]
  );

  const toggleTask = useCallback(
    async (phaseId: number, taskId: string) => {
      const task = tasks[phaseId].find((t) => t.id === taskId);
      if (!task) return;
      const isCompleting = !task.completed;
      const newTasks = {
        ...tasks,
        [phaseId]: tasks[phaseId].map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        ),
      };
      await updateTasks(newTasks);
      return { isCompleting, taskText: task.text };
    },
    [tasks, updateTasks]
  );

  return {
    tasks,
    draftText,
    syncStatus,
    saveDraft,
    setDraftDirect,
    addTask,
    deleteTask,
    toggleTask,
  };
}
