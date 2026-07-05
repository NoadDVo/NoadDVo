import {
  DEFAULT_GEOMETRY_STYLE,
  type GeometryObjectRecord,
  type MeasurementObject,
  type PointObject,
  type SegmentObject,
} from "../../core/geometry";
import { generateTikz } from "../../core/tikz";
import { assertIncludes } from "../assert";

function point(id: string, name: string, x: number, y: number): PointObject {
  return {
    createdAt: 1,
    dependencies: [],
    dependents: [],
    id,
    locked: false,
    name,
    pointKind: "free",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "point",
    updatedAt: 1,
    visible: true,
    x,
    y,
  };
}

export function runMeasurementTikzTests(): void {
  const segment: SegmentObject = {
    createdAt: 1,
    dependencies: ["a", "b"],
    dependents: ["length-ab"],
    endPointId: "b",
    id: "ab",
    locked: false,
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "segment",
    updatedAt: 1,
    visible: true,
  };
  const measurement: MeasurementObject = {
    createdAt: 2,
    dependencies: ["ab"],
    dependents: [],
    id: "length-ab",
    labelPosition: "above",
    locked: false,
    measurementType: "segment-length",
    precision: 2,
    style: DEFAULT_GEOMETRY_STYLE,
    targetObjectId: "ab",
    type: "measurement",
    updatedAt: 2,
    visible: true,
  };
  const objects: GeometryObjectRecord = {
    a: point("a", "A", 0, 0),
    ab: segment,
    b: point("b", "B", 3, 4),
    "length-ab": measurement,
  };
  const code = generateTikz(objects, "academic").code;

  assertIncludes(code, "\\node", "TikZ measurement exports a node");
  assertIncludes(code, "{$5$};", "TikZ measurement exports formatted value");
}
