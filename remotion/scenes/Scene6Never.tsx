import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { riseAt } from "../cube";
import { MorphWord, Rising } from "../components/Type";
import { Center, useOutro } from "../components/Stage";
import { NEVER } from "../cues";
import { C, FONT, TYPE, track } from "../theme";

const SIZE = TYPE.title;
const WORDS = ["There", "is", "no"];

export const Scene6Never: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outro = useOutro();

  const word = (i: number) => riseAt(frame - NEVER.line, fps, i);

  return (
      <Center gap={36}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            columnGap: SIZE * 0.27,
            fontFamily: FONT.pen,
            fontSize: SIZE,
            fontWeight: 400,
            letterSpacing: track(SIZE),
            lineHeight: `${SIZE * 1.22}px`,
            color: C.ink1,
            ...outro(0),
          }}
        >
          {WORDS.map((w, i) => (
            <span key={w} style={word(i)}>
              {w}
            </span>
          ))}
          <span style={word(WORDS.length)}>
            <MorphWord faces={["easing", "duration", "distance"]} starts={[...NEVER.morphs]} size={SIZE} face="pen" weight={400} />
          </span>
          <span style={word(WORDS.length + 1)}>option.</span>
        </div>

        <div style={outro(1)}>
          <Rising text="*And there never will be one.*" at={NEVER.tail} size={TYPE.sub} weight={400} face="pen" stagger={45} />
        </div>
      </Center>
  );
};
