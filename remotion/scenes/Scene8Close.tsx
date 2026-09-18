import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { riseAt } from "../cube";
import { Rising, Roll, Typed } from "../components/Type";
import { Center } from "../components/Stage";
import { PenCube } from "../components/Ink";
import { CLOSE } from "../cues";
import { C, TYPE } from "../theme";

export const Scene8Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      <Center gap={10}>
        <div style={{ ...riseAt(frame - CLOSE.name, fps), marginBottom: 6 }}>
          <PenCube size={82} />
        </div>

        <Roll text="cube-motion" at={CLOSE.name} size={TYPE.display} by="char" stagger={26} face="pen" weight={400} />

        <div style={{ marginTop: 8 }}>
          <Rising
            text="Four motions, no dials."
            at={CLOSE.tag}
            size={TYPE.body}
            weight={400}
            face="pen"
            color={C.ink2}
            stagger={45}
          />
        </div>

        <div style={{ marginTop: 32 }}>
          <Typed
            text="Coming soon."
            at={CLOSE.install}
            size={TYPE.sub}
            weight={400}
            face="pen"
            cps={11}
            color={C.accent}
            accent={C.ink1}
            reserve
          />
        </div>

      </Center>
    </>
  );
};
