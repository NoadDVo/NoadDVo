import {
  DEFAULT_GEOMETRY_STYLE,
  type ArcObject,
  type PointObject,
  type RegionObject,
} from "../../core/geometry";
import { DEFAULT_VIEWPORT } from "../../core/geometry/viewport";
import { importProjectJson } from "../../core/export";
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
  assertBasicProjectSerialization();
  assertArcAndRegionProjectRoundTrip();
}

function assertBasicProjectSerialization(): void {
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

function assertArcAndRegionProjectRoundTrip(): void {
  const arc: ArcObject = {
    centerPointId: "a",
    createdAt: 2,
    dependencies: ["a", "b", "c"],
    dependents: [],
    direction: "counterclockwise",
    endPointId: "c",
    id: "arc-bc",
    locked: false,
    startPointId: "b",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "arc",
    updatedAt: 2,
    visible: true,
  };
  const region: RegionObject = {
    boundaryPointIds: ["a", "b", "c"],
    createdAt: 3,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "region-abc",
    locked: false,
    style: { ...DEFAULT_GEOMETRY_STYLE, fill: "#7ddcff", fillOpacity: 0.2 },
    type: "region",
    updatedAt: 3,
    visible: true,
  };
  const pointB: PointObject = { ...point, id: "b", name: "B", x: 1, y: 0 };
  const pointC: PointObject = { ...point, id: "c", name: "C", x: 0, y: 1 };
  const document = createProjectDocument(createProjectMetadata("Geometry Types"), {
    objects: { a: point, b: pointB, c: pointC, "arc-bc": arc, "region-abc": region },
    selectedObjectIds: ["arc-bc", "region-abc"],
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
  const imported = importProjectJson(serializeProjectDocument(document));

  assertEqual(imported.valid, true, "arc and region project imports successfully");
  if (imported.valid) {
    assertEqual(imported.objects["arc-bc"]?.type, "arc", "arc survives project import");
    assertEqual(imported.objects["region-abc"]?.type, "region", "region survives project import");
  }
}
