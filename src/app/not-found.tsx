import Link from "next/link";
import { Scale, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-12 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
          <Scale size={28} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-[15px] text-gray-500 mb-8">
          お探しのページは見つかりませんでした
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
        >
          <ArrowLeft size={14} />
          トップに戻る
        </Link>
      </div>
    </div>
  );
}
