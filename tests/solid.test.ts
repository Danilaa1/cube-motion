import { createSignal } from "solid-js";
import { createComponent, render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Morph, Press, Reveal, Rise } from "../src/solid.js";
import { animationsOf, install, observed } from "./setup.js";

let host: HTMLElement;
let dispose = () => {};

beforeEach(() => {
  install();
  host = document.body.appendChild(document.createElement("div"));
});

afterEach(() => {
  dispose();
  host.remove();
});

const mount = (node: () => unknown) => {
  dispose = render(node as () => Element, host);
};

describe("solid components", () => {
  it("Rise renders the element it is told to, spreads props, and rises its children", () => {
    mount(() =>
      createComponent(Rise, {
        as: "section",
        class: "hero",
        stagger: 40,
        get children() {
          return [document.createElement("h1"), document.createElement("p")];
        },
      } as never),
    );
    const section = host.querySelector("section.hero")!;
    expect(section).not.toBeNull();
    expect(animationsOf(section.children[1])[0].options.delay).toBe(40);
  });

  it("Press renders a button by default, binds press, hands back the ref, and unbinds on dispose", () => {
    let captured: Element | undefined;
    mount(() => createComponent(Press, { ref: (el: Element) => (captured = el), children: "Save" } as never));
    const button = host.querySelector("button")!;
    expect(captured).toBe(button);
    expect(button.textContent).toBe("Save");
    button.dispatchEvent(new Event("pointerdown"));
    expect(animationsOf(button)[0].keyframes).toEqual({ scale: 0.97 });
    dispose();
    button.dispatchEvent(new Event("pointerdown"));
    expect(animationsOf(button)).toHaveLength(1);
  });

  it("Morph stacks two faces, hides the inactive one from the first paint, and morphs on change", () => {
    const [saved, setSaved] = createSignal(false);
    mount(() =>
      createComponent(Morph, {
        get active() {
          return saved();
        },
        off: "Save",
        on: "Saved",
      } as never),
    );
    const wrapper = host.querySelector("span")!;
    const [off, on] = wrapper.querySelectorAll("span");
    expect(wrapper.style.display).toBe("inline-grid");
    expect([off.style.opacity, on.style.opacity]).toEqual(["1", "0"]);
    expect(animationsOf(off)).toHaveLength(0);
    setSaved(true);
    expect(animationsOf(off)[0].options.duration).toBe(220);
    expect(animationsOf(on)[0].options.delay).toBe(130);
  });

  it("Reveal observes its children and disconnects on dispose", () => {
    mount(() =>
      createComponent(Reveal, {
        as: "ul",
        get children() {
          return [document.createElement("li"), document.createElement("li")];
        },
      } as never),
    );
    expect(observed).toHaveLength(2);
    expect(host.querySelector("li")!.style.opacity).toBe("0");
    dispose();
    expect(observed).toHaveLength(0);
  });
});
