import React from "react";
import { Composition } from "remotion";
import { CubePromo, TOTAL } from "./CubePromo";

export const Root: React.FC = () => (
  <Composition
    id="CubeMotionPromo"
    component={CubePromo}
    durationInFrames={TOTAL}
    fps={60}
    width={1920}
    height={1080}
  />
);
