"use client";

import { useState } from "react";
import { Scale, ArrowRight, Briefcase, Brain, FileText, Shield, Sparkles } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Scale,
    title: "LegalTwinへようこそ",
    subtitle: "もう一人の自分を、24時間雇う。",
    description:
      "あなたの過去の判例知識・文体・戦略パターンを学習し、弁護士業務の全5フェーズを半自動化する「分身AI」です。",
    visual: "welcome",
  },
  {
    icon: Briefcase,
    title: "案件を中心に管理",
    subtitle: "全ての作業は「案件」に紐づきます",
    description:
      "新規案件を作成 → 5つのフェーズ（受任→調査→書面→期日→終結）を順に進めます。タスク・書面・AIチャットは全て案件ごとに管理されます。",
    visual: "cases",
  },
  {
    icon: Brain,
    title: "AIは「下書き」を作ります",
    subtitle: "最終判断は必ずあなたが行います",
    description:
      "AIが生成した書面・分析はすべて「ドラフト」状態です。承認ボタンを押すまで正式書面にはなりません。AIはあくまで補助であり、弁護士としての判断を代替しません。",
    visual: "approval",
  },
  {
    icon: Shield,
    title: "利益相反を自動検知",
    subtitle: "新規案件登録時に全過去案件を横断チェック",
    description:
      "クライアント名・相手方を入力すると、過去案件のデータベースから一致・類似する名前を即時検索し、コンフリクトの可能性がある場合にアラートを表示します。",
    visual: "conflict",
  },
  {
    icon: Sparkles,
    title: "準備完了！",
    subtitle: "最初の案件を作成しましょう",
    description:
      "「新規案件を作成」ボタンから始めてください。相談内容を入力すれば、分身AIが事実整理・リスク評価・書面作成まで全てサポートします。",
    visual: "ready",
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Progress bar */}
        <div className="flex gap-1.5 px-6 pt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-blue-500" : "bg-gray-100"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
              isLast
                ? "bg-gradient-to-tr from-blue-500 to-indigo-500"
                : "bg-blue-50"
            }`}
          >
            <Icon
              size={28}
              className={isLast ? "text-white" : "text-blue-600"}
              strokeWidth={2}
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {current.title}
          </h2>
          <p className="text-blue-600 font-medium text-[15px] mb-4">
            {current.subtitle}
          </p>
          <p className="text-gray-500 text-[14px] leading-relaxed max-w-md mx-auto">
            {current.description}
          </p>
        </div>

        {/* Visual indicator */}
        {current.visual === "approval" && (
          <div className="mx-8 mb-4 flex gap-2 justify-center">
            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-[12px] font-semibold rounded-full border border-amber-200">
              ドラフト
            </span>
            <span className="text-gray-300">→</span>
            <span className="px-3 py-1.5 bg-green-50 text-green-700 text-[12px] font-semibold rounded-full border border-green-200">
              承認済み
            </span>
          </div>
        )}

        {current.visual === "conflict" && (
          <div className="mx-8 mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-center">
            <p className="text-red-700 text-[13px] font-medium">
              ⚠ 利益相反の可能性：「山田太郎」が2023年の相続事件で相手方として登場
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-8 pb-8 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3.5 rounded-full border border-gray-200 text-gray-600 font-medium text-[15px] hover:bg-gray-50 transition-colors"
            >
              戻る
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setStep(step + 1);
              }
            }}
            className="flex-1 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-[15px] flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {isLast ? (
              "始める"
            ) : (
              <>
                次へ <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
