import { createElement, type ReactNode } from "react";

import {
  DEFAULT_GEOMETRY_STYLE,
  getRegionBoundaryPath,
  getPolygonPoints,
  isPointInPolygon,
  polygonArea,
  type BoundaryEdge,
  type GeometryStyle,
  type GeometryObjectRecord,
  type Point2D,
  type PolygonObject,
  type RegionObject,
} from "../geometry";
import {
  getSelectableBoundaryFaces,
  type BoundaryFillFace,
} from "../geometry/regions/BoundaryFillEngine";
import { worldToScreen } from "../geometry/viewport";
import { getHitObject } from "./ConstructionToolUtils";
import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let regionIdCounter = 0;
const PREVIEW_THROTTLE_MS = 48;

function sameBoundary(
  firstBoundary: readonly string[],
  secondBoundary: readonly string[],
): boolean {
  return (
    firstBoundary.length === secondBoundary.length &&
    firstBoundary.every((pointId, index) => secondBoundary[index] === pointId)
  );
}

function polygonContainsPoint(
  polygon: PolygonObject,
  point: Point2D,
  objects: GeometryObjectRecord,
): boolean {
  const points = getPolygonPoints(polygon, objects);

  return points ? isPointInPolygon(point, points) : false;
}

function polygonAreaMagnitude(
  polygon: PolygonObject,
  objects: GeometryObjectRecord,
): number {
  const points = getPolygonPoints(polygon, objects);

  return points ? Math.abs(polygonArea(points)) : Number.POSITIVE_INFINITY;
}

function createRegionId(source: { readonly id: string }): string {
  regionIdCounter += 1;

  return `region-${source.id}-${Date.now().toString(36)}-${regionIdCounter}`;
}

function createRegionName(polygon: PolygonObject): string {
  return polygon.name ? `Fill ${polygon.name}` : "Filled Region";
}

export function findFillablePolygon(
  point: Point2D,
  objects: GeometryObjectRecord,
): PolygonObject | null {
  const polygons = Object.values(objects)
    .filter(
      (object): object is PolygonObject =>
        object.type === "polygon" &&
        object.visible &&
        !object.locked &&
        object.closed === true &&
        polygonContainsPoint(object, point, objects),
    )
    .sort((first, second) => {
      const areaDelta =
        polygonAreaMagnitude(first, objects) - polygonAreaMagnitude(second, objects);

      return areaDelta === 0 ? first.id.localeCompare(second.id) : areaDelta;
    });

  return polygons[0] ?? null;
}

export function findExistingRegionForPolygon(
  polygon: PolygonObject,
  objects: GeometryObjectRecord,
): RegionObject | null {
  return (
    Object.values(objects).find(
      (object): object is RegionObject =>
        object.type === "region" &&
        object.regionKind !== "boundary" &&
        sameBoundary(object.boundaryPointIds, polygon.pointIds),
    ) ?? null
  );
}

export function createRegionFromPolygon(polygon: PolygonObject): RegionObject {
  const now = Date.now();

  return {
    boundaryPointIds: polygon.pointIds,
    createdAt: now,
    dependencies: polygon.pointIds,
    dependents: [],
    id: createRegionId(polygon),
    locked: false,
    name: createRegionName(polygon),
    regionKind: "polygon",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#7ddcff",
      fillOpacity: 0.22,
      stroke: polygon.style.stroke,
      strokeOpacity: 0,
      strokeWidth: 1,
    },
    type: "region",
    updatedAt: now,
    visible: true,
  };
}

type BoundaryCandidate = {
  readonly area: number;
  readonly centroid: Point2D;
  readonly id: string;
  readonly contains: boolean;
  readonly dependencies: readonly string[];
  readonly edgeCount: number;
  readonly loopEdges: readonly BoundaryEdge[];
  readonly name: string;
  readonly source: { readonly id: string; readonly style: GeometryStyle };
};

function sameBoundaryLoop(
  firstEdges: readonly BoundaryEdge[],
  secondEdges: readonly BoundaryEdge[],
): boolean {
  return (
    firstEdges.length === secondEdges.length &&
    firstEdges.every((edge, index) => {
      const other = secondEdges[index];

      return other &&
        edge.objectId === other.objectId &&
        edge.edgeKind === other.edgeKind &&
        edge.direction === other.direction &&
        edge.startPointId === other.startPointId &&
        edge.endPointId === other.endPointId &&
        edge.startParameter === other.startParameter &&
        edge.endParameter === other.endParameter;
    })
  );
}

export function findExistingBoundaryRegion(
  edges: readonly BoundaryEdge[],
  objects: GeometryObjectRecord,
): RegionObject | null {
  return (
    Object.values(objects).find(
      (object): object is RegionObject =>
        object.type === "region" &&
        object.regionKind === "boundary" &&
        Boolean(object.loops?.some((loop) => sameBoundaryLoop(loop.edges, edges))),
    ) ?? null
  );
}

function createRegionFromBoundary(candidate: BoundaryCandidate): RegionObject {
  const now = Date.now();

  return {
    boundaryPointIds: [],
    createdAt: now,
    dependencies: candidate.dependencies,
    dependents: [],
    id: createRegionId(candidate.source),
    locked: false,
    loops: [
      {
        closed: true,
        edges: candidate.loopEdges,
      },
    ],
    metadata: {
      boundaryArea: candidate.area,
      boundaryEdgeCount: candidate.edgeCount,
      boundaryType: candidate.id,
    },
    name: candidate.name,
    regionKind: "boundary",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#7ddcff",
      fillOpacity: 0.22,
      stroke: candidate.source.style.stroke,
      strokeOpacity: 0,
      strokeWidth: 1,
    },
    type: "region",
    updatedAt: now,
    visible: true,
  };
}

export class FillTool extends BaseTool {
  private candidateIndex = 0;
  private candidates: readonly BoundaryCandidate[] = [];
  private diagnostics: readonly string[] = [];
  private lastPreviewUpdateAt = 0;
  private pointerKey: string | null = null;

  constructor() {
    super({
      cursor: "cell",
      id: "fill",
      name: "Fill",
      shortcut: "F",
    });
  }

  activate(context: ToolContext): void {
    super.activate(context);
    getSelectableBoundaryFaces(context.pointerWorld, context.objects);
    this.candidateIndex = 0;
    this.candidates = [];
    this.diagnostics = [];
    this.lastPreviewUpdateAt = 0;
    this.pointerKey = null;
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    if (this.pointerKey !== pointKey(event.worldPoint)) {
      this.updateCandidates(event.worldPoint, context, { force: true });
    }

    const selectedCandidate = this.candidates[this.candidateIndex];

    if (selectedCandidate) {
      this.commitCandidate(selectedCandidate, context);
      return;
    }

    const polygon = findFillablePolygon(event.worldPoint, context.objects);

    if (polygon) {
      const existingRegion = findExistingRegionForPolygon(polygon, context.objects);

      if (existingRegion) {
        context.selectObject(existingRegion.id);
        context.setHoveredObject(existingRegion.id);
        this.transitionState("completed", "complete");
        this.transitionState("waitingInput", "await-input");
        return;
      }

      const region = createRegionFromPolygon(polygon);

      context.beginHistoryTransaction("create", "Create filled region");

      if (!context.addObject(region)) {
        context.cancelHistoryTransaction();
        return;
      }

      context.selectObject(region.id);
      context.setHoveredObject(region.id);
      context.commitHistoryTransaction();
      this.transitionState("completed", "complete");
      this.transitionState("waitingInput", "await-input");
      return;
    }



    const hitObject = getHitObject(event, context);
    if (hitObject && ["circle", "ellipse", "polynomial", "hyperbola", "polygon"].includes(hitObject.type)) {
      context.beginHistoryTransaction("update", "Fill object");
      context.updateObject(hitObject.id, (obj) => ({
        ...obj,
        style: {
          ...obj.style,
          fill: "#7ddcff",
          fillOpacity: 0.22,
        },
      }));
      context.selectObject(hitObject.id);
      context.setHoveredObject(hitObject.id);
      context.commitHistoryTransaction();
      this.transitionState("completed", "complete");
      this.transitionState("waitingInput", "await-input");
      return;
    }

    if (!this.diagnostics.length) {
      context.setHoveredObject(null);
    }
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    this.updateCandidates(event.worldPoint, context);

    const polygon = this.candidates.length > 0
      ? null
      : findFillablePolygon(event.worldPoint, context.objects);
    const existingRegion = polygon ? findExistingRegionForPolygon(polygon, context.objects) : null;
    const boundaryCandidate = this.candidates[this.candidateIndex] ?? null;
    const existingBoundaryRegion = boundaryCandidate
      ? findExistingBoundaryRegion(boundaryCandidate.loopEdges, context.objects)
      : null;
    const hitObject = getHitObject(event, context);
    const fillableHitObject = hitObject && ["circle", "ellipse", "polynomial", "hyperbola", "polygon"].includes(hitObject.type) ? hitObject : null;

    context.setHoveredObject(
      existingRegion?.id ??
      polygon?.id ??
      existingBoundaryRegion?.id ??
      boundaryCandidate?.source.id ??
      fillableHitObject?.id ??
      null,
    );
  }

  keyDown(event: KeyboardEvent, context: ToolContext): void {
    if (event.key === "Escape") {
      this.clearPreview(context);
      event.preventDefault();
      return;
    }

    if (event.key === "Tab" && this.candidates.length > 1) {
      this.candidateIndex = event.shiftKey
        ? (this.candidateIndex - 1 + this.candidates.length) % this.candidates.length
        : (this.candidateIndex + 1) % this.candidates.length;
      context.setHoveredObject(this.candidates[this.candidateIndex]?.source.id ?? null);
      event.preventDefault();
      return;
    }

    if (event.key === "Enter") {
      const selectedCandidate = this.candidates[this.candidateIndex];

      if (selectedCandidate) {
        this.commitCandidate(selectedCandidate, context);
        event.preventDefault();
      }
    }
  }

  cancel(context: ToolContext): void {
    this.clearPreview(context);
    super.cancel(context);
  }

  renderPreview(context: ToolContext): ReactNode {
    const candidate = this.candidates[this.candidateIndex];
    let previewRegion: RegionObject | null = null;
    let label = "Region";

    if (candidate) {
      previewRegion = {
        boundaryPointIds: [],
        createdAt: 0,
        dependencies: candidate.dependencies,
        dependents: [],
        id: "__fill-preview__",
        locked: false,
        loops: [
          {
            closed: true,
            edges: candidate.loopEdges,
          },
        ],
        name: "Fill Preview",
        regionKind: "boundary",
        style: {
          ...DEFAULT_GEOMETRY_STYLE,
          fill: "#7ddcff",
          fillOpacity: 0.2,
          stroke: "#7ddcff",
          strokeOpacity: 0.9,
          strokeWidth: 2,
        },
        type: "region",
        updatedAt: 0,
        visible: true,
      };
      label = this.candidates.length > 1
        ? `Region ${this.candidateIndex + 1} of ${this.candidates.length}`
        : "Region";
    }

    if (!previewRegion) {
      return this.diagnostics.length > 0
        ? renderDiagnosticLabel(this.diagnostics[0] ?? "No closed region found", context.pointerWorld, context)
        : null;
    }

    const boundary = getRegionBoundaryPath(previewRegion, context.objects);

    if (!boundary) {
      return null;
    }

    const labelPoint = candidate ? worldToScreen(candidate.centroid, context.viewport) : worldToScreen(context.pointerWorld, context.viewport);
    const path = boundary.kind === "polygon"
      ? boundary.points.map((point, index) => {
          const screen = worldToScreen(point, context.viewport);

          return `${index === 0 ? "M" : "L"} ${screen.x} ${screen.y}`;
        }).join(" ") + " Z"
      : worldPathToScreenPath(boundary.path, context);
    
    const diagnostic = !candidate ? this.diagnostics[0] : null;

    return createElement(
      "g",
      { "data-fill-preview": "true" },
      createElement("path", {
        d: path,
        fill: "#7ddcff",
        fillOpacity: 0.2,
        stroke: "#7ddcff",
        strokeDasharray: "8 5",
        strokeLinejoin: "round",
        strokeOpacity: 0.95,
        strokeWidth: 2,
      }),
      createElement("text", {
        fill: "#e5f8ff",
        fontSize: 12,
        fontWeight: 800,
        paintOrder: "stroke",
        stroke: "#06202a",
        strokeWidth: 4,
        x: labelPoint.x + 10,
        y: labelPoint.y - 10,
      }, diagnostic ? `${label} - ${diagnostic}` : label),
    );
  }

  private updateCandidates(
    point: Point2D,
    context: ToolContext,
    options: { readonly force?: boolean } = {},
  ): void {
    const previousPointerKey = this.pointerKey;
    const nextPointerKey = pointKey(point);
    const now = Date.now();

    if (
      !options.force &&
      previousPointerKey !== null &&
      previousPointerKey !== nextPointerKey &&
      now - this.lastPreviewUpdateAt < PREVIEW_THROTTLE_MS
    ) {
      return;
    }

    this.pointerKey = nextPointerKey;
    this.lastPreviewUpdateAt = now;

    const result = getSelectableBoundaryFaces(point, context.objects);

    this.candidates = result.candidates.map(faceToCandidate);
    this.diagnostics = result.diagnostics.map((diagnostic) => diagnostic.message);
    this.candidateIndex = previousPointerKey === this.pointerKey
      ? Math.min(this.candidateIndex, Math.max(0, this.candidates.length - 1))
      : 0;
      
    if (this.candidates.length > 0) {
      this.transitionState("preview", "preview");
    } else {
      this.transitionState("waitingInput", "await-input");
    }
  }

  private clearPreview(context: ToolContext): void {
    this.candidateIndex = 0;
    this.candidates = [];
    this.diagnostics = [];
    this.lastPreviewUpdateAt = 0;
    this.pointerKey = null;
    context.setHoveredObject(null);
    this.transitionState("waitingInput", "await-input");
  }

  private commitCandidate(candidate: BoundaryCandidate, context: ToolContext): void {
    const existingBoundaryRegion = findExistingBoundaryRegion(
      candidate.loopEdges,
      context.objects,
    );

    if (existingBoundaryRegion) {
      context.selectObject(existingBoundaryRegion.id);
      context.setHoveredObject(existingBoundaryRegion.id);
      this.transitionState("completed", "complete");
      this.clearPreview(context);
      return;
    }

    const region = createRegionFromBoundary(candidate);

    context.beginHistoryTransaction("create", "Create filled region");

    if (!context.addObject(region)) {
      context.cancelHistoryTransaction();
      return;
    }

    context.selectObject(region.id);
    context.setHoveredObject(region.id);
    context.commitHistoryTransaction();
    this.transitionState("completed", "complete");
    this.clearPreview(context);
  }
}

export const fillTool = new FillTool();

function faceToCandidate(face: BoundaryFillFace): BoundaryCandidate {
  return {
    area: face.area,
    centroid: face.centroid,
    contains: true,
    dependencies: face.dependencies,
    edgeCount: face.edgeCount,
    id: face.id,
    loopEdges: face.loopEdges,
    name: face.name,
    source: face.source,
  };
}

function pointKey(point: Point2D): string {
  return `${point.x.toFixed(4)},${point.y.toFixed(4)}`;
}

function renderDiagnosticLabel(message: string, point: Point2D, context: ToolContext): ReactNode {
  const screen = worldToScreen(point, context.viewport);

  return createElement("text", {
    fill: "#e5f8ff",
    fontSize: 12,
    fontWeight: 800,
    paintOrder: "stroke",
    stroke: "#06202a",
    strokeWidth: 4,
    x: screen.x + 10,
    y: screen.y - 10,
  }, message);
}

function worldPathToScreenPath(path: string, context: ToolContext): string {
  const tokens = path.match(/[A-Za-z]|-?\d+(?:\.\d+)?/g) ?? [];
  const output: string[] = [];
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];

    if (token === "M" || token === "L") {
      const x = Number(tokens[index + 1]);
      const y = Number(tokens[index + 2]);
      const screen = worldToScreen({ x, y }, context.viewport);

      output.push(token, String(screen.x), String(screen.y));
      index += 3;
      continue;
    }

    if (token === "A") {
      const rx = Number(tokens[index + 1]) * context.viewport.scale;
      const ry = Number(tokens[index + 2]) * context.viewport.scale;
      const rotation = tokens[index + 3] ?? "0";
      const largeArc = tokens[index + 4] ?? "0";
      const sweep = tokens[index + 5] === "1" ? "0" : "1";
      const x = Number(tokens[index + 6]);
      const y = Number(tokens[index + 7]);
      const screen = worldToScreen({ x, y }, context.viewport);

      output.push("A", String(rx), String(ry), rotation, largeArc, sweep, String(screen.x), String(screen.y));
      index += 8;
      continue;
    }

    output.push(token ?? "");
    index += 1;
  }

  return output.join(" ");
}
