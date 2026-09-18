import React from "react";
import { Rising, Wipe } from "../components/Type";
import { Center, useOutro } from "../components/Stage";
import { REACH } from "../cues";
import { TYPE } from "../theme";

export const Scene7Reach: React.FC = () => {
  const outro = useOutro();

  return (
      <Center gap={32}>
        <div style={outro(0)}>
          <Wipe text="React. Vue. Solid. Svelte." at={REACH.words} size={TYPE.title} face="pen" weight={400} duration={900} />
        </div>
        <div style={outro(1)}>
          <Rising text="*Zero dependencies.*" at={REACH.zero} size={TYPE.sub} weight={400} face="pen" stagger={45} />
        </div>
      </Center>
  );
};
