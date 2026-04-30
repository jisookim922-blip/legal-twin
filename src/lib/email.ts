import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "LegalTwin <noreply@legal-twin.app>";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Send an email via Resend. If not configured, logs and returns success.
 */
export async function sendEmail(opts: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.log("[email] Resend not configured. Would send:", {
      to: opts.to,
      subject: opts.subject,
    });
    return { success: false, error: "Resend not configured" };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true, id: result.data?.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// --- Templates ---

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #f5f5f7;
  padding: 24px;
  line-height: 1.6;
  color: #1d1d1f;
`;

const cardStyle = `
  background: white;
  border-radius: 24px;
  padding: 32px;
  max-width: 560px;
  margin: 0 auto;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
`;

const buttonStyle = `
  display: inline-block;
  background: #2563eb;
  color: white;
  padding: 14px 28px;
  border-radius: 9999px;
  text-decoration: none;
  font-weight: 500;
  margin: 16px 0;
`;

export function welcomeEmailHtml(userName: string, appUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<body style="${baseStyle}">
  <div style="${cardStyle}">
    <h1 style="font-size: 22px; margin-bottom: 8px;">LegalTwinへようこそ</h1>
    <p>${userName} 様</p>
    <p>このたびはLegalTwinにご登録いただきありがとうございます。14日間の無料トライアルが始まりました。</p>
    <p><strong>最初にやること：</strong></p>
    <ol>
      <li>最初の案件を作成する</li>
      <li>過去書面を5件アップロード（分身AI学習）</li>
      <li>訴訟書面を起案してみる</li>
    </ol>
    <a href="${appUrl}/app" style="${buttonStyle}">ワークスペースへ →</a>
    <p style="font-size: 12px; color: #888; margin-top: 24px;">
      ご不明な点は <a href="mailto:support@legal-twin.app">support@legal-twin.app</a> までお問い合わせください。
    </p>
  </div>
</body>
</html>`;
}

export function subscriptionStartedEmailHtml(planName: string, priceJpy: number, appUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<body style="${baseStyle}">
  <div style="${cardStyle}">
    <h1 style="font-size: 22px; margin-bottom: 8px;">サブスクリプション開始のお知らせ</h1>
    <p>LegalTwin <strong>${planName}</strong> プラン（月額¥${priceJpy.toLocaleString()}）のサブスクリプションが開始されました。</p>
    <a href="${appUrl}/app" style="${buttonStyle}">ワークスペースへ →</a>
    <p style="font-size: 12px; color: #888; margin-top: 24px;">
      請求書は Stripe より別途送付されます。プラン変更・解約はワークスペース内の「プラン管理」から行えます。
    </p>
  </div>
</body>
</html>`;
}

export function trialEndingEmailHtml(daysLeft: number, appUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<body style="${baseStyle}">
  <div style="${cardStyle}">
    <h1 style="font-size: 22px; margin-bottom: 8px;">無料トライアル終了まで残り ${daysLeft} 日</h1>
    <p>LegalTwin の無料トライアル期間がまもなく終了します。引き続きご利用いただくには、プランをお選びください。</p>
    <a href="${appUrl}/pricing" style="${buttonStyle}">プランを選ぶ →</a>
    <p style="font-size: 12px; color: #888; margin-top: 24px;">
      期間内に解約された場合、課金は発生しません。
    </p>
  </div>
</body>
</html>`;
}
