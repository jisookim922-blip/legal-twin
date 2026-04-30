import Link from "next/link";
import { Scale } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Scale size={14} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[14px]">LegalTwin</span>
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed max-w-xs">
              弁護士のための分身AI。守秘義務を守りながら、訴訟書面の起案・判例検索・期日管理を半自動化します。
            </p>
          </div>

          <div>
            <h3 className="text-[12px] font-semibold text-gray-900 mb-3 uppercase tracking-wider">
              プロダクト
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                  料金
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="text-gray-600 hover:text-gray-900">
                  ログイン
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="text-gray-600 hover:text-gray-900">
                  新規登録
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[12px] font-semibold text-gray-900 mb-3 uppercase tracking-wider">
              法務
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/tokushoho" className="text-gray-600 hover:text-gray-900">
                  特定商取引法表記
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-gray-400">
          <div>© 2026 LegalTwin</div>
          <div className="flex items-center gap-3">
            <span>🇯🇵 国内処理（東京リージョン）</span>
            <span>🛡 弁護士法23条準拠</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
