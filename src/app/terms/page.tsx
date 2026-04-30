import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "利用規約 | LegalTwin",
  description: "LegalTwin の利用規約",
};

export default function TermsPage() {
  return (
    <LegalLayout title="利用規約">
      <p className="text-[13px] text-gray-500 mb-6">最終改定日：2026年4月28日</p>

      <Section title="第1条（適用）">
        <p>
          本利用規約（以下「本規約」といいます）は、本サービス提供者（以下「当社」といいます）が提供するクラウドサービス「LegalTwin」（以下「本サービス」といいます）の利用条件を定めるものです。本サービスを利用するすべての登録者（以下「ユーザー」といいます）は、本規約に同意のうえ本サービスを利用するものとします。
        </p>
      </Section>

      <Section title="第2条（利用資格）">
        <p>
          本サービスは、日本国内において日本弁護士連合会または所属弁護士会に登録された弁護士、または弁護士の補助業務に従事するパラリーガル等を対象とします。ユーザーは、登録時に提供する情報が正確であることを保証します。
        </p>
      </Section>

      <Section title="第3条（アカウント管理）">
        <p>
          ユーザーは、自己の責任においてアカウント情報（メールアドレス、パスワード等）を管理するものとし、第三者にこれを譲渡、貸与、共有してはなりません。アカウントの不正利用等により当社に損害が生じた場合、ユーザーはこれを賠償する責任を負います。
        </p>
      </Section>

      <Section title="第4条（料金および支払い）">
        <ol className="list-decimal list-inside space-y-1">
          <li>
            本サービスの料金は、当社所定の料金プラン（Solo / Pro / Elite）に従うものとし、Stripe Inc. を通じてクレジットカード決済により支払うものとします。
          </li>
          <li>
            14日間の無料トライアル期間が設けられており、当該期間内に解約手続を行わない場合、自動的に有料プランに移行します。
          </li>
          <li>
            既に支払われた料金は、法令で定められる場合を除き返金されないものとします。
          </li>
        </ol>
      </Section>

      <Section title="第5条（AI出力の性質と責任）">
        <ol className="list-decimal list-inside space-y-1">
          <li>
            本サービスが提供するAI（人工知能）による出力は、すべて「ドラフト」であり、確定した法的助言ではありません。
          </li>
          <li>
            ユーザーは、AI出力を業務に使用する前に、必ず弁護士としての専門的判断によりその内容を確認し、必要な修正を加える義務を負います。
          </li>
          <li>
            AI出力の内容、これに基づく業務遂行、第三者への提供等から生じる一切の結果について、ユーザーが全責任を負うものとし、当社は一切の責任を負いません。
          </li>
        </ol>
      </Section>

      <Section title="第6条（守秘義務とデータ取扱い）">
        <ol className="list-decimal list-inside space-y-1">
          <li>
            当社は、ユーザーが本サービスに入力した情報を、本サービスの提供および改善のためにのみ使用します。
          </li>
          <li>
            ユーザーは、依頼者情報を本サービスに入力する場合、弁護士法第23条の守秘義務および個人情報保護法の規定を遵守する責任を負います。本サービスは、PII（個人を特定できる情報）の自動マスキング、国内データ処理（東京リージョン）、改ざん防止監査ログ等の安全管理措置を提供しますが、ユーザーは依頼者の同意取得等を自ら行うものとします。
          </li>
          <li>
            当社は、ユーザーのデータをAIモデルの学習に使用しません（Zero Retention契約）。
          </li>
        </ol>
      </Section>

      <Section title="第7条（禁止事項）">
        <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>法令、公序良俗に違反する行為</li>
          <li>非弁活動（弁護士法第72条違反）に該当する行為</li>
          <li>当社、他のユーザー、第三者の権利を侵害する行為</li>
          <li>本サービスのリバースエンジニアリング、複製、再配布</li>
          <li>本サービスの動作を妨害する行為</li>
          <li>登録情報の虚偽記載</li>
        </ul>
      </Section>

      <Section title="第8条（サービスの変更・中断）">
        <p>
          当社は、メンテナンス、システム障害、その他やむを得ない事由により、ユーザーへの事前通知なく本サービスの全部または一部を変更、中断、終了することができるものとします。
        </p>
      </Section>

      <Section title="第9条（解約・退会）">
        <p>
          ユーザーは、いつでもアカウント設定または Stripe カスタマーポータルから本サービスを解約することができます。解約後、有料機能は次回更新日まで利用可能ですが、それ以降は無効となります。
        </p>
      </Section>

      <Section title="第10条（免責）">
        <ol className="list-decimal list-inside space-y-1">
          <li>
            当社は、本サービスの正確性、完全性、特定目的への適合性について保証するものではありません。
          </li>
          <li>
            当社の責任は、当該事象が発生した月にユーザーが当社に支払った料金額を上限とします（ただし、当社の故意または重過失による場合を除く）。
          </li>
        </ol>
      </Section>

      <Section title="第11条（規約の変更）">
        <p>
          当社は、必要と判断した場合、ユーザーへの事前通知のうえ本規約を変更することができます。変更後の規約は、当社が指定する日から効力を生じます。
        </p>
      </Section>

      <Section title="第12条（準拠法・管轄）">
        <p>
          本規約は日本法に準拠し、本サービスに関する紛争は東京地方裁判所を第一審の専属的合意管轄裁判所とします。
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
