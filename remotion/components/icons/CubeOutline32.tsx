import type { SVGProps } from "react";

export type CubeOutline32Props = SVGProps<SVGSVGElement> & {
  strokeWidth?: number | string;
  corners?: "round" | "square";
};

export function CubeOutline32({
  strokeWidth = 2,
  corners = "square",
  ...props
}: CubeOutline32Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} viewBox="0 0 32 32" {...props}><path d="M29 8.10526L16 14L3 8.10526" stroke="currentColor" strokeWidth={strokeWidth} strokeMiterlimit="10" data-color="color-2" fill="none" data-cap="butt" strokeLinejoin={corners === "round" ? "round" : "miter"} strokeLinecap={corners === "round" ? "round" : "butt"}></path> <path d="M16 30V14" stroke="currentColor" strokeWidth={strokeWidth} data-color="color-2" fill="none" data-cap="butt" strokeLinejoin={corners === "round" ? "round" : "miter"} strokeLinecap={corners === "round" ? "round" : "butt"}></path> <path d="M29 24.1053V7.89474L16 2L3 7.89474V24.1053L16 30L29 24.1053Z" stroke="currentColor" strokeWidth={strokeWidth} strokeMiterlimit="10" fill="none" data-cap="butt" strokeLinejoin={corners === "round" ? "round" : "miter"} strokeLinecap={corners === "round" ? "round" : "butt"}></path></svg>
  );
}
