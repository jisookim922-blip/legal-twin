import Link from "next/link";
import { Scale, ArrowLeft } from "lucide-react";
import Footer from "./Footer";

export default function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <nav className="max-w-3xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-2 rounded-xl shadow-sm text-white">
            <Scale size={18} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg">LegalTwin</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[13px] text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={14} /> トップへ
        </Link>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 pb-16">
        <article className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">{title}</h1>
          {children}
        </article>
      </main>

      <Footer />
    </div>
  );
}
