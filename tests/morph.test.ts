import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { morph, prepareMorph } from "../src/morph.js";
import { animationsOf, install, setReduceMotion, settle } from "./setup.js";

const faces = (a = "Copy", b = "Copied") => {
  const wrapper = document.body.appendChild(document.createElement("span"));
  const off = wrapper.appendChild(document.createElement("span"));
  const on = wrapper.appendChild(document.createElement("span"));
  off.textContent = a;
  on.textContent = b;
  return { wrapper, off, on };
};
const overlays = (wrapper: Element) => [...wrapper.querySelectorAll<HTMLElement>("[data-cube-morph-overlay]")];
const chars = (wrapper: Element, text: string) => [...overlays(wrapper).find((node) => node.textContent === text)!.children] as HTMLElement[];
const frames = (el: Element) => animationsOf(el).at(-1)!.keyframes as Keyframe[];
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

beforeEach(() => {
  document.body.innerHTML = "";
  install();
  setReduceMotion(false);
});
afterEach(() => vi.restoreAllMocks());

describe("morph release regressions", () => {
  it("keeps centered SVG faces in place inside a scaled wrapper", () => {
    const wrapper = document.body.appendChild(document.createElement("button"));
    const off = wrapper.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
    const on = wrapper.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
    Object.defineProperties(wrapper, { offsetWidth: { value: 24 }, offsetHeight: { value: 24 } });
    wrapper.getBoundingClientRect = () => ({ left: 100, top: 100, width: 48, height: 48 }) as DOMRect;
    off.getBoundingClientRect = () => ({ left: 112, top: 112, width: 24, height: 24 }) as DOMRect;
    morph(off, on);
    expect([off.style.left, off.style.top]).toEqual(["6px", "6px"]);
  });

  it.each([true, false])("leaves finished handles awaitable after cleanup (text=%s)", async (text) => {
    const { wrapper, off, on } = faces(text ? "Copy" : "", text ? "Copied" : "");
    const animations = morph(off, on);
    settle();
    await flush();
    expect(overlays(wrapper)).toHaveLength(0);
    // Native cancel() resets a completed animation's finished promise. Cleanup
    // must not cancel these handles after resolving them.
    for (const animation of animations) {
      expect((animation as unknown as { cancelled: boolean }).cancelled).toBe(false);
    }
    await Promise.all(animations.map((animation) => animation.finished));
  });

  it("does not apply a face's icon gap between its temporary text characters", () => {
    const { wrapper, off, on } = faces();
    off.style.cssText = on.style.cssText = "display:inline-flex;gap:6px";
    morph(off, on);
    expect(overlays(wrapper).map((node) => node.style.gap)).toEqual(["0", "0"]);
  });

  it("starts new incoming letters hidden, retaining the shared prefix", () => {
    const { wrapper, off, on } = faces();
    morph(off, on);
    const a = chars(wrapper, "Copy");
    const b = chars(wrapper, "Copied");
    expect(a.slice(0, 3).map((c) => c.style.opacity)).toEqual(["0", "0", "0"]);
    expect(frames(b[0])).toEqual([{ opacity: 1, filter: "blur(0)" }, { opacity: 1, filter: "blur(0)" }]);
    expect(frames(b[3])).toEqual([{ opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0)" }]);
    expect(animationsOf(b[3]).at(-1)!.options).toMatchObject({ delay: 60, fill: "both" });
    expect(animationsOf(b[5]).at(-1)!.options.delay).toBe(130);
  });

  it.each([0, 3])("positions overlays at the faces' layout offsets inside a padded, transformed wrapper (margin %s)", async (margin) => {
    const { wrapper, off, on } = faces();
    wrapper.style.padding = "8px 16px";
    wrapper.style.transform = "scale(0.5)";
    for (const face of [off, on]) {
      face.style.margin = `${margin}px`;
      // happy-dom has no layout. Model offset coordinates before and after the
      // outgoing face floats; painted coordinates would be scaled and incorrect.
      Object.defineProperties(face, {
        offsetLeft: { get: () => (face.style.position === "absolute" ? parseFloat(face.style.left) || 0 : 16) + margin },
        offsetTop: { get: () => (face.style.position === "absolute" ? parseFloat(face.style.top) || 0 : 8) + margin },
      });
      vi.spyOn(face, "getBoundingClientRect").mockImplementation(() => { throw new Error("Painted offsets include transforms"); });
    }
    const run = morph(off, on);
    expect([off.style.left, off.style.top]).toEqual(["16px", "8px"]);
    expect(overlays(wrapper).map((node) => [node.style.left, node.style.top])).toEqual([["16px", "8px"], ["16px", "8px"]]);
    expect([on.offsetLeft, on.offsetTop]).toEqual([16 + margin, 8 + margin]);
    run.forEach((animation) => animation.finish());
    await flush();
    expect(overlays(wrapper)).toHaveLength(0);
    expect([on.offsetLeft, on.offsetTop]).toEqual([16 + margin, 8 + margin]);
  });

  it("keeps face span styles off the glyph boxes while inheriting typography", () => {
    const { wrapper, off, on } = faces();
    wrapper.className = "status";
    const sheet = document.body.appendChild(document.createElement("style"));
    sheet.textContent = ".status span { padding:4px; margin:3px; border:1px solid; font-size:18px; font-style:italic; letter-spacing:2px }";
    morph(off, on);
    const overlay = overlays(wrapper)[1];
    expect(getComputedStyle(overlay).paddingLeft).toBe("4px");
    for (const char of chars(wrapper, "Copied")) {
      expect(char.matches(".status span")).toBe(false);
      const cs = getComputedStyle(char);
      expect([cs.paddingLeft, cs.marginLeft, cs.borderLeftWidth]).toEqual(["0px", "0px", "0px"]);
      expect([cs.fontSize, cs.fontStyle, cs.letterSpacing]).toEqual(["18px", "italic", "2px"]);
    }
  });

  it("retains interrupted overlays and samples letters before cancelling their fills", async () => {
    const { wrapper, off, on } = faces();
    morph(off, on);
    const a = chars(wrapper, "Copy");
    const b = chars(wrapper, "Copied");
    const oldPrefix = animationsOf(b[0])[0];
    // The stand-in records WAAPI requests; supply the values a real browser would
    // expose at the interruption rather than pretending it renders those requests.
    b[0].style.opacity = "0.7";
    b[0].style.filter = "blur(1px)";
    b[5].style.opacity = "0.35";
    b[5].style.filter = "blur(2px)";
    morph(on, off);
    await flush();
    expect(chars(wrapper, "Copied")).toEqual(b);
    expect(oldPrefix.cancelled).toBe(true);
    expect(b[0].style.opacity).toBe("0");
    expect(b[0].getAnimations()).toHaveLength(0);
    expect(frames(a[0])[0]).toEqual({ opacity: "0.7", filter: "blur(1px)" });
    expect(frames(b[5])[0]).toEqual({ opacity: "0.35", filter: "blur(2px)" });
  });

  it("diffs graphemes, keeping surrogate pairs, combining marks and ZWJ emoji whole", () => {
    const { wrapper, off, on } = faces("👩‍💻e\u0301x", "👩‍💻e\u0301y");
    morph(off, on);
    const a = chars(wrapper, off.textContent!);
    const b = chars(wrapper, on.textContent!);
    expect(a.map((c) => c.textContent)).toEqual(["👩‍💻", "e\u0301", "x"]);
    expect(b.map((c) => c.textContent)).toEqual(["👩‍💻", "e\u0301", "y"]);
    expect(a.slice(0, 2).map((c) => c.style.opacity)).toEqual(["0", "0"]);
    expect(animationsOf(b[2])[0].options.delay).toBe(60);
  });

  it.each(["img", "svg", "i"])("crossfades empty %s faces instead of treating them as text", (tag) => {
    const wrapper = document.body.appendChild(document.createElement("span"));
    const off = wrapper.appendChild(document.createElement(tag));
    const on = wrapper.appendChild(document.createElement(tag));
    morph(off, on);
    expect(overlays(wrapper)).toHaveLength(0);
    expect(frames(on)[0]).toEqual({ opacity: 0, scale: 0.8, filter: "blur(4px)" });
    expect(frames(off)[1]).toEqual({ opacity: 0, scale: 0.8, filter: "blur(4px)" });
  });

  it("keeps framework-owned text nodes and reads their latest content on the next morph", async () => {
    const { wrapper, off, on } = faces();
    const offText = off.firstChild!;
    const onText = on.firstChild!;
    const run = morph(off, on);
    expect(off.childNodes).toHaveLength(1);
    expect(on.childNodes).toHaveLength(1);
    expect(off.firstChild).toBe(offText);
    expect(on.firstChild).toBe(onText);
    onText.nodeValue = "Updated";
    run.forEach((a) => a.finish());
    await flush();
    expect(overlays(wrapper)).toHaveLength(0);
    expect(on.firstChild).toBe(onText);
    expect(on.textContent).toBe("Updated");
    expect(on.style.opacity).toBe("1");
    expect(off.style.opacity).toBe("0");
    expect(on.hasAttribute("data-cube-chars")).toBe(false);
    morph(on, off);
    expect(chars(wrapper, "Updated").map((c) => c.textContent).join("")).toBe("Updated");
  });

  it("cleans temporary copies on cancellation and consumes rejected finished promises", async () => {
    // This also runs against older stand-ins that did not reject on cancellation.
    vi.spyOn(Element.prototype, "animate").mockImplementation(() => {
      let reject!: (reason: unknown) => void;
      const finished = new Promise<Animation>((_, no) => { reject = no; });
      return { finished, cancel: () => reject(new DOMException("Cancelled", "AbortError")) } as Animation;
    });
    const { wrapper, off, on } = faces();
    const text = on.firstChild;
    const run = morph(off, on);
    run.forEach((animation) => animation.cancel());
    await flush();
    expect(overlays(wrapper)).toHaveLength(0);
    expect(on.firstChild).toBe(text);
    expect(on.style.opacity).toBe("1");
    expect(off.style.opacity).toBe("0");
  });

  it.each([false, true])("preparation invalidates cancelled cleanup after one face is replaced (text %s)", async (text) => {
    const { wrapper, off, on } = faces(text ? "Copy" : "", text ? "Copied" : "");
    Object.defineProperty(wrapper, "offsetWidth", { get: () => on.style.position === "relative" ? 120 : 80 });
    const run = morph(off, on);
    run.forEach((animation) => animation.cancel());
    const replacement = document.createElement("span");
    replacement.textContent = "Retry";
    off.replaceWith(replacement);
    prepareMorph(on, replacement);
    await flush();
    expect(on.style.opacity).toBe("0");
    expect(on.getAttribute("aria-hidden")).toBe("true");
    expect(on.hasAttribute("inert")).toBe(true);
    expect(replacement.style.opacity).toBe("1");
    expect(replacement.hasAttribute("aria-hidden")).toBe(false);
    expect(replacement.hasAttribute("inert")).toBe(false);
    expect(overlays(wrapper)).toHaveLength(0);
    expect(wrapper.getAnimations()).toHaveLength(0);
  });

  it.each([false, true])("preparation removes existing visual copies and face/width fills itself (text %s)", async (text) => {
    const { wrapper, off, on } = faces(text ? "Copy" : "", text ? "Copied" : "");
    Object.defineProperty(wrapper, "offsetWidth", { get: () => on.style.position === "relative" ? 120 : 80 });
    const run = morph(off, on);
    prepareMorph(on, off);
    expect(overlays(wrapper)).toHaveLength(0);
    expect([...off.getAnimations(), ...on.getAnimations(), ...wrapper.getAnimations()]).toHaveLength(0);
    await Promise.allSettled(run.map((animation) => animation.finished));
    await flush();
    expect(on.style.opacity).toBe("0");
    expect(off.style.opacity).toBe("1");
  });

  it("preserves custom labels and exposes only the active original face", async () => {
    const { wrapper, off, on } = faces();
    on.setAttribute("aria-label", "Custom status");
    prepareMorph(on, off);
    expect(on.getAttribute("aria-hidden")).toBe("true");
    expect(on.hasAttribute("inert")).toBe(true);
    expect(off.hasAttribute("aria-hidden")).toBe(false);
    morph(off, on);
    expect(off.getAttribute("aria-hidden")).toBe("true");
    expect(off.hasAttribute("inert")).toBe(true);
    expect(on.hasAttribute("aria-hidden")).toBe(false);
    expect(on.hasAttribute("inert")).toBe(false);
    expect(on.getAttribute("aria-label")).toBe("Custom status");
    expect(off.hasAttribute("aria-label")).toBe(false);
    for (const overlay of overlays(wrapper)) {
      expect(overlay.getAttribute("aria-hidden")).toBe("true");
      expect(overlay.hasAttribute("inert")).toBe(true);
      expect(overlay.hasAttribute("aria-label")).toBe(false);
    }
    settle();
    await flush();
    expect(on.getAttribute("aria-label")).toBe("Custom status");
  });

  it("makes inactive interactive descendants inert", () => {
    const { off, on } = faces("", "");
    const button = off.appendChild(document.createElement("button"));
    on.appendChild(document.createElement("a")).href = "/done";
    morph(off, on);
    expect(button.closest("[inert]")).toBe(off);
    expect(on.hasAttribute("inert")).toBe(false);
  });

  it.each(["content-box", "border-box"])("retargets width after cancelling its previous fill with %s sizing", (boxSizing) => {
    const { wrapper, off, on } = faces();
    wrapper.style.boxSizing = boxSizing;
    wrapper.style.padding = "0 10px";
    wrapper.style.border = "2px solid";
    let old: ReturnType<typeof animationsOf>[number] | undefined;
    Object.defineProperty(wrapper, "offsetWidth", { get: () => {
      if (old && !old.cancelled) return 124;
      return on.style.position === "relative" ? 164 : 104;
    } });
    morph(off, on);
    old = animationsOf(wrapper)[0];
    expect(old.keyframes).toEqual(boxSizing === "content-box"
      ? [{ width: "80px" }, { width: "140px" }]
      : [{ width: "104px" }, { width: "164px" }]);
    morph(on, off);
    expect(old.cancelled).toBe(true);
    expect(frames(wrapper)).toEqual(boxSizing === "content-box"
      ? [{ width: "100px" }, { width: "80px" }]
      : [{ width: "124px" }, { width: "104px" }]);
  });

  it("uses opacity alone and cancels an existing width animation when reduced motion changes", async () => {
    const { wrapper, off, on } = faces();
    Object.defineProperty(wrapper, "offsetWidth", { get: () => on.style.position === "relative" ? 120 : 80 });
    morph(off, on);
    const fit = animationsOf(wrapper)[0];
    setReduceMotion(true);
    const run = morph(on, off);
    expect(fit.cancelled).toBe(true);
    expect(run).toHaveLength(2);
    expect(overlays(wrapper)).toHaveLength(0);
    expect(frames(on)).toEqual([{ opacity: 1 }, { opacity: 0 }]);
    expect(frames(off)).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(animationsOf(off).at(-1)!.options.delay).toBe(0);
    await flush();
    expect(off.style.opacity).toBe("1");
  });
});
