import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | LegalTwin",
  description: "特定商取引法に基づく表記",
};

export default function TokushohoPage() {
  return (
    <LegalLayout title="特定商取引法に基づく表記">
      <table className="w-full text-[13px] text-gray-700">
        <tbody>
          <Row label="販売事業者">
            事業者情報は登録時に開示します（請求があり次第、遅滞なく書面または電子的方法により提供）。
          </Row>
          <Row label="運営責任者">登録時に開示</Row>
          <Row label="所在地">登録時に開示</Row>
          <Row label="電話番号">
            登録時に開示（請求から遅滞なく対応）
          </Row>
          <Row label="メールアドレス">
            <a
              href="mailto:support@legal-twin.app"
              className="text-blue-600 hover:underline"
            >
              support@legal-twin.app
            </a>
          </Row>
          <Row label="販売価格">
            <ul className="list-disc list-inside space-y-1">
              <li>Solo プラン：月額 9,800 円（税込）</li>
              <li>Pro プラン：月額 30,000 円（税込）</li>
              <li>Elite プラン：月額 50,000 円（税込）</li>
            </ul>
            <p className="mt-2 text-[12px] text-gray-500">
              ※ 年間支払いの場合、10〜17% 割引が適用されます。
            </p>
          </Row>
          <Row label="商品代金以外の必要料金">
            インターネット接続料、通信料はユーザー負担。
          </Row>
          <Row label="支払方法">
            クレジットカード（Visa / Mastercard / JCB / American Express / Diners Club）
          </Row>
          <Row label="支払時期">
            お申し込み時にカード認証、初月は14日間の無料トライアル後に課金開始。以降は毎月同日に自動課金。
          </Row>
          <Row label="サービス提供時期">
            アカウント登録完了後、即時利用可能。
          </Row>
          <Row label="返金・解約について">
            <ol className="list-decimal list-inside space-y-1">
              <li>
                14日間の無料トライアル期間中はいつでも解約可能。料金は発生しません。
              </li>
              <li>
                有料プラン開始後の解約は、Stripe カスタマーポータルから随時可能。次回更新日以降は課金されません。
              </li>
              <li>
                既に支払われた料金については、法令で定められる場合を除き返金されません。
              </li>
              <li>
                サービス提供者の重大な過失による場合を除き、商品の性質上、ご利用後の返金には応じかねます。
              </li>
            </ol>
          </Row>
          <Row label="動作環境">
            <ul className="list-disc list-inside space-y-1">
              <li>
                Webブラウザ：Chrome、Safari、Edge、Firefox の最新版
              </li>
              <li>OS：Windows 10以降、macOS 11以降、iOS 15以降、Android 10以降</li>
              <li>インターネット接続必須</li>
            </ul>
          </Row>
        </tbody>
      </table>
    </LegalLayout>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-gray-100">
      <th className="text-left align-top py-3 pr-4 w-1/3 text-[13px] font-semibold text-gray-900">
        {label}
      </th>
      <td className="py-3 text-[13px] text-gray-700 leading-relaxed">{children}</td>
    </tr>
  );
}
