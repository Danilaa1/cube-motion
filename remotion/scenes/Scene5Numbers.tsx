import React from "react";
import { Roll } from "../components/Type";
import { Left, useOutro } from "../components/Stage";
import { NUMBERS } from "../cues";
import { TYPE } from "../theme";

const LINES = ["*640ms* to arrive.", "*320ms* to leave.", "*70ms* between each.", "*One curve*, everywhere."];

export const Scene5Numbers: React.FC = () => {
  const outro = useOutro();

  return (
      <Left gap={2}>
        {LINES.map((line, i) => (
          <div key={line} style={outro(i)}>
            <Roll
            text={line}
            at={NUMBERS[i]}
            size={TYPE.lead}
            face="pen"
            weight={400}
            style={{ fontVariantNumeric: "tabular-nums" }}
          />
          </div>
        ))}
      </Left>
  );
};
