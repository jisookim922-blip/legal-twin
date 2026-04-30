"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-12 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle size={28} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          エラーが発生しました
        </h1>
        <p className="text-[14px] text-gray-500 mb-2">
          ご不便をおかけして申し訳ございません
        </p>
        {error.digest && (
          <p className="text-[11px] font-mono text-gray-400 mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
          >
            <RotateCcw size={14} />
            再試行
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-full transition-colors"
          >
            <ArrowLeft size={14} />
            トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
