import { act } from "react";
import { createElement, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useMorph, usePress, useReveal, useRise } from "../src/react.js";
import { animationsOf, install, observed } from "./setup.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement;
let root: Root;

beforeEach(() => {
  install();
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

const mount = (component: () => unknown) => act(async () => root.render(createElement(component as never)));

describe("react adapter", () => {
  it("useRise rises the container's children once and cancels them on unmount", async () => {
    function List() {
      const ref = useRef<HTMLUListElement>(null);
      useRise(ref);
      return createElement("ul", { ref }, createElement("li"), createElement("li"));
    }
    await mount(List);
    const items = host.querySelectorAll("li");
    expect(animationsOf(items[1])[0].options.delay).toBe(70);
    await act(async () => root.unmount());
    expect(animationsOf(items[1])[0].cancelled).toBe(true);
  });

  it("usePress binds press feedback for the element's lifetime", async () => {
    function Button() {
      const ref = useRef<HTMLButtonElement>(null);
      usePress(ref);
      return createElement("button", { ref });
    }
    await mount(Button);
    const button = host.querySelector("button")!;
    button.dispatchEvent(new Event("pointerdown"));
    expect(animationsOf(button)[0].keyframes).toEqual({ scale: 0.97 });
  });

  it("useMorph hides the inactive face on first render and morphs when active flips", async () => {
    function Save({ saved }: { saved: boolean }) {
      const off = useRef<HTMLElement>(null);
      const on = useRef<HTMLElement>(null);
      useMorph(off, on, saved);
      return createElement("span", null, createElement("i", { ref: off }, "Save"), createElement("i", { ref: on }, "Saved"));
    }
    await act(async () => root.render(createElement(Save, { saved: false })));
    const [off, on] = host.querySelectorAll("i");
    expect(on.style.opacity).toBe("0");
    expect(animationsOf(off)).toHaveLength(0);
    await act(async () => root.render(createElement(Save, { saved: true })));
    expect(animationsOf(off)[0].options.duration).toBe(220);
    expect(animationsOf(on)[0].options.delay).toBe(130);
  });

  it("useReveal observes the container's children and disconnects on unmount", async () => {
    function Cards() {
      const ref = useRef<HTMLDivElement>(null);
      useReveal(ref);
      return createElement("div", { ref }, createElement("article"), createElement("article"));
    }
    await mount(Cards);
    expect(observed).toHaveLength(2);
    expect(host.querySelector("article")!.style.opacity).toBe("0");
    await act(async () => root.unmount());
    expect(observed).toHaveLength(0);
  });
});
