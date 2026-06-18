import type { CSSProperties } from "react";

type PulseCloudProps = {
  status: "ok" | "warning" | "critical" | "loading" | string;
};

const colors: Record<string, { main: string; glow: string; core: string }> = {
  ok: { main: "var(--tgui--link_color, #2ea6ff)", glow: "rgba(46,166,255,.20)", core: "rgba(255,255,255,.18)" },
  warning: { main: "#f0a33a", glow: "rgba(240,163,58,.18)", core: "rgba(255,255,255,.16)" },
  critical: { main: "#ff5b5b", glow: "rgba(255,91,91,.18)", core: "rgba(255,255,255,.16)" },
  loading: { main: "var(--tgui--hint_color, #8e8e93)", glow: "rgba(142,142,147,.18)", core: "rgba(255,255,255,.12)" },
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
