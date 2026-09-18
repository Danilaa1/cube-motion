import React from "react";
import { interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { STAGGER } from "../../src/tokens";
import { charsWidth, EASE, fitWidth, morphText, over, riseAt } from "../cube";
import { C, FONT, track } from "../theme";

export type Piece = { text: string; accent: boolean };

/** `*` opens and closes an accent run: "is a *decision you* should not make". */
export const pieces = (line: string): Piece[] => {
  let on = false;
  return line
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => {
      // A run can close before trailing punctuation, as in "another*." .
      const opens = raw.startsWith("*");
      const closes = (opens ? raw.slice(1) : raw).includes("*");
      const accent = on || opens;
      if (opens && !closes) on = true;
      if (closes) on = false;
      return { text: raw.replace(/\*/g, ""), accent };
    });
};

export type Face = "sans" | "mono" | "pen";
export const faceOf = (face: Face) => (face === "mono" ? FONT.mono : face === "pen" ? FONT.pen : FONT.sans);

type TypeProps = {
  text: string;
  at: number;
  size: number;
  weight?: number;
  color?: string;
  accent?: string;
  face?: Face;
  style?: React.CSSProperties;
};

/**
 * Words arriving from below, one after another. This is the library's own `rise`:
 * 640ms, a 12px lift, 70ms apart.
 */
export const Rising: React.FC<TypeProps & { index?: number; stagger?: number }> = ({
  text,
  at,
  size,
  weight = 600,
  color = C.ink1,
  accent = C.accent,
  index = 0,
  stagger = STAGGER.rise,
  face = "sans",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: size * 0.27,
        rowGap: size * 0.22,
        fontFamily: faceOf(face),
        fontSize: size,
        fontWeight: weight,
        letterSpacing: track(size),
        lineHeight: 1.1,
        ...style,
      }}
    >
      {pieces(text).map((w, i) => (
        <span
          key={`${w.text}-${i}`}
          style={{ color: w.accent ? accent : color, ...riseAt(frame - at, fps, index + i, stagger) }}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
};

/**
 * A text roll: every word climbs out from under its own line, clipped, so the
 * type looks set rather than faded in.
 */
export const Roll: React.FC<
  TypeProps & { by?: "word" | "char"; stagger?: number; duration?: number }
> = ({
  text,
  at,
  size,
  weight = 600,
  color = C.ink1,
  accent = C.accent,
  by = "word",
  stagger = 42,
  duration = 540,
  face = "sans",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const box = size * 1.22;

  const units: Piece[] = by === "word" ? pieces(text) : pieces(text).flatMap((w) => [...w.text].map((ch) => ({ text: ch, accent: w.accent })));

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        columnGap: by === "word" ? size * 0.27 : 0,
        fontFamily: faceOf(face),
        fontSize: size,
        fontWeight: weight,
        letterSpacing: track(size),
        ...style,
      }}
    >
      {units.map((u, i) => {
        const t = over(frame - at, fps, duration, i * stagger);
        return (
          <span key={`${u.text}-${i}`} style={{ display: "inline-block", height: box, overflow: "hidden" }}>
            <span
              style={{
                display: "block",
                lineHeight: `${box}px`,
                color: u.accent ? accent : color,
                transform: `translateY(${(1 - t) * 104}%)`,
                whiteSpace: "pre",
              }}
            >
              {u.text}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** The camera passing over a line: clipped open from the left, settling as it goes. */
export const Wipe: React.FC<TypeProps & { duration?: number }> = ({
  text,
  at,
  size,
  weight = 600,
  color = C.ink1,
  accent = C.accent,
  duration = 820,
  face = "sans",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = over(frame - at, fps, duration);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        columnGap: size * 0.27,
        fontFamily: faceOf(face),
        fontSize: size,
        fontWeight: weight,
        letterSpacing: track(size),
        lineHeight: 1.1,
        clipPath: `inset(-0.28em ${(1 - t) * 100}% -0.28em 0)`,
        transform: `translateX(${(1 - t) * 26}px)`,
        ...style,
      }}
    >
      {pieces(text).map((w, i) => (
        <span key={`${w.text}-${i}`} style={{ color: w.accent ? accent : color }}>
          {w.text}
        </span>
      ))}
    </div>
  );
};

/** Laid-out width of a phrase, for anything that has to be drawn around it. */
export const measure = (text: string, size: number, face: Face = "sans", weight = 600) =>
  charsWidth(text, `${weight} ${size}px ${faceOf(face)}`, `${parseFloat(track(size)) * size}px`);

/**
 * Typing, with the trail. Characters land on a continuous clock rather than a
 * per-frame integer, so the caret glides instead of hopping and the line that
 * follows it pans at a true constant speed. Each character fades up out of a
 * short blur, the way ink takes on paper, and cools from the accent to the
 * resting colour over half a second.
 */
export const Typed: React.FC<
  TypeProps & {
    cps?: number;
    cool?: number;
    follow?: number;
    caret?: boolean;
    reserve?: boolean;
  }
> = ({
  text,
  at,
  size,
  weight = 600,
  color = C.ink1,
  accent = C.accent,
  cps = 26,
  cool = 0.52,
  face = "sans",
  follow = 0,
  caret = true,
  reserve = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = [...text];

  const elapsed = (frame - at) / fps;
  const exact = Math.max(0, Math.min(chars.length, elapsed * cps));
  const shown = Math.min(chars.length, Math.floor(exact));
  const part = exact - shown; // how far into the character now landing
  const done = exact >= chars.length;

  const family = faceOf(face);
  const font = `${weight} ${size}px ${family}`;
  const tracking = `${parseFloat(track(size)) * size}px`;
  const upTo = (n: number) => charsWidth(text.slice(0, n), font, tracking);

  // The caret sits between two characters, not on one, so it never jumps a whole
  // glyph. It hugs the last letter and catches up as the next one lands, while
  // the pan reads the linear position so its speed stays constant.
  const nextW = upTo(Math.min(chars.length, shown + 1)) - upTo(shown);
  const caretX = upTo(shown) + part * nextW;
  const caretDraw = upTo(shown) + part * part * nextW;

  // The pan eases into motion instead of starting at full speed the frame the
  // caret crosses the mark. softplus is smooth everywhere and asymptotes to x.
  const SOFT = 110;
  const past = caretX - follow;
  const slide =
    follow <= 0 || past <= 0
      ? 0
      : -(past / SOFT > 30 ? past - SOFT * Math.LN2 : SOFT * Math.log1p(Math.exp(past / SOFT)) - SOFT * Math.LN2);

  const ENTER = 0.15;
  const caretWidth = Math.max(2, size * 0.05);
  const width = reserve ? upTo(chars.length) + caretWidth * 2.4 : undefined;

  // Solid while typing, then a soft blink rather than a hard one.
  const sinceDone = elapsed - chars.length / cps;
  const blink = done ? 0.55 + 0.45 * Math.cos((sinceDone / 0.56) * Math.PI * 2) : 1;

  return (
    <div
      style={{
        position: "relative",
        whiteSpace: "pre",
        textAlign: "left",
        fontFamily: family,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: track(size),
        lineHeight: 1.18,
        width,
        transform: `translateX(${slide}px)`,
        willChange: "transform",
        ...style,
      }}
    >
      {chars.slice(0, shown).map((ch, i) => {
        const age = elapsed - i / cps;
        const e = Math.max(0, Math.min(1, age / ENTER));
        const lit = EASE(e);
        const t = Math.max(0, Math.min(1, age / cool));
        return (
          <span
            key={`${ch}-${i}`}
            style={{
              color: interpolateColors(t, [0, 1], [accent, color]),
              opacity: lit,
              filter: lit < 1 ? `blur(${(1 - lit) * size * 0.022}px)` : "none",
            }}
          >
            {ch}
          </span>
        );
      })}
      {caret && elapsed >= 0 ? (
        <span
          style={{
            position: "absolute",
            left: caretDraw + caretWidth * 0.7,
            top: size * 0.2,
            width: caretWidth,
            height: size * 0.82,
            background: color,
            opacity: blink,
          }}
        />
      ) : null}
    </div>
  );
};

const Face: React.FC<{ chars: { ch: string; opacity: number; blur: number }[] }> = ({ chars }) => (
  <span style={{ position: "absolute", left: 0, top: 0, display: "flex", whiteSpace: "pre" }}>
    {chars.map((c, i) => (
      <span
        key={`${c.ch}-${i}`}
        style={{
          display: "inline-block",
          opacity: c.opacity,
          filter: c.blur > 0.05 ? `blur(${c.blur}px)` : "none",
        }}
      >
        {c.ch}
      </span>
    ))}
  </span>
);

/**
 * One word rewritten into the next, at the library's morph numbers: shared
 * leading letters hold, the rest blur out and in, and the width follows at 400ms.
 */
export const MorphWord: React.FC<{
  faces: string[];
  starts: number[];
  size: number;
  weight?: number;
  color?: string;
  face?: Face;
}> = ({ faces, starts, size, weight = 600, color = C.accent, face = "sans" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const font = `${weight} ${size}px ${faceOf(face)}`;
  const tracking = `${parseFloat(track(size)) * size}px`;
  const done = starts.filter((s) => frame >= s).length;
  const from = faces[Math.max(0, done - 1)];
  const to = faces[done] ?? faces[faces.length - 1];
  const local = done === 0 ? -1 : frame - starts[done - 1];

  const { outgoing, incoming } = morphText(local, fps, done === 0 ? to : from, to);
  const width = fitWidth(local, fps, charsWidth(from, font, tracking), charsWidth(to, font, tracking));

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        width,
        height: size * 1.22,
        lineHeight: `${size * 1.22}px`,
        color,
        verticalAlign: "top",
      }}
    >
      <Face chars={outgoing} />
      <Face chars={incoming} />
    </span>
  );
};

/** A block that rises as one, then leaves as one, both on the library's curve. */
export const easeOut = EASE;
