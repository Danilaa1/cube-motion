import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { leaveAt, over } from "../cube";

/** leave, plus four staggers, lands exactly on the cut. */
export const TAIL = 34;

/** Every scene hands over on the library's own `leave`: 320ms, 12px, 40ms apart. */
export const useOutro = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = durationInFrames - TAIL;
  return (i = 0): React.CSSProperties => (frame >= out ? leaveAt(frame - out, fps, i) : {});
};

export const Center: React.FC<{ children: React.ReactNode; gap?: number; style?: React.CSSProperties }> = ({
  children,
  gap = 34,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap,
      padding: "0 120px",
      textAlign: "center",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Framed on the left edge, the way a composer sits in a screen recording. */
export const Left: React.FC<{ children: React.ReactNode; gap?: number; style?: React.CSSProperties }> = ({
  children,
  gap = 34,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "center",
      gap,
      paddingLeft: 150,
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * A shot that arrives. Scales in once on the library's own curve and is then
 * locked for the rest of the scene: a settle, never a continuous push.
 */
export const Settle: React.FC<{
  at: number;
  from?: number;
  ms?: number;
  origin?: string;
  children: React.ReactNode;
}> = ({ at, from = 0.965, ms = 700, origin = "50% 50%", children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = over(frame - at, fps, ms);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `scale(${from + (1 - from) * t})`,
        transformOrigin: origin,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};
