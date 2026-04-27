import { auth } from "@clerk/nextjs/server";
import { exportAuditLogs } from "@/lib/audit";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = (await exportAuditLogs(userId)) as Array<{
    id: number;
    case_id: string | null;
    operation: string;
    ai_provider: string | null;
    ai_model: string | null;
    pii_detected_count: number;
    pii_types: string[] | null;
    input_hash: string;
    output_hash: string;
    confidential_mode: boolean;
    region: string | null;
    duration_ms: number | null;
    status: string;
    prev_hash: string | null;
    this_hash: string;
    created_at: Date;
  }>;

  const headers = [
    "id",
    "created_at",
    "operation",
    "case_id",
    "ai_provider",
    "ai_model",
    "pii_count",
    "pii_types",
    "confidential_mode",
    "region",
    "duration_ms",
    "status",
    "input_hash",
    "output_hash",
    "prev_hash",
    "this_hash",
  ];

  const rows = logs.map((log) =>
    [
      log.id,
      new Date(log.created_at).toISOString(),
      log.operation,
      log.case_id,
      log.ai_provider,
      log.ai_model,
      log.pii_detected_count,
      log.pii_types?.join("|") ?? "",
      log.confidential_mode,
      log.region,
      log.duration_ms,
      log.status,
      log.input_hash,
      log.output_hash,
      log.prev_hash,
      log.this_hash,
    ]
      .map(csvEscape)
      .join(",")
  );

  const csv = "﻿" + headers.join(",") + "\n" + rows.join("\n");

  const filename = `legaltwin-audit-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
