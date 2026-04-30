import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "プライバシーポリシー | LegalTwin",
  description: "LegalTwin のプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="プライバシーポリシー">
      <p className="text-[13px] text-gray-500 mb-6">最終改定日：2026年4月28日</p>

      <Section title="1. 取得する個人情報">
        <p>当社は、本サービスの提供にあたり、以下の個人情報を取得します。</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>氏名・メールアドレス（Clerk認証連携時）</li>
          <li>所属事務所名（任意）</li>
          <li>支払情報（カード番号は当社では保持せず、Stripe Inc. が処理）</li>
          <li>ユーザーが入力した案件メモ・書面内容（暗号化保存）</li>
          <li>本サービスの利用ログ（アクセス日時、操作内容）</li>
        </ul>
      </Section>

      <Section title="2. 利用目的">
        <ul className="list-disc list-inside space-y-1">
          <li>本サービスの提供および利用継続のため</li>
          <li>本人確認、料金請求のため</li>
          <li>不正利用の防止、セキュリティ向上のため</li>
          <li>サービス品質改善のための統計分析（個人を特定しない形式）</li>
          <li>重要なお知らせ・規約改定の通知のため</li>
        </ul>
      </Section>

      <Section title="3. 第三者提供（業務委託）">
        <p>
          当社は、以下の業務委託先に対し、本サービスの提供に必要な範囲で個人情報を取り扱わせます。委託先には適切な監督を行います。
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>
            <strong>Vercel Inc.</strong>（米国・アプリケーションホスティング、東京リージョン処理）
          </li>
          <li>
            <strong>Neon Inc.</strong>（米国・データベース、東京リージョン処理）
          </li>
          <li>
            <strong>Clerk Inc.</strong>（米国・認証基盤）
          </li>
          <li>
            <strong>Stripe Inc.</strong>（米国・決済処理）
          </li>
          <li>
            <strong>Google LLC / Anthropic PBC</strong>（米国・AI API、Vercel AI Gateway経由・学習非利用契約）
          </li>
        </ul>
        <p className="mt-2 text-[12px] text-gray-500">
          ※ 米国への越境移転については、Standard Contractual Clauses (SCC)
          相当の契約条項に基づき適切な保護措置を講じています（個人情報保護法第28条）。
        </p>
      </Section>

      <Section title="4. AI提供事業者への送信ポリシー">
        <ol className="list-decimal list-inside space-y-1">
          <li>
            AI送信前に、依頼者氏名・電話番号・メール・銀行口座等のPIIを自動マスキングします。
          </li>
          <li>「機密案件モード」を有効にした案件は、外部AIへの送信を完全にブロックします。</li>
          <li>
            すべてのAI送受信は SHA-256 ハッシュチェーンで監査ログとして記録され、改ざん検知が可能です。
          </li>
          <li>AI提供事業者とはZero Retention契約を結んでおり、ユーザーデータがモデル学習に使用されることはありません。</li>
        </ol>
      </Section>

      <Section title="5. 安全管理措置">
        <ul className="list-disc list-inside space-y-1">
          <li>転送時：TLS 1.3 による通信暗号化</li>
          <li>保存時：AES-256 による暗号化</li>
          <li>処理リージョン：日本国内（東京）に限定</li>
          <li>アクセス制御：Clerk による多要素認証</li>
          <li>監査ログ：1年以上の改ざん防止保存</li>
        </ul>
      </Section>

      <Section title="6. 開示・訂正・削除請求">
        <p>
          ユーザーは、自己の個人情報について、開示、訂正、削除、利用停止を請求することができます。請求は <a href="mailto:privacy@legal-twin.app" className="text-blue-600 hover:underline">privacy@legal-twin.app</a> 宛にお送りください。本人確認のうえ、合理的な期間内に対応します。
        </p>
      </Section>

      <Section title="7. Cookie等の利用">
        <p>
          本サービスでは、ログイン状態の維持、サービス改善のためのアクセス解析（Vercel Analytics）に Cookie を使用します。Cookie の利用を拒否する場合、ブラウザの設定により無効化できますが、一部機能が制限される可能性があります。
        </p>
      </Section>

      <Section title="8. 退会後のデータ取扱い">
        <p>
          ユーザーが本サービスを退会した場合、個人情報および案件データは原則として30日以内に完全削除されます。ただし、法令上保管が義務付けられた取引記録、監査ログ等は法定保存期間中保管されます。
        </p>
      </Section>

      <Section title="9. お問い合わせ">
        <p>
          本ポリシーに関するお問い合わせは以下までお願いします。
        </p>
        <p className="mt-2">
          メール：<a href="mailto:privacy@legal-twin.app" className="text-blue-600 hover:underline">privacy@legal-twin.app</a>
        </p>
      </Section>
    </LegalLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-[15px] font-bold text-gray-900 mb-2">{title}</h2>
      <div className="text-[13px] text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}
