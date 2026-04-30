import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "LegalTwin - もう一人の自分を、24時間雇う。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #f5f5f7 0%, #e0e7ff 50%, #ddd6fe 100%)",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "#2563eb",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "44px",
              color: "white",
              boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
            }}
          >
            ⚖
          </div>
          <div
            style={{
              fontSize: "44px",
              fontWeight: 800,
              color: "#1d1d1f",
              letterSpacing: "-0.02em",
            }}
          >
            LegalTwin
          </div>
        </div>
        <div
          style={{
            fontSize: "76px",
            fontWeight: 800,
            color: "#1d1d1f",
            textAlign: "center",
            lineHeight: 1.2,
            letterSpacing: "-0.04em",
            marginBottom: "24px",
          }}
        >
          もう一人の自分を、
          <br />
          24時間雇う。
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "#6b7280",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.4,
          }}
        >
          弁護士のための分身AI。守秘義務を守りながら業務を半自動化。
        </div>
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "60px",
          }}
        >
          {["🇯🇵 国内処理", "🛡 弁護士法準拠", "✨ 14日間無料"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "12px 24px",
                background: "white",
                borderRadius: "999px",
                fontSize: "20px",
                color: "#374151",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
