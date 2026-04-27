import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = () => neon(process.env.DATABASE_URL!);

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = sql();
  const rows = (await db`
    SELECT pii_masking_enabled, audit_log_full_payload, default_confidential_mode, hourly_rate
    FROM user_settings
    WHERE user_id = ${userId}
    LIMIT 1
  `) as Array<{
    pii_masking_enabled: boolean;
    audit_log_full_payload: boolean;
    default_confidential_mode: boolean;
    hourly_rate: number;
  }>;

  if (rows.length === 0) {
    // Create defaults
    await db`
      INSERT INTO user_settings (user_id) VALUES (${userId})
      ON CONFLICT (user_id) DO NOTHING
    `;
    return Response.json({
      piiMaskingEnabled: true,
      auditLogFullPayload: true,
      defaultConfidentialMode: false,
      hourlyRate: 15000,
    });
  }

  const row = rows[0];
  return Response.json({
    piiMaskingEnabled: row.pii_masking_enabled,
    auditLogFullPayload: row.audit_log_full_payload,
    defaultConfidentialMode: row.default_confidential_mode,
    hourlyRate: row.hourly_rate,
  });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: {
    piiMaskingEnabled?: boolean;
    auditLogFullPayload?: boolean;
    defaultConfidentialMode?: boolean;
    hourlyRate?: number;
  } = await req.json();

  const db = sql();

  // Ensure row exists
  await db`
    INSERT INTO user_settings (user_id) VALUES (${userId})
    ON CONFLICT (user_id) DO NOTHING
  `;

  if (body.piiMaskingEnabled !== undefined) {
    await db`UPDATE user_settings SET pii_masking_enabled = ${body.piiMaskingEnabled}, updated_at = NOW() WHERE user_id = ${userId}`;
  }
  if (body.auditLogFullPayload !== undefined) {
    await db`UPDATE user_settings SET audit_log_full_payload = ${body.auditLogFullPayload}, updated_at = NOW() WHERE user_id = ${userId}`;
  }
  if (body.defaultConfidentialMode !== undefined) {
    await db`UPDATE user_settings SET default_confidential_mode = ${body.defaultConfidentialMode}, updated_at = NOW() WHERE user_id = ${userId}`;
  }
  if (body.hourlyRate !== undefined) {
    await db`UPDATE user_settings SET hourly_rate = ${body.hourlyRate}, updated_at = NOW() WHERE user_id = ${userId}`;
  }

  return Response.json({ success: true });
}
