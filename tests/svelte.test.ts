import { beforeEach, describe, expect, it } from "vitest";
import { leave, morph, reveal, rise } from "../src/svelte.js";
import { animationsOf, install, observed, setReduceMotion } from "./setup.js";

const el = () => document.body.appendChild(document.createElement("div"));

beforeEach(() => {
  document.body.innerHTML = "";
  setReduceMotion(false);
  install();
});

describe("svelte transitions", () => {
  it("rise is 640ms with a 12px lift, staggered by index, on the one curve", () => {
    const t = rise(el(), { index: 2 });
    expect(t).toMatchObject({ delay: 140, duration: 640 });
    expect(t.css!(0, 1)).toBe("opacity:0;translate:0 12px");
    expect(t.css!(1, 0)).toBe("opacity:1;translate:0 0px");
    expect(t.easing!(0)).toBe(0);
    expect(t.easing!(1)).toBeCloseTo(1);
    expect(t.easing!(0.3)).toBeGreaterThan(0.6);
  });

  it("leave is 320ms, staggered by 40, and drops as it goes", () => {
    const t = leave(el(), { index: 1, delay: 10 });
    expect(t).toMatchObject({ delay: 50, duration: 320 });
    expect(t.css!(0, 1)).toBe("opacity:0;translate:0 12px");
  });

  it("fades only under reduced motion", () => {
    setReduceMotion(true);
    expect(rise(el()).css!(0.5, 0.5)).toBe("opacity:0.5");
  });
});

describe("svelte actions", () => {
  it("morph stacks the two children, hides the inactive one, and morphs on update", () => {
    const node = el();
    const off = node.appendChild(document.createElement("i"));
    const on = node.appendChild(document.createElement("i"));
    const action = morph(node, false)!;
    expect(node.style.display).toBe("inline-grid");
    expect([off.style.opacity, on.style.opacity]).toEqual(["1", "0"]);
    action.update!(false);
    expect(animationsOf(off)).toHaveLength(0);
    action.update!(true);
    expect(animationsOf(off)[0].options.duration).toBe(220);
    expect(animationsOf(on)[0].options.delay).toBe(130);
  });

  it("reveal observes the children and disconnects on destroy", () => {
    const node = el();
    node.appendChild(document.createElement("article"));
    const action = reveal(node, undefined)!;
    expect(observed).toHaveLength(1);
    action.destroy!();
    expect(observed).toHaveLength(0);
  });
});
