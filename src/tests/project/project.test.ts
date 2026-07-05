import { DEFAULT_GEOMETRY_STYLE, type PointObject } from "../../core/geometry";
import { DEFAULT_VIEWPORT } from "../../core/geometry/viewport";
import { createProjectMetadata } from "../../core/project";
import {
  createProjectDocument,
  serializeProjectDocument,
} from "../../core/project/ProjectSerializer";
import { getTikzOptions } from "../../core/tikz";
import { assertEqual } from "../assert";

const point: PointObject = {
  createdAt: 1,
  dependencies: [],
  dependents: [],
  id: "a",
  locked: false,
  name: "A",
  pointKind: "free",
  style: DEFAULT_GEOMETRY_STYLE,
  type: "point",
  updatedAt: 1,
  visible: true,
  x: 0,
  y: 0,
};

export function runProjectTests(): void {
  const document = createProjectDocument(createProjectMetadata("Test"), {
    objects: { a: point },
    selectedObjectIds: ["a"],
    settings: {
      gridSize: 1,
      showAxes: true,
      showGrid: true,
      snapEnabled: true,
    },
    theme: "dark-arctic",
    tikzOptions: getTikzOptions("academic"),
    viewport: DEFAULT_VIEWPORT,
  });
  const parsed = JSON.parse(serializeProjectDocument(document)) as typeof document;

  assertEqual(parsed.version, 1, "project version is serialized");
  assertEqual(parsed.objects.length, 1, "project objects are serialized");
  assertEqual(parsed.selection[0], "a", "project selection is serialized");
}

