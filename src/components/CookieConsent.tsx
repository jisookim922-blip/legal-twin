"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "legaltwin_cookie_consent_v1";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, at: Date.now() }));
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: false, at: Date.now() }));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50">
      <div className="bg-white border border-gray-200 rounded-[24px] shadow-2xl p-5 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Cookie size={18} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-1">
              Cookie の使用について
            </h3>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              ログイン状態の維持と、サービス改善のためのアクセス解析（Vercel Analytics）に Cookie を使用します。詳細は
              <Link
                href="/privacy"
                className="text-blue-600 hover:underline mx-0.5"
              >
                プライバシーポリシー
              </Link>
              をご覧ください。
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={accept}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium rounded-full transition-colors"
              >
                同意する
              </button>
              <button
                onClick={decline}
                className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[12px] font-medium rounded-full transition-colors"
              >
                必須のみ
              </button>
            </div>
          </div>
          <button
            onClick={decline}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
