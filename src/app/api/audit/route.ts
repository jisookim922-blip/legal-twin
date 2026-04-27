import { auth } from "@clerk/nextjs/server";
import { exportAuditLogs, verifyAuditChain } from "@/lib/audit";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "list";

  if (action === "verify") {
    const result = await verifyAuditChain(userId);
    return Response.json(result);
  }

  if (action === "export") {
    const fromStr = url.searchParams.get("from");
    const toStr = url.searchParams.get("to");
    const from = fromStr ? new Date(fromStr) : undefined;
    const to = toStr ? new Date(toStr) : undefined;
    const logs = await exportAuditLogs(userId, { from, to });
    return Response.json({ logs, count: logs.length });
  }

  // Default: recent logs
  const logs = await exportAuditLogs(userId);
  return Response.json({ logs: logs.slice(-50), count: logs.length });
}
