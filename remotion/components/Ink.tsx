import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { roughCircle, roughEllipse, roughLine, type RoughOptions } from "drawably";
import { over } from "../cube";
import { C } from "../theme";

// drawably's own boil: three sketches of the same shape cycled at 400ms, so a
// stroke looks alive without anything actually moving.
const BOIL_MS = 400;
const ROUGH = { roughness: 1.7, boil: 1.1 } as const;

export const useBoil = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.floor(frame / Math.max(1, Math.round((BOIL_MS / 1000) * fps))) % 3;
};

/** Same seeding as drawably's `variants`, one sketch at a time. */
export const ink = (gen: (o: RoughOptions) => string, seed: number, boil: number) =>
  gen({ ...ROUGH, seed, boilSeed: seed + (boil + 1) * 7919 });

/** Warm stock with its grain and a little blotchy tone, the way it scans. */
export const Paper: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: C.bg }}>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="paper-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="11" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
        </filter>
        <filter id="paper-tone" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="3" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#paper-tone)" opacity={0.16} style={{ mixBlendMode: "multiply" }} />
      <rect width="100%" height="100%" filter="url(#paper-grain)" opacity={0.22} style={{ mixBlendMode: "multiply" }} />
    </svg>
  </div>
);

/** Anything inked carries a magenta and a cyan plate a hair out of register. */
export const Registered: React.FC<{ children: React.ReactNode; spread?: number }> = ({
  children,
  spread = 2,
}) => (
  <span style={{ position: "relative", display: "inline-block" }}>
    <span
      aria-hidden
      style={{ position: "absolute", inset: 0, color: C.magenta, transform: `translate(${spread}px, ${spread * 0.6}px)`, mixBlendMode: "multiply" }}
    >
      {children}
    </span>
    <span
      aria-hidden
      style={{ position: "absolute", inset: 0, color: C.cyan, transform: `translate(${-spread}px, ${spread * 0.8}px)`, mixBlendMode: "multiply" }}
    >
      {children}
    </span>
    <span style={{ position: "relative" }}>{children}</span>
  </span>
);

/** The anchor the ripples come out of. Hand-drawn, and a shade off register. */
export const Dot: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 22, style }) => {
  const boil = useBoil();
  const d = ink((o) => roughCircle(size, size, size * 0.42, o), 91, boil);
  return (
    <svg width={size * 2} height={size * 2} style={{ overflow: "visible", ...style }}>
      <path d={d} fill={C.magenta} stroke={C.magenta} strokeWidth={size * 0.5} transform="translate(1.6,1)" style={{ mixBlendMode: "multiply" }} />
      <path d={d} fill={C.cyan} stroke={C.cyan} strokeWidth={size * 0.5} transform="translate(-1.6,1.4)" style={{ mixBlendMode: "multiply" }} />
      <path d={d} fill={C.accent} stroke={C.accent} strokeWidth={size * 0.5} />
    </svg>
  );
};

/** A pen ring thrown around a phrase, drawn on rather than faded in. */
export const Ring: React.FC<{
  width: number;
  height: number;
  at: number;
  draw?: number;
  seed?: number;
  colour?: string;
  stroke?: number;
}> = ({ width, height, at, draw = 520, seed = 17, colour = C.accent, stroke = 4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const boil = useBoil();
  const t = over(frame - at, fps, draw);
  if (t <= 0) return null;

  const pad = height * 0.42;
  const w = width + pad * 2;
  const h = height + pad * 1.2;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", left: -pad, top: -pad * 0.6, overflow: "visible", pointerEvents: "none" }}
    >
      <path
        d={ink((o) => roughEllipse(w / 2, h / 2, w / 2 - 2, h / 2 - 2, o), seed, boil)}
        fill="none"
        stroke={colour}
        strokeWidth={stroke}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - t}
      />
    </svg>
  );
};

/** A pen line under a phrase, same drawn-on behaviour. */
export const Rule: React.FC<{
  width: number;
  at: number;
  draw?: number;
  seed?: number;
  colour?: string;
  stroke?: number;
}> = ({ width, at, draw = 420, seed = 53, colour = C.accent, stroke = 5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const boil = useBoil();
  const t = over(frame - at, fps, draw);
  if (t <= 0) return null;

  return (
    <svg width={width} height={20} viewBox={`0 0 ${width} 20`} style={{ overflow: "visible", display: "block" }}>
      <path
        d={ink((o) => roughLine(2, 10, width - 2, 11, o), seed, boil)}
        fill="none"
        stroke={colour}
        strokeWidth={stroke}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - t}
      />
    </svg>
  );
};

/** The mark, redrawn by hand every 400ms. Nucleo's cube geometry, drawably's stroke. */
const CUBE_EDGES: [number, number, number, number][] = [
  [29, 7.9, 16, 2],
  [16, 2, 3, 7.9],
  [3, 7.9, 3, 24.1],
  [3, 24.1, 16, 30],
  [16, 30, 29, 24.1],
  [29, 24.1, 29, 7.9],
  [3, 8.1, 16, 14],
  [16, 14, 29, 8.1],
  [16, 14, 16, 30],
];

export const PenCube: React.FC<{
  size: number;
  colour?: string;
  seed?: number;
  style?: React.CSSProperties;
}> = ({ size, colour = C.accent, seed = 77, style }) => {
  const boil = useBoil();
  const k = size / 32;
  const w = Math.max(2, size * 0.052);

  return (
    <svg width={size} height={size} style={{ overflow: "visible", display: "block", ...style }}>
      {CUBE_EDGES.map(([x1, y1, x2, y2], i) => (
        <path
          key={i}
          d={ink((o) => roughLine(x1 * k, y1 * k, x2 * k, y2 * k, o), seed + i * 37, boil)}
          stroke={colour}
          strokeWidth={w}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </svg>
  );
};
