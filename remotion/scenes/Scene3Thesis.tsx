import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { riseAt } from "../cube";
import { measure, Rising, Roll } from "../components/Type";
import { Center, useOutro } from "../components/Stage";
import { PenCube, Ring } from "../components/Ink";
import { THESIS } from "../cues";
import { C, TYPE } from "../theme";

export const Scene3Thesis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outro = useOutro();

  return (
    <>
      <Center gap={8}>
        <div style={{ ...riseAt(frame - THESIS.name, fps), ...outro(0), marginBottom: 4 }}>
          <PenCube size={72} />
        </div>

        <div style={{ ...outro(0), marginBottom: 24 }}>
          <Roll text="cube-motion" at={THESIS.name} size={TYPE.lead} by="char" stagger={26} face="pen" weight={400} />
        </div>

        <div style={outro(1)}>
          <Roll text="Four motions." at={THESIS.four} size={TYPE.display} face="pen" weight={400} />
        </div>
        <div style={{ ...outro(2), position: "relative" }}>
          <Roll text="*No dials.*" at={THESIS.dials} size={TYPE.display} face="pen" weight={400} />
          <Ring
            width={measure("No dials.", TYPE.display, "pen", 400)}
            height={TYPE.display * 1.1}
            at={THESIS.dials + 36}
            seed={41}
            stroke={5}
          />
        </div>

        <div style={{ ...outro(3), marginTop: 24 }}>
          <Rising
            text="Every duration, curve and distance is *already decided*."
            at={THESIS.note}
            size={TYPE.body}
            weight={400}
            face="pen"
            color={C.ink2}
            stagger={45}
          />
        </div>
      </Center>
    </>
  );
};
