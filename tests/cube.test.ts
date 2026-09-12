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

  it("continues from the computed state when it interrupts a motion, and from hidden when it does not", () => {
    const target = el();
    target.style.opacity = "0.3";
    target.style.translate = "0 4px";
    rise(target);
    expect(animationsOf(target)[0].keyframes).toEqual([{ opacity: 0, translate: "0 12px" }, { opacity: 1, translate: "0 0" }]);
    leave(target);
    expect((animationsOf(target)[1].keyframes as Keyframe[])[0]).toEqual({ opacity: "0.3", translate: "0 4px" });
    rise(target);
    expect((animationsOf(target)[2].keyframes as Keyframe[])[0]).toEqual({ opacity: "0.3", translate: "0 4px" });
  });

  it("fades only under reduced motion", () => {
    setReduceMotion(true);
    const target = el();
    leave(target);
    expect(animationsOf(target)[0].keyframes).toEqual([{ opacity: 1, translate: "0 0" }, { opacity: 0 }]);
  });
});

describe("morph", () => {
  const faces = () => {
    const wrapper = el();
    const off = wrapper.appendChild(document.createElement("span"));
    const on = wrapper.appendChild(document.createElement("span"));
    return { wrapper, off, on };
  };

  it("crossfades element faces: outgoing blurs and shrinks slightly, incoming leads 130ms later, and previous runs are cancelled", () => {
    const { off, on } = faces();
    off.appendChild(document.createElement("svg"));
    on.appendChild(document.createElement("svg"));
    morph(off, on);
    morph(on, off);
    const [firstIn] = animationsOf(on);
    expect(firstIn.options.delay).toBe(130);
    expect(firstIn.cancelled).toBe(true);
    const [firstOut] = animationsOf(off);
    expect((firstOut.keyframes as Keyframe[])[1]).toEqual({ opacity: 0, scale: 0.8, filter: "blur(4px)" });
    expect(firstOut.options).toMatchObject({ duration: 220, fill: "both" });
  });

  it("puts the outgoing face out of flow and the incoming face in it", () => {
    const { wrapper, off, on } = faces();
    morph(off, on);
    expect(wrapper.style.position).toBe("relative");
    expect([off.style.position, on.style.position]).toEqual(["absolute", "relative"]);
    morph(on, off);
    expect([off.style.position, on.style.position]).toEqual(["relative", "absolute"]);
  });

  it("overrides a class that hid the face at first paint", () => {
    const { off, on } = faces();
    off.textContent = "Save";
    on.textContent = "Saved";
    const sheet = document.head.appendChild(document.createElement("style"));
    sheet.textContent = ".hidden { position: absolute; opacity: 0 }";
    on.className = "hidden";
    morph(off, on);
    expect([on.style.position, on.style.opacity]).toEqual(["relative", "1"]);
    sheet.remove();
  });

  it("diffs text faces per character: the shared prefix stays, the rest blur out and in, staggered", () => {
    const { off, on } = faces();
    off.textContent = "Copy";
    on.textContent = "Copied";
    morph(off, on);
    const outChars = [...off.children] as HTMLElement[];
    const inChars = [...on.children] as HTMLElement[];
    expect(outChars.map((c) => c.textContent).join("")).toBe("Copy");
    expect(inChars.map((c) => c.textContent).join("")).toBe("Copied");
    expect(on.getAttribute("aria-label")).toBe("Copied");
    expect(outChars.slice(0, 3).map((c) => c.style.opacity)).toEqual(["0", "0", "0"]);
    expect(animationsOf(outChars[2])).toHaveLength(0);
    expect(animationsOf(outChars[3])[0]).toMatchObject({ options: { duration: 180, delay: 0 } });
    expect((animationsOf(outChars[3])[0].keyframes as Keyframe[])[1]).toEqual({ opacity: 0, filter: "blur(4px)" });
    expect(animationsOf(inChars[3])[0].options.delay).toBe(60);
    expect(animationsOf(inChars[5])[0].options.delay).toBe(60 + 2 * 35);
    expect(animationsOf(inChars[0])[0].options.delay).toBe(0);
  });

  it("reuses the character spans on the way back", () => {
    const { off, on } = faces();
    off.textContent = "Copy";
    on.textContent = "Copied";
    morph(off, on);
    const spans = [...on.children];
    morph(on, off);
    expect([...on.children]).toEqual(spans);
    expect(animationsOf(spans[5] as Element).at(-1)!.options.delay).toBe(2 * 35);
  });

  it("eases the wrapper's width to the incoming face", () => {
    const { wrapper, off, on } = faces();
    let width = 80;
    Object.defineProperty(wrapper, "offsetWidth", { get: () => width });
    off.textContent = "Copy";
    on.textContent = "Copied";
    const original = on.style;
    Object.defineProperty(on, "style", { get: () => { width = 100; return original; } });
    morph(off, on);
    const fit = animationsOf(wrapper)[0];
    expect(fit.keyframes).toEqual([{ width: "80px" }, { width: "100px" }]);
    expect(fit.options).toMatchObject({ duration: 400 });
  });

  it("fades only, with no lead and no blur, under reduced motion", () => {
    setReduceMotion(true);
    const { off, on } = faces();
    off.appendChild(document.createElement("svg"));
    on.appendChild(document.createElement("svg"));
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
