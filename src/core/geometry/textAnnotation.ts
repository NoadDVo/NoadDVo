import type {
  GeometryObjectRecord,
  Point2D,
  TextAlignment,
  TextMode,
  TextObject,
} from "./types";

export const textModes = [
  "plain",
  "math",
  "latex",
  "coordinate-label",
  "object-label",
  "measurement-label",
] as const satisfies readonly TextMode[];

export const textAlignments = [
  "left",
  "center",
  "right",
] as const satisfies readonly TextAlignment[];

function metadataNumber(
  object: TextObject,
  key: string,
  fallback: number,
): number {
  const value = object.metadata?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function metadataString<TValue extends string>(
  object: TextObject,
  key: string,
  values: readonly TValue[],
  fallback: TValue,
): TValue {
  const value = object.metadata?.[key];

  return typeof value === "string" && values.includes(value as TValue)
    ? value as TValue
    : fallback;
}

export function getTextFontSize(object: TextObject): number {
  return Math.max(6, metadataNumber(object, "fontSize", object.style.labelSize));
}

export function getTextRotation(object: TextObject): number {
  return metadataNumber(object, "rotation", 0);
}

export function getTextAlignment(object: TextObject): TextAlignment {
  return metadataString(object, "alignment", textAlignments, "left");
}

export function getTextOpacity(object: TextObject): number {
  return Math.min(1, Math.max(0, metadataNumber(object, "opacity", object.style.strokeOpacity)));
}

export function getTextPosition(
  object: TextObject,
  objects: GeometryObjectRecord,
): Point2D {
  const parentId = object.dependencies[0];
  const parent = parentId ? objects[parentId] : null;

  if (object.metadata?.followObject === true && parent?.type === "point") {
    return {
      x: parent.x + object.x,
      y: parent.y + object.y,
    };
  }

  return {
    x: object.x,
    y: object.y,
  };
}

export function normalizeTextMode(value: string | null): TextMode {
  return textModes.includes(value as TextMode) ? value as TextMode : "plain";
}
