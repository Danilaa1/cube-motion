import React from "react";
import { roughLine } from "drawably";
import { ink, Paper, useBoil } from "./Ink";
import { C } from "../theme";

/** Paper, and the crop marks the press leaves on it. */
export const Canvas: React.FC = () => {
  const boil = useBoil();

  return (
    <>
      <Paper />
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path d={ink((o) => roughLine(952, 40, 968, 40, o), 5, boil)} stroke={C.ink4} strokeWidth={3} fill="none" />
        <path d={ink((o) => roughLine(952, 1040, 968, 1040, o), 9, boil)} stroke={C.ink4} strokeWidth={3} fill="none" />
        <path d={ink((o) => roughLine(64, 532, 64, 548, o), 13, boil)} stroke={C.ink4} strokeWidth={3} fill="none" />
        <path d={ink((o) => roughLine(1856, 532, 1856, 548, o), 21, boil)} stroke={C.ink4} strokeWidth={3} fill="none" />
      </svg>
    </>
  );
};
