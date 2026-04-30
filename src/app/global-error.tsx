"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#F5F5F7",
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "32px",
            padding: "3rem",
            maxWidth: "28rem",
            textAlign: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            border: "1px solid #f0f0f0",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            重大なエラーが発生しました
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            ページを再読み込みしてください
          </p>
          <button
            onClick={reset}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}
