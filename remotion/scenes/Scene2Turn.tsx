import React from "react";
import { Roll } from "../components/Type";
import { Center, useOutro } from "../components/Stage";
import { TURN } from "../cues";
import { TYPE } from "../theme";

const LINES = ["Every one of them", "is a decision you", "*should not have to make.*"];

export const Scene2Turn: React.FC = () => {
  const outro = useOutro();

  return (
      <Center gap={4}>
        {LINES.map((line, i) => (
          <div key={line} style={outro(i)}>
            <Roll text={line} at={TURN[i]} size={TYPE.title} face="pen" weight={400} />
          </div>
        ))}
      </Center>
  );
};
