"use client";

import { useState, useEffect } from "react";
import { signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { auth, isConfigured } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !auth) {
      // Demo mode: no Firebase
      setLoading(false);
      return;
    }

    signInAnonymously(auth).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isConfigured };
}
