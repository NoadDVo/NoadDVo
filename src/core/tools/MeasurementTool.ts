import {
  DEFAULT_GEOMETRY_STYLE,
  isMeasurementTypeSupported,
  type GeometryObject,
  type GeometryObjectRecord,
  type MeasurementObject,
  type MeasurementType,
} from "../geometry";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let measurementIdCounter = 0;

const targetMeasurementTypes = {
  angle: ["angle-value"],
  arc: ["arc-length"],
  circle: [
    "circle-radius",
    "circle-diameter",
    "circle-circumference",
    "circle-area",
  ],
  polygon: ["polygon-area", "polygon-perimeter"],
  region: ["region-area"],
  segment: ["segment-length"],
} as const satisfies Partial<Record<GeometryObject["type"], readonly MeasurementType[]>>;

function createMeasurementId(): string {
  measurementIdCounter += 1;

  return `measurement-${Date.now().toString(36)}-${measurementIdCounter}`;
}

function getSupportedTypes(target: GeometryObject): readonly MeasurementType[] {
  const map: Partial<Record<GeometryObject["type"], readonly MeasurementType[]>> =
    targetMeasurementTypes;

  return map[target.type] ?? [];
}

function chooseMeasurementType(target: GeometryObject): MeasurementType | null {
  const supportedTypes = getSupportedTypes(target);

  if (supportedTypes.length === 0) {
    return null;
  }

  const fallback = supportedTypes[0];

  if (supportedTypes.length === 1 || !fallback) {
    return fallback ?? null;
  }

  const requested = window.prompt(
    `Measurement type: ${supportedTypes.join(", ")}`,
    fallback,
  ) as MeasurementType | null;

  return requested && supportedTypes.includes(requested) ? requested : null;
}

export function createMeasurementObject({
  measurementType,
  objects,
  target,
}: {
  readonly measurementType: MeasurementType;
  readonly objects: GeometryObjectRecord;
  readonly target: GeometryObject;
}): MeasurementObject {
  const now = Date.now();
  const sameTypeCount = Object.values(objects).filter(
    (object) => object.type === "measurement",
  ).length;

  return {
    createdAt: now,
    dependencies: [target.id],
    dependents: [],
    id: createMeasurementId(),
    labelPosition: "above",
    locked: false,
    measurementType,
    name: `m${sameTypeCount + 1}`,
    precision: 2,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      labelSize: 13,
      stroke: "#0b0f14",
      strokeOpacity: 1,
    },
    targetObjectId: target.id,
    type: "measurement",
    updatedAt: now,
    visible: true,
  };
}

export class MeasurementTool extends BaseTool {
  constructor() {
    super({
      cursor: "crosshair",
      id: "measure",
      name: "Measure",
      shortcut: "M",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const hit = hitTest(
      event.screenPoint,
      event.worldPoint,
      context.objects,
      context.viewport,
    );
    const target = hit?.object ?? null;
    const measurementType = target ? chooseMeasurementType(target) : null;

    if (!target || !measurementType || !isMeasurementTypeSupported(target, measurementType)) {
      this.transitionState("cancelled", "cancel");

      return;
    }

    const measurement = createMeasurementObject({
      measurementType,
      objects: context.objects,
      target,
    });

    if (context.addObject(measurement)) {
      context.selectObject(measurement.id);
      context.setHoveredObject(measurement.id);
      this.transitionState("completed", "complete");
      this.transitionState("waitingInput", "await-input");
    }
  }
}

export const measurementTool = new MeasurementTool();
