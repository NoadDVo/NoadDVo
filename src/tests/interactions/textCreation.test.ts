import { createTextObject } from "../../core/tools/TextTool";
import { assertEqual } from "../assert";

export function runTextCreationTests(): void {
  const text = createTextObject({
    content: "Let $A$ be a point",
    mode: "plain",
    objects: {},
    point: { x: 1.5, y: -2 },
  });

  assertEqual(text.type, "text", "text tool factory creates a text object");
  assertEqual(text.x, 1.5, "created text stores x position");
  assertEqual(text.y, -2, "created text stores y position");
  assertEqual(text.content, "Let $A$ be a point", "created text stores content");
}
