import { beforeEach, describe, expect, it } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import Morph from "./fixtures/Morph.svelte";
import Presence from "./fixtures/Presence.svelte";
import { animationsOf, install, setReduceMotion, settle } from "./setup.js";

beforeEach(() => {
  document.body.innerHTML = "";
  install();
  setReduceMotion(false);
});

describe("compiled Svelte consumer", () => {
  it("samples each repeated exit even when Svelte reuses its transition config", async () => {
    const target = document.body.appendChild(document.createElement("div"));
    const component = mount(Presence, { target, intro: false });
    flushSync();
    const node = target.firstElementChild as HTMLElement;
    flushSync(() => component.show(false));
    await Promise.resolve();
    animationsOf(node).at(-1)!.finish(); // Svelte's delay animation starts the exit.
    node.style.opacity = "0.4";
    node.style.translate = "0px 7px";
    flushSync(() => component.show(true));
    await Promise.resolve();
    animationsOf(node).at(-1)!.finish();
    node.style.opacity = "0.6";
    node.style.translate = "0px 5px";
    flushSync(() => component.show(false));
    await Promise.resolve();
    animationsOf(node).at(-1)!.finish();
    const frames = animationsOf(node).at(-1)!.keyframes as Keyframe[];
    expect(Number(frames[0].opacity)).toBe(0.6);
    expect(frames[0].translate).toContain("5px");
    await unmount(component);
  });

  it("keeps reactive text attached through morphs and cleans up on unmount", async () => {
    const target = document.body.appendChild(document.createElement("div"));
    const component = mount(Morph, { target });
    flushSync();
    const wrapper = target.firstElementChild!;
    const incoming = wrapper.children[1];
    const text = incoming.firstChild;
    flushSync(() => component.select(true));
    expect(wrapper.querySelectorAll("[data-cube-morph-overlay]")).toHaveLength(2);
    flushSync(() => component.rename("Updated"));
    expect(incoming.firstChild).toBe(text);
    expect(incoming.textContent).toBe("Updated");
    settle();
    await Promise.resolve();
    await Promise.resolve();
    expect(incoming.style.opacity).toBe("1");
    expect(wrapper.querySelectorAll("[data-cube-morph-overlay]")).toHaveLength(0);
    flushSync(() => component.select(false));
    await unmount(component);
    expect(target.childElementCount).toBe(0);
  });
});
