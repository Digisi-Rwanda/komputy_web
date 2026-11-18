import { ImageResponse } from "next/og";

// Share card for every page (WhatsApp, LinkedIn, Slack, X). Built from text and the mark only: no third-party images.
export const alt = "Komputy · IFRS 9 and IFRS 16 reporting, from upload to sign off";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const Bar = ({ x, y, o }: { x: number; y: number; o: number }) => <div style={{ position: "absolute", left: x, top: y, width: 156, height: 48, borderRadius: 24, background: "#15171c", opacity: o }} />;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#f3f4f6", color: "#15171c" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ position: "relative", width: 252, height: 288, display: "flex", transform: "scale(0.45)", transformOrigin: "left top", marginRight: -138, marginBottom: -158 }}>
            <Bar x={36} y={60} o={1} /><Bar x={96} y={120} o={0.65} /><Bar x={36} y={180} o={0.35} />
          </div>
          <div style={{ fontSize: 64, fontWeight: 600, letterSpacing: -2 }}>Komputy</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 600, lineHeight: 1.1, letterSpacing: -2, maxWidth: 980 }}>IFRS 9 and IFRS 16 reporting, from upload to sign off.</div>
          <div style={{ fontSize: 30, color: "#5d636e" }}>Expected credit loss and lease accounting for banks and finance teams.</div>
        </div>
        <div style={{ fontSize: 28, color: "#6e7480" }}>komputy.com</div>
      </div>
    ),
    size,
  );
}
