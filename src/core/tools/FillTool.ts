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
  type CompoundRegionObject,
} from "../geometry";
import { getArcGeometry, getCircleGeometry, getEllipticalArcGeometry } from "../geometry/derivedGeometry";
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
): RegionObject | CompoundRegionObject | null {
  // Check legacy RegionObject (boundary kind)
  const legacyRegion = Object.values(objects).find(
    (object): object is RegionObject =>
      object.type === "region" &&
      object.regionKind === "boundary" &&
      Boolean(object.loops?.some((loop) => sameBoundaryLoop(loop.edges, edges))),
  );
  if (legacyRegion) return legacyRegion;

  // Check new CompoundRegionObject — match by segment objectIds + directions
  const compoundRegion = Object.values(objects).find(
    (object): object is CompoundRegionObject => {
      if (object.type !== "compound-region") return false;
      const segs = object.segments;
      if (segs.length !== edges.length) return false;
      // A CompoundRegionObject doesn't store loopEdges directly, so we compare
      // by the source edge objectIds in order (best-effort dedup)
      return edges.every((edge, i) => {
        const seg = segs[i];
        if (!seg) return false;
        // For circle-arc/ellipse-arc, the objectId is embedded in centerPointId relationship;
        // We can't compare perfectly, so we do a light check on startPointId/endPointId.
        if (edge.startPointId && edge.endPointId) {
          return seg.startPointId === edge.startPointId && seg.endPointId === edge.endPointId;
        }
        return false;
      });
    },
  );

  return compoundRegion ?? null;
}

function resolveEdgeEndpoints(
  edge: BoundaryEdge,
  objects: GeometryObjectRecord,
): { startPointId: string; endPointId: string; startCoord?: Point2D; endCoord?: Point2D } {
  // If BoundaryEdge already has explicit pointIds, use them directly
  if (edge.startPointId && edge.endPointId) {
    return { startPointId: edge.startPointId, endPointId: edge.endPointId };
  }

  const SENTINEL = "__trimmed__";

  if (edge.inlineStartCoord && edge.inlineEndCoord) {
    return {
      startPointId: SENTINEL,
      endPointId: SENTINEL,
      startCoord: edge.inlineStartCoord,
      endCoord: edge.inlineEndCoord,
    };
  }

  // Trimmed edge: must compute coordinates from the primitive's parametric form.
  const obj = objects[edge.objectId];
  let startCoord: Point2D | undefined;
  let endCoord: Point2D | undefined;

  if (obj?.type === "segment" || obj?.type === "vector") {
    const startPt = obj.startPointId ? (objects[obj.startPointId] as { x?: number; y?: number } | undefined) : undefined;
    const endPt = obj.endPointId ? (objects[obj.endPointId] as { x?: number; y?: number } | undefined) : undefined;
    if (startPt?.x !== undefined && startPt.y !== undefined && endPt?.x !== undefined && endPt.y !== undefined) {
      const p0 = { x: startPt.x, y: startPt.y };
      const p1 = { x: endPt.x, y: endPt.y };
      const t0 = edge.startParameter ?? 0;
      const t1 = edge.endParameter ?? 1;
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      if (edge.direction === "reverse") {
        startCoord = { x: p0.x + dx * t1, y: p0.y + dy * t1 };
        endCoord = { x: p0.x + dx * t0, y: p0.y + dy * t0 };
      } else {
        startCoord = { x: p0.x + dx * t0, y: p0.y + dy * t0 };
        endCoord = { x: p0.x + dx * t1, y: p0.y + dy * t1 };
      }
    }
  } else if (obj?.type === "arc" || obj?.type === "circle") {
    const geom = obj.type === "arc" ? getArcGeometry(obj as any, objects) : getCircleGeometry(obj as any, objects);
    if (geom && geom.center && geom.radius) {
      const t0 = edge.startParameter ?? 0;
      const t1 = edge.endParameter ?? 360;
      const p0 = {
        x: geom.center.x + Math.cos((t0 * Math.PI) / 180) * geom.radius,
        y: geom.center.y + Math.sin((t0 * Math.PI) / 180) * geom.radius,
      };
      const p1 = {
        x: geom.center.x + Math.cos((t1 * Math.PI) / 180) * geom.radius,
        y: geom.center.y + Math.sin((t1 * Math.PI) / 180) * geom.radius,
      };
      if (edge.direction === "reverse") {
        startCoord = p1;
        endCoord = p0;
      } else {
        startCoord = p0;
        endCoord = p1;
      }
    }
  } else if (obj?.type === "elliptical-arc" || obj?.type === "ellipse") {
    let geom: { center: Point2D; rx: number; ry: number; phi: number } | undefined;
    if (obj.type === "elliptical-arc") {
      geom = getEllipticalArcGeometry(obj as any, objects) ?? undefined;
    } else {
      const ellipse = obj as any;
      const centerPt = objects[ellipse.dependencies[0]] as any;
      const pointPt = objects[ellipse.dependencies[1]] as any;
      if (centerPt && pointPt) {
        geom = {
          center: { x: centerPt.x, y: centerPt.y },
          rx: Math.hypot(pointPt.x - centerPt.x, pointPt.y - centerPt.y),
          ry: ellipse.ry,
          phi: Math.atan2(pointPt.y - centerPt.y, pointPt.x - centerPt.x),
        };
      }
    }
    if (geom && geom.center && geom.rx && geom.ry) {
      const t0 = edge.startParameter ?? 0;
      const t1 = edge.endParameter ?? (Math.PI * 2);
      const getPt = (t: number) => ({
        x: geom.center.x + geom.rx * Math.cos(t) * Math.cos(geom.phi) - geom.ry * Math.sin(t) * Math.sin(geom.phi),
        y: geom.center.y + geom.rx * Math.cos(t) * Math.sin(geom.phi) + geom.ry * Math.sin(t) * Math.cos(geom.phi),
      });
      const p0 = getPt(t0);
      const p1 = getPt(t1);
      if (edge.direction === "reverse") {
        startCoord = p1;
        endCoord = p0;
      } else {
        startCoord = p0;
        endCoord = p1;
      }
    }
  }

  const result: { startPointId: string; endPointId: string; startCoord?: Point2D; endCoord?: Point2D } = {
    startPointId: SENTINEL,
    endPointId: SENTINEL,
  };
  if (startCoord) result.startCoord = startCoord;
  if (endCoord) result.endCoord = endCoord;
  return result;
}

function createRegionFromBoundary(candidate: BoundaryCandidate, objects: GeometryObjectRecord): CompoundRegionObject {
  const now = Date.now();
  const rawEdges = candidate.loopEdges;
  const mergedEdges: BoundaryEdge[] = [];
  
  // Group contiguous discretized pieces of the same object
  for (let i = 0; i < rawEdges.length; i++) {
    const current = rawEdges[i];
    const prev = mergedEdges[mergedEdges.length - 1];
    if (current && prev && prev.objectId === current.objectId && (prev.edgeKind === "elliptical-arc" || prev.edgeKind === "ellipse") && (current.edgeKind === "elliptical-arc" || current.edgeKind === "ellipse")) {
      mergedEdges[mergedEdges.length - 1] = {
        ...prev,
        ...(current.endParameter !== undefined ? { endParameter: current.endParameter } : {}),
        ...(current.inlineEndCoord !== undefined ? { inlineEndCoord: current.inlineEndCoord } : {}),
      };
    } else if (current) {
      mergedEdges.push(current);
    }
  }

  // Handle wraparound for closed ellipses
  if (mergedEdges.length > 1) {
    const first = mergedEdges[0];
    const last = mergedEdges[mergedEdges.length - 1];
    if (first && last && first.objectId === last.objectId && (first.edgeKind === "elliptical-arc" || first.edgeKind === "ellipse")) {
       mergedEdges[0] = {
         ...first,
         ...(last.inlineStartCoord !== undefined ? { inlineStartCoord: last.inlineStartCoord } : {}),
         ...(last.startParameter !== undefined ? { startParameter: last.startParameter } : {}),
       };
       mergedEdges.pop();
    }
  }

  const segments: import("../geometry/types").BoundarySegment[] = mergedEdges.map(edge => {
    const obj = objects[edge.objectId];
    const { startPointId, endPointId, startCoord, endCoord } = resolveEdgeEndpoints(edge, objects);

    if (obj?.type === "arc") {
      const arcDir = obj.direction;
      const dir = edge.direction === "forward" ? arcDir : (arcDir === "clockwise" ? "counterclockwise" : "clockwise");
      return {
        type: "circle-arc" as const,
        startPointId,
        endPointId,
        centerPointId: obj.centerPointId,
        direction: dir,
        ...(startCoord && { startCoord }),
        ...(endCoord && { endCoord }),
      };
    }

    if (obj?.type === "circle") {
      const centerPointId = obj.dependencies[0] ?? "";
      const dir = edge.direction === "forward" ? "counterclockwise" : "clockwise";
      const radius = obj.circleKind === "center-radius" ? (obj as any).radius : undefined;
      return {
        type: "circle-arc" as const,
        startPointId,
        endPointId,
        centerPointId,
        direction: dir as "clockwise" | "counterclockwise",
        ...(radius !== undefined && { radius }),
        ...(startCoord && { startCoord }),
        ...(endCoord && { endCoord }),
      };
    }

    if (obj?.type === "elliptical-arc" || obj?.type === "ellipse") {
      const arcDir = (obj as any).direction ?? "counterclockwise";
      const dir = edge.direction === "forward" ? arcDir : (arcDir === "clockwise" ? "counterclockwise" : "clockwise");
      
      let radiusX = 0;
      let radiusY = (obj as any).ry ?? 0;
      let rotation = 0;
      
      if (obj.type === "elliptical-arc") {
        const geom = getEllipticalArcGeometry(obj as any, objects);
        if (geom) {
          radiusX = geom.rx;
          radiusY = geom.ry;
          rotation = geom.phi;
        }
      } else {
        const ellipse = obj as any;
        const centerPt = objects[ellipse.dependencies[0]] as any;
        const pointPt = objects[ellipse.dependencies[1]] as any;
        if (centerPt && pointPt) {
          radiusX = Math.hypot(pointPt.x - centerPt.x, pointPt.y - centerPt.y);
          radiusY = ellipse.ry;
          rotation = Math.atan2(pointPt.y - centerPt.y, pointPt.x - centerPt.x);
        }
      }

      return {
        type: "ellipse-arc" as const,
        startPointId,
        endPointId,
        centerPointId: (obj as any).centerPointId ?? obj.dependencies[0] ?? "",
        direction: dir,
        radiusX,
        radiusY,
        rotation,
        ...(startCoord && { startCoord }),
        ...(endCoord && { endCoord }),
      };
    }

    // Default: straight line segment
    return {
      type: "line" as const,
      startPointId,
      endPointId,
      ...(startCoord && { startCoord }),
      ...(endCoord && { endCoord }),
    };
  });

  return {
    id: candidate.id,
    type: "compound-region",
    closed: true,
    metadata: { sourceLayerId: candidate.loopEdges[0]?.objectId ? objects[candidate.loopEdges[0].objectId]?.layerId : undefined },
    dependencies: Array.from(new Set(candidate.loopEdges.flatMap((e) => [e.objectId, ...(e.startPointId ? [e.startPointId] : []), ...(e.endPointId ? [e.endPointId] : [])]))),
    dependents: [],
    name: candidate.name,
    visible: true,
    locked: false,
    layerId: candidate.source?.id ? objects[candidate.source.id]?.layerId : undefined,
    segments,
    style: candidate.source?.style ?? DEFAULT_GEOMETRY_STYLE,
    createdAt: now,
    updatedAt: now,
  } as CompoundRegionObject;
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

    if (/^[1-9]$/.test(event.key) && this.candidates.length > 1) {
      const index = parseInt(event.key, 10) - 1;
      if (index >= 0 && index < this.candidates.length) {
        this.candidateIndex = index;
        context.setHoveredObject(this.candidates[this.candidateIndex]?.source.id ?? null);
        event.preventDefault();
        return;
      }
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

    const region = createRegionFromBoundary(candidate, context.objects);

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
      // World path uses mathematical coords (Y-up). SVG uses screen coords (Y-down).
      // The path was generated with SVG sweep conventions already baked in by regionGeometry.ts
      // which computes sweep=1 for CW in math coords = CW in screen coords = correct.
      // We just need to scale radii and convert endpoint coords.
      const rx = Number(tokens[index + 1]) * context.viewport.scale;
      const ry = Number(tokens[index + 2]) * context.viewport.scale;
      const rotation = tokens[index + 3] ?? "0";
      const largeArc = tokens[index + 4] ?? "0";
      const sweep = tokens[index + 5] ?? "0"; // Do NOT flip: regionGeometry already uses SVG conventions
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
