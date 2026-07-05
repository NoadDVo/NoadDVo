import {
  DEFAULT_GEOMETRY_STYLE,
  type GeometryObjectRecord,
  type TextObject,
} from "../../core/geometry";
import { hitTest } from "../../core/selection/HitTest";
import { assertEqual } from "../assert";

function textObject(): TextObject {
  return {
    content: "Annotation",
    createdAt: 1,
    dependencies: [],
    dependents: [],
    id: "text-a",
    locked: false,
    metadata: {
      fontSize: 14,
    },
    style: DEFAULT_GEOMETRY_STYLE,
    textMode: "plain",
    type: "text",
    updatedAt: 1,
    visible: true,
    x: 0,
    y: 0,
  };
}

export function runSelectionTests(): void {
  const text = textObject();
  const objects: GeometryObjectRecord = {
    "text-a": text,
  };
  const hit = hitTest(
    { x: 104, y: 96 },
    { x: 0.4, y: 0.4 },
    objects,
    {
      height: 200,
      offsetX: 0,
      offsetY: 0,
      scale: 10,
      width: 200,
    },
  );

  assertEqual(hit?.objectId, "text-a", "hit testing selects text annotations");
}
