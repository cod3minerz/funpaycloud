import type { CSSProperties } from "react";

type PulseCloudProps = {
  status: "ok" | "warning" | "critical" | "loading" | string;
};

const colors: Record<string, { main: string; glow: string; core: string }> = {
  ok: { main: "#35d07f", glow: "rgba(53,208,127,.42)", core: "#9ff7c4" },
  warning: { main: "#f4bf4f", glow: "rgba(244,191,79,.42)", core: "#ffe2a0" },
  critical: { main: "#ff5b6e", glow: "rgba(255,91,110,.42)", core: "#ffb0ba" },
  loading: { main: "#7d8cff", glow: "rgba(125,140,255,.42)", core: "#c4cbff" },
};

export default function PulseCloud({ status }: PulseCloudProps) {
  const tone = colors[status] ?? colors.loading;
  return (
    <div className="miniapp-pulse-cloud" style={{ "--cloud-main": tone.main, "--cloud-glow": tone.glow, "--cloud-core": tone.core } as CSSProperties}>
      <svg viewBox="0 0 260 170" role="img" aria-label="Статус платформы">
        <defs>
          <radialGradient id="miniappCloudCore" cx="50%" cy="42%" r="68%">
            <stop offset="0%" stopColor={tone.core} />
            <stop offset="56%" stopColor={tone.main} />
            <stop offset="100%" stopColor={tone.main} stopOpacity=".62" />
          </radialGradient>
          <filter id="miniappCloudBlur" x="-40%" y="-50%" width="180%" height="200%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <ellipse className="miniapp-cloud-halo" cx="130" cy="92" rx="90" ry="52" fill={tone.glow} filter="url(#miniappCloudBlur)" />
        <path
          className="miniapp-cloud-shape"
          d="M78 122c-24 0-43-17-43-38 0-20 17-36 38-37 10-23 33-38 61-38 34 0 62 23 67 53 17 5 29 19 29 36 0 21-19 24-43 24H78Z"
          fill="url(#miniappCloudCore)"
        />
        <path
          className="miniapp-cloud-shine"
          d="M72 76c11-26 36-42 65-41 25 1 47 14 58 34"
          fill="none"
          stroke="rgba(255,255,255,.48)"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
