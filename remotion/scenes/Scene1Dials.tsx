import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { leaveAt, riseAt } from "../cube";
import { Typed } from "../components/Type";
import { Left, Settle } from "../components/Stage";
import { DIALS } from "../cues";
import { C, FONT, TYPE, track } from "../theme";

const KNOBS = ["duration", "easing", "delay", "distance", "scale", "opacity", "stiffness", "damping", "mass"];

export const Scene1Dials: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const knob = (i: number) =>
    frame >= DIALS.out ? leaveAt(frame - DIALS.out, fps, i) : riseAt(frame - DIALS.in, fps, i);

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          alignContent: "center",
          justifyContent: "center",
          columnGap: 52,
          rowGap: 24,
          padding: "0 220px",
        }}
      >
        {KNOBS.map((k, i) => (
          <span
            key={k}
            style={{
              fontFamily: FONT.pen,
              fontSize: TYPE.sub,
              fontWeight: 400,
              letterSpacing: track(TYPE.sub),
              color: C.ink3,
              ...knob(i),
            }}
          >
            {k}
          </span>
        ))}
      </div>

      {/* The shot snaps in once, then holds. The line is wider than the frame, so
          it slides left at a constant speed and the caret stays where it is. */}
      <Settle at={DIALS.line - 10} from={0.94} ms={720} origin="150px 50%">
        <Left>
          <Typed
            text="Nine decisions before anything moves."
            at={DIALS.line}
            size={150}
            weight={400}
            face="pen"
            cps={25}
            follow={1430}
          />
        </Left>
      </Settle>
    </>
  );
};
