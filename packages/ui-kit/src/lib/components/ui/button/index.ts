import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
import Root from "./button.svelte";

export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "green";
export type ButtonSize =
  | "default"
  | "sm"
  | "lg"
  | "extraLg"
  | "icon"
  | "icon-sm"
  | "icon-lg";
export type ButtonProps = HTMLButtonAttributes &
  HTMLAnchorAttributes & {
    ref?: HTMLButtonElement | HTMLAnchorElement | null;
    variant?: ButtonVariant;
    size?: ButtonSize;
  };

export {
  //
  Root as Button,
  type ButtonProps as Props
};
