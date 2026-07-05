import type { VectorObject } from "./types";

export type VectorArrowStyle = "latex" | "stealth" | "triangle" | "none";

export const DEFAULT_VECTOR_ARROW_STYLE: VectorArrowStyle = "latex";
export const DEFAULT_VECTOR_ARROW_SIZE = 8;

const arrowStyles = new Set<VectorArrowStyle>([
  "latex",
  "stealth",
  "triangle",
  "none",
]);

function readMetadataString(object: VectorObject, key: string): string | null {
  const value = object.metadata?.[key];

  return typeof value === "string" ? value : null;
}

function readMetadataNumber(object: VectorObject, key: string): number | null {
  const value = object.metadata?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function getVectorArrowStyle(object: VectorObject): VectorArrowStyle {
  const value = readMetadataString(object, "arrowStyle");

  return value && arrowStyles.has(value as VectorArrowStyle)
    ? value as VectorArrowStyle
    : DEFAULT_VECTOR_ARROW_STYLE;
}

export function getVectorArrowSize(object: VectorObject): number {
  return Math.max(1, readMetadataNumber(object, "arrowSize") ?? DEFAULT_VECTOR_ARROW_SIZE);
}

export function vectorArrowStyleToTikz(
  style: VectorArrowStyle,
  size?: number,
): string | null {
  if (style === "none") {
    return null;
  }

  const tikzStyle = style === "latex"
    ? "Latex"
    : style === "stealth"
      ? "Stealth"
      : "Triangle";

  return size && Number.isFinite(size) && size !== DEFAULT_VECTOR_ARROW_SIZE
    ? `-{${tikzStyle}[length=${Math.max(1, size).toFixed(1)}pt]}`
    : `-{${tikzStyle}}`;
}
