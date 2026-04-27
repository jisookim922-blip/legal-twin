import type { Task } from "@/types";

export const phases = [
  {
    id: 1,
    name: "初期対応・受任",
    icon: "Briefcase" as const,
    description: "相談受付、コンフリクトチェック、委任契約",
  },
  {
    id: 2,
    name: "調査・証拠収集",
    icon: "Search" as const,
    description: "資料電子化、証拠評価、判例調査",
  },
  {
    id: 3,
    name: "書面作成・折衝",
    icon: "FileText" as const,
    description: "内容証明、契約書レビュー、訴状起案",
  },
  {
    id: 4,
    name: "期日・進行管理",
    icon: "Calendar" as const,
    description: "期日調整、出廷、タスク管理",
  },
  {
    id: 5,
    name: "終結・ナレッジ",
    icon: "Archive" as const,
    description: "精算、記録アーカイブ、知見蓄積",
  },
] as const;

export type PhaseIconName = (typeof phases)[number]["icon"];

export const initialTasks: Record<number, Task[]> = {
  1: [
    { id: "1-1", text: "初回相談の日程調整", completed: true },
    { id: "1-2", text: "利益相反（コンフリクト）チェック", completed: true },
    { id: "1-3", text: "法律相談の実施・事実関係の整理", completed: false },
    { id: "1-4", text: "法的論点・リスクの初期評価", completed: false },
  ],
  2: [
    { id: "2-1", text: "証拠書類の受領と電子化（スキャン）", completed: false },
    { id: "2-2", text: "事件記録のインデックス化", completed: false },
    { id: "2-3", text: "関連判例の深掘り調査", completed: false },
  ],
  3: [
    { id: "3-1", text: "受任通知の作成と発送", completed: false },
    { id: "3-2", text: "相手方主張の整理・分析", completed: false },
    { id: "3-3", text: "合意書ドラフトのAIリーガルチェック", completed: false },
    { id: "3-4", text: "訴状・準備書面の起案", completed: false },
  ],
  4: [
    { id: "4-1", text: "裁判所への書類オンライン提出", completed: false },
    {
      id: "4-2",
      text: "期日の日程調整とスケジュール登録",
      completed: false,
    },
  ],
  5: [
    { id: "5-1", text: "最終的な合意条件のすり合わせ", completed: false },
    {
      id: "5-2",
      text: "預り金・実費の精算と請求書作成",
      completed: false,
    },
    {
      id: "5-3",
      text: "本件ナレッジのAIデータベースへの蓄積",
      completed: false,
    },
  ],
};

export const systemInstruction = `
あなたはベテラン弁護士の「分身AI」として機能するアシスタントです。
ユーザー（弁護士）が過去に扱った判例データ、契約書のレビュー履歴、訴訟戦略の思考パターンをすべてデータベースとして学習・同期済みであるという設定で振る舞ってください。

【役割とトーン】
- 丁寧ですが、プロフェッショナルで的確なアドバイスを行います。
- 「過去の案件傾向から」「思考パターンを分析すると」といった言い回しを使用し、「分身」であることを演出してください。
- 契約書のレビュー時は、法的リスクを指摘し、過去の知見に基づく修正案（代替条項）を提示してください。
- 裁判の戦略時は、類似判例（架空で可）を挙げ、勝訴のための証拠収集や主張の組み立て方を提案してください。
`;
