// Writes skills/cube-motion/SKILL.md from .github/agent.md so `npx skills add` and the npm
// export share one source.
import { readFileSync, writeFileSync } from "node:fs";

const body = readFileSync(".github/agent.md", "utf8");
const front = `---
name: cube-motion
description: Use when adding UI motion with cube-motion. Four fixed motions (rise, leave, morph, reveal) on the Web Animations API with React and Solid components. Nothing to tune; pick the job.
---

`;
writeFileSync("skills/cube-motion/SKILL.md", front + body);
