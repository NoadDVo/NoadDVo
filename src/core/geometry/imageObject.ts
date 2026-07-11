import type { ImageObject, Point2D } from "./types";
import { DEFAULT_GEOMETRY_STYLE } from "./types";

let imageIdCounter = 0;

export type CreateReferenceImageInput = {
  readonly src: string;
  readonly mimeType: string;
  readonly position: Point2D;
  readonly width?: number;
  readonly height?: number;
  readonly name?: string;
};

export function createReferenceImageObject({
  height = 4,
  mimeType,
  name = "Reference Image",
  position,
  src,
  width = 6,
}: CreateReferenceImageInput): ImageObject {
  const now = Date.now();

  imageIdCounter += 1;

  return {
    createdAt: now,
    dependencies: [],
    dependents: [],
    height,
    id: `image-${Date.now().toString(36)}-${imageIdCounter}`,
    locked: false,
    mimeType,
    name,
    opacity: 0.45,
    preserveAspectRatio: true,
    src,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fillOpacity: 0,
      stroke: "#7ddcff",
      strokeOpacity: 0.7,
      strokeWidth: 1,
    },
    type: "image",
    updatedAt: now,
    visible: true,
    width,
    x: position.x,
    y: position.y,
  };
}
