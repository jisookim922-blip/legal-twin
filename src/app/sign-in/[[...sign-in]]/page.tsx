import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">LegalTwin</h1>
        <p className="text-[13px] text-gray-500">
          もう一人の自分を、24時間雇う。
        </p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: "shadow-none",
            card: "rounded-[32px] shadow-2xl border border-gray-100",
          },
        }}
      />
    </div>
  );
}
