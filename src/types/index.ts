export interface Phase {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export type TaskMap = Record<number, Task[]>;

export interface ChatMessage {
  id?: string;
  role: "user" | "ai";
  text: string;
  timestamp: number;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export type SyncStatus = "synced" | "saving" | "error";

// --- Case Management ---
export interface CaseInfo {
  id: string;
  name: string;
  clientName: string;
  category: CaseCategory;
  status: "active" | "closed";
  createdAt: number;
  description?: string;
  opposingParty?: string;
  /** 機密案件モード: ON のとき外部AIへの送信を完全ブロック */
  confidentialMode?: boolean;
}

export type CaseCategory =
  | "family"
  | "inheritance"
  | "divorce"
  | "labor"
  | "corporate"
  | "realestate"
  | "criminal"
  | "debt"
  | "ip"
  | "other";

export const CASE_CATEGORY_LABELS: Record<CaseCategory, string> = {
  family: "家事事件",
  inheritance: "相続",
  divorce: "離婚",
  labor: "労働",
  corporate: "企業法務",
  realestate: "不動産",
  criminal: "刑事",
  debt: "債務・債権",
  ip: "知的財産",
  other: "その他",
};

// --- Conflict Check ---
export interface ConflictResult {
  found: boolean;
  matches: ConflictMatch[];
}

export interface ConflictMatch {
  caseId: string;
  caseName: string;
  matchedName: string;
  role: string;
  similarity: number;
}

// --- Document Templates ---
export type DocumentType =
  | "notice"
  | "demand"
  | "complaint"
  | "settlement"
  | "report"
  | "invoice";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  notice: "受任通知",
  demand: "内容証明",
  complaint: "訴状",
  settlement: "和解契約書",
  report: "完了報告書",
  invoice: "請求書",
};

// --- Approval Workflow ---
export type ApprovalStatus = "draft" | "approved" | "rejected" | "revised";

export interface DraftDocument {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  status: ApprovalStatus;
  createdAt: number;
  updatedAt: number;
  aiGenerated: boolean;
  revisionHistory: RevisionEntry[];
}

export interface RevisionEntry {
  timestamp: number;
  action: ApprovalStatus;
  note?: string;
}

// --- Fact Timeline ---
export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  persons: string[];
  legalNote?: string;
}

export interface PersonNode {
  id: string;
  name: string;
  role: string;
  relation?: string;
}
