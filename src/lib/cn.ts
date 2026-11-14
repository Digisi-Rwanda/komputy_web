import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our custom type scale and radii so `text-h4` (size) and `text-fg-muted` (colour)
// are not treated as conflicting, and later classes override earlier ones correctly.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h1", "h2", "h3", "h4", "body-lg", "body", "small", "micro", "label"] }],
      rounded: [{ rounded: ["input", "card", "panel"] }],
    },
  },
});

/** Join class names (falsy skipped) and resolve Tailwind conflicts; last one wins. */
export function cn(...parts: Array<string | number | bigint | boolean | null | undefined>) {
  return twMerge(parts.filter((p): p is string => typeof p === "string" && p !== "").join(" "));
}
