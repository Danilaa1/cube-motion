import { beforeEach, describe, expect, it } from "vitest";
import { leave, morph, reveal, rise } from "../src/index.js";
import { animationsOf, install, intersect, observed, observerOptions, setReduceMotion } from "./setup.js";

const el = () => document.body.appendChild(document.createElement("div"));

beforeEach(() => {
  document.body.innerHTML = "";
  setReduceMotion(false);
  install();
});

describe("rise", () => {
  it("lifts 12px over 640ms with a 70ms stagger and a backwards fill", () => {
    const els = [el(), el(), el()];
    const run = rise(els);
    expect(run).toHaveLength(3);
    const first = animationsOf(els[0])[0];
    expect(first.keyframes).toEqual([{ opacity: 0, translate: "0 12px" }, { opacity: 1, translate: "0 0" }]);
    expect(first.options).toMatchObject({ duration: 640, delay: 0, fill: "backwards" });
    expect(animationsOf(els[2])[0].options.delay).toBe(140);
  });

  it("accepts a selector, a single element, and a delay", () => {
    el().className = "a";
    el().className = "a";
    expect(rise(".a")).toHaveLength(2);
    expect(rise(el(), { delay: 100 })[0]).toBeDefined();
    expect(animationsOf(document.body.lastElementChild!)[0].options.delay).toBe(100);
  });

  it("keeps the fade and drops the lift under reduced motion", () => {
    setReduceMotion(true);
    const [a] = animationsOf(el());
    expect(a).toBeUndefined();
    const target = el();
    rise(target);
    expect(animationsOf(target)[0].keyframes).toEqual([{ opacity: 0 }, { opacity: 1, translate: "0 0" }]);
  });
});

describe("leave", () => {
  it("drops 12px over 320ms with a 40ms stagger and holds the end state", () => {
    const els = [el(), el()];
    leave(els);
    const first = animationsOf(els[0])[0];
    expect(first.keyframes).toEqual([{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: "0 12px" }]);
    expect(first.options).toMatchObject({ duration: 320, fill: "forwards" });
    expect(animationsOf(els[1])[0].options.delay).toBe(40);
  });

  it("cancels a running rise, and rise cancels a running leave", () => {
    const target = el();
    rise(target);
    leave(target);
    rise(target);
    const [entered, left, again] = animationsOf(target);
    expect(entered.cancelled).toBe(true);
    expect(left.cancelled).toBe(true);
    expect(again.cancelled).toBe(false);
  });

  it("fades only under reduced motion", () => {
    setReduceMotion(true);
    const target = el();
    leave(target);
    expect(animationsOf(target)[0].keyframes).toEqual([{ opacity: 1, translate: "0 0" }, { opacity: 0 }]);
  });
});

describe("morph", () => {
  it("shrinks and blurs the outgoing face, leads the incoming by 130ms, and cancels what ran before", () => {
    const off = el();
    const on = el();
    morph(off, on);
    morph(on, off);
    const [firstIn] = animationsOf(on);
    expect(firstIn.options.delay).toBe(130);
    expect(firstIn.cancelled).toBe(true);
    const [firstOut] = animationsOf(off);
    expect((firstOut.keyframes as Keyframe[])[1]).toEqual({ opacity: 0, scale: 0.25, filter: "blur(4px)" });
    expect(firstOut.options).toMatchObject({ duration: 220, fill: "both" });
  });

  it("starts each face from its computed state so an interrupted morph retargets", () => {
    const off = el();
    const on = el();
    off.style.opacity = "0.4";
    off.style.scale = "0.6";
    off.style.filter = "blur(2px)";
    morph(off, on);
    expect((animationsOf(off)[0].keyframes as Keyframe[])[0]).toEqual({ opacity: "0.4", scale: "0.6", filter: "blur(2px)" });
    expect((animationsOf(on)[0].keyframes as Keyframe[])[1]).toEqual({ opacity: 1, scale: 1, filter: "blur(0)" });
  });

  it("fades only, with no lead, under reduced motion", () => {
    setReduceMotion(true);
    const off = el();
    const on = el();
    morph(off, on);
    expect((animationsOf(off)[0].keyframes as Keyframe[])[1]).toEqual({ opacity: 0, scale: 1, filter: "blur(0)" });
    expect(animationsOf(on)[0].options.delay).toBe(0);
  });
});

describe("reveal", () => {
  it("hides now, observes with a -10% bottom margin, and rises on intersection with a 60ms stagger", () => {
    const rows = [el(), el()];
    const disconnect = reveal(rows);
    expect(rows.map((r) => r.style.opacity)).toEqual(["0", "0"]);
    expect(observed).toEqual(rows);
    expect(observerOptions).toEqual({ root: null, rootMargin: "0px 0px -10% 0px" });
    intersect(rows.map((target) => ({ target, isIntersecting: true })));
    expect(rows[1].style.opacity).toBe("");
    expect(animationsOf(rows[1])[0].options.delay).toBe(60);
    disconnect();
    expect(observed).toEqual([]);
  });

  it("leaves elements that are not intersecting hidden", () => {
    const row = el();
    reveal(row);
    intersect([{ target: row, isIntersecting: false }]);
    expect(row.style.opacity).toBe("0");
    expect(animationsOf(row)).toHaveLength(0);
  });
});
