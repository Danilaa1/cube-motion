import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import { STAGGER, TEXT } from "../../src/tokens";
import { ms } from "../cube";
import { Rising, Typed } from "../components/Type";
import { Center, useOutro } from "../components/Stage";
import { BEAT, FOUR } from "../cues";
import { C, TYPE } from "../theme";

/** The ripple spacing is the job's own stagger, so the drawing tells the truth. */
export const FUNCS = [
  { name: "rise", stagger: STAGGER.rise, line: "Fades each element in with a lift, *one after another*." },
  { name: "leave", stagger: STAGGER.leave, line: "The mirror of the entrance, at *half the duration*." },
  { name: "morph", stagger: TEXT.stagger, line: "One state into the next, *diffed per character*." },
  { name: "reveal", stagger: STAGGER.reveal, line: "Rises each element the first time it *scrolls into view*." },
];

const Beat: React.FC<{ name: string; line: string; stagger: number }> = ({ name, line, stagger }) => {
  const outro = useOutro();
  const { fps } = useVideoConfig();

  return (
    <>
      <Center gap={26}>
        <div style={outro(0)}>
          <Typed
            text={name}
            at={FOUR.name}
            size={TYPE.hero}
            face="pen"
            weight={400}
            cps={13}
            color={C.accent}
            accent={C.ink1}
            reserve
          />
        </div>
        <div style={outro(1)}>
          <Rising text={line} at={FOUR.line} size={TYPE.body} weight={400} face="pen" color={C.ink2} stagger={42} />
        </div>
      </Center>
    </>
  );
};

export const Scene4Four: React.FC = () => (
  <>
    {FUNCS.map((f, i) => (
      <Sequence key={f.name} from={i * BEAT} durationInFrames={BEAT}>
        <Beat {...f} />
      </Sequence>
    ))}
  </>
);
