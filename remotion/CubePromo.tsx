import React, { useEffect, useState } from "react";
import { continueRender, delayRender, Sequence, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

import { AudioTracks } from "./components/AudioTracks";
import { Canvas } from "./components/Canvas";
import { CUT, span } from "./cues";
import { Scene1Dials } from "./scenes/Scene1Dials";
import { Scene2Turn } from "./scenes/Scene2Turn";
import { Scene3Thesis } from "./scenes/Scene3Thesis";
import { Scene4Four } from "./scenes/Scene4Four";
import { Scene5Numbers } from "./scenes/Scene5Numbers";
import { Scene6Never } from "./scenes/Scene6Never";
import { Scene7Reach } from "./scenes/Scene7Reach";
import { Scene8Close } from "./scenes/Scene8Close";
import { C, FONT } from "./theme";

const inter = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
// drawably's own strokes, as a face. Loaded the way the library's own film does.
const pen = new FontFace("Drawably Pen", `url(${staticFile("DrawablyPen.ttf")})`)
  .load()
  .then((face) => {
    (document.fonts as unknown as { add(f: FontFace): void }).add(face);
  });

export const CubePromo: React.FC = () => {
  // The morphing word is measured with the real font, so nothing renders on a fallback.
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([inter.waitUntilDone(), pen])
      .catch(() => undefined)
      .then(() => continueRender(handle));
  }, [handle]);

  return (
    <div
      style={{
        position: "relative",
        width: 1920,
        height: 1080,
        overflow: "hidden",
        background: C.bg,
        color: C.ink1,
        fontFamily: FONT.pen,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        fontSynthesis: "none",
        fontOpticalSizing: "auto",
      }}
    >
      <Canvas />
      <AudioTracks />

      <Sequence {...span("dials", "turn")}>
        <Scene1Dials />
      </Sequence>
      <Sequence {...span("turn", "thesis")}>
        <Scene2Turn />
      </Sequence>
      <Sequence {...span("thesis", "four")}>
        <Scene3Thesis />
      </Sequence>
      <Sequence {...span("four", "numbers")}>
        <Scene4Four />
      </Sequence>
      <Sequence {...span("numbers", "never")}>
        <Scene5Numbers />
      </Sequence>
      <Sequence {...span("never", "reach")}>
        <Scene6Never />
      </Sequence>
      <Sequence {...span("reach", "close")}>
        <Scene7Reach />
      </Sequence>
      <Sequence {...span("close", "end")}>
        <Scene8Close />
      </Sequence>
    </div>
  );
};

export const TOTAL = CUT.end;
