"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fillTool = exports.FillTool = void 0;
exports.findFillablePolygon = findFillablePolygon;
exports.findExistingRegionForPolygon = findExistingRegionForPolygon;
exports.createRegionFromPolygon = createRegionFromPolygon;
exports.findExistingBoundaryRegion = findExistingBoundaryRegion;
const react_1 = require("react");
const geometry_1 = require("../geometry");
const BoundaryFillEngine_1 = require("../geometry/regions/BoundaryFillEngine");
const viewport_1 = require("../geometry/viewport");
const BaseTool_1 = require("./BaseTool");
let regionIdCounter = 0;
const PREVIEW_THROTTLE_MS = 48;
function sameBoundary(firstBoundary, secondBoundary) {
    return (firstBoundary.length === secondBoundary.length &&
        firstBoundary.every((pointId, index) => secondBoundary[index] === pointId));
}
function polygonContainsPoint(polygon, point, objects) {
    const points = (0, geometry_1.getPolygonPoints)(polygon, objects);
    return points ? (0, geometry_1.isPointInPolygon)(point, points) : false;
}
function polygonAreaMagnitude(polygon, objects) {
    const points = (0, geometry_1.getPolygonPoints)(polygon, objects);
    return points ? Math.abs((0, geometry_1.polygonArea)(points)) : Number.POSITIVE_INFINITY;
}
function createRegionId(source) {
    regionIdCounter += 1;
    return `region-${source.id}-${Date.now().toString(36)}-${regionIdCounter}`;
}
function createRegionName(polygon) {
    return polygon.name ? `Fill ${polygon.name}` : "Filled Region";
}
function findFillablePolygon(point, objects) {
    const polygons = Object.values(objects)
        .filter((object) => object.type === "polygon" &&
        object.visible &&
        !object.locked &&
        object.closed === true &&
        polygonContainsPoint(object, point, objects))
        .sort((first, second) => {
        const areaDelta = polygonAreaMagnitude(first, objects) - polygonAreaMagnitude(second, objects);
        return areaDelta === 0 ? first.id.localeCompare(second.id) : areaDelta;
    });
    return polygons[0] ?? null;
}
function findExistingRegionForPolygon(polygon, objects) {
    return (Object.values(objects).find((object) => object.type === "region" &&
        object.regionKind !== "boundary" &&
        sameBoundary(object.boundaryPointIds, polygon.pointIds)) ?? null);
}
function createRegionFromPolygon(polygon) {
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
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
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
function sameBoundaryLoop(firstEdges, secondEdges) {
    return (firstEdges.length === secondEdges.length &&
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
        }));
}
function findExistingBoundaryRegion(edges, objects) {
    return (Object.values(objects).find((object) => object.type === "region" &&
        object.regionKind === "boundary" &&
        Boolean(object.loops?.some((loop) => sameBoundaryLoop(loop.edges, edges)))) ?? null);
}
function createRegionFromBoundary(candidate) {
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
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
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
class FillTool extends BaseTool_1.BaseTool {
    candidateIndex = 0;
    candidates = [];
    diagnostics = [];
    lastPreviewUpdateAt = 0;
    pointerKey = null;
    constructor() {
        super({
            cursor: "cell",
            id: "fill",
            name: "Fill",
            shortcut: "F",
        });
    }
    activate(context) {
        super.activate(context);
        (0, BoundaryFillEngine_1.getSelectableBoundaryFaces)(context.pointerWorld, context.objects);
        this.candidateIndex = 0;
        this.candidates = [];
        this.diagnostics = [];
        this.lastPreviewUpdateAt = 0;
        this.pointerKey = null;
    }
    pointerDown(event, context) {
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
        if (!this.diagnostics.length) {
            context.setHoveredObject(null);
        }
    }
    pointerMove(event, context) {
        this.updateCandidates(event.worldPoint, context);
        const polygon = this.candidates.length > 0
            ? null
            : findFillablePolygon(event.worldPoint, context.objects);
        const existingRegion = polygon ? findExistingRegionForPolygon(polygon, context.objects) : null;
        const boundaryCandidate = this.candidates[this.candidateIndex] ?? null;
        const existingBoundaryRegion = boundaryCandidate
            ? findExistingBoundaryRegion(boundaryCandidate.loopEdges, context.objects)
            : null;
        context.setHoveredObject(existingRegion?.id ??
            polygon?.id ??
            existingBoundaryRegion?.id ??
            boundaryCandidate?.source.id ??
            null);
    }
    keyDown(event, context) {
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
    cancel(context) {
        this.clearPreview(context);
        super.cancel(context);
    }
    renderPreview(context) {
        const candidate = this.candidates[this.candidateIndex];
        if (!candidate) {
            return this.diagnostics.length > 0
                ? renderDiagnosticLabel(this.diagnostics[0] ?? "No closed region found", context.pointerWorld, context)
                : null;
        }
        const previewRegion = {
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
                ...geometry_1.DEFAULT_GEOMETRY_STYLE,
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
        const boundary = (0, geometry_1.getRegionBoundaryPath)(previewRegion, context.objects);
        if (!boundary) {
            return null;
        }
        const labelPoint = (0, viewport_1.worldToScreen)(candidate.centroid, context.viewport);
        const path = boundary.kind === "polygon"
            ? boundary.points.map((point, index) => {
                const screen = (0, viewport_1.worldToScreen)(point, context.viewport);
                return `${index === 0 ? "M" : "L"} ${screen.x} ${screen.y}`;
            }).join(" ") + " Z"
            : worldPathToScreenPath(boundary.path, context);
        const label = this.candidates.length > 1
            ? `Region ${this.candidateIndex + 1} of ${this.candidates.length}`
            : "Region";
        const diagnostic = this.diagnostics[0];
        return (0, react_1.createElement)("g", { "data-fill-preview": "true" }, (0, react_1.createElement)("path", {
            d: path,
            fill: "#7ddcff",
            fillOpacity: 0.2,
            stroke: "#7ddcff",
            strokeDasharray: "8 5",
            strokeLinejoin: "round",
            strokeOpacity: 0.95,
            strokeWidth: 2,
        }), (0, react_1.createElement)("text", {
            fill: "#e5f8ff",
            fontSize: 12,
            fontWeight: 800,
            paintOrder: "stroke",
            stroke: "#06202a",
            strokeWidth: 4,
            x: labelPoint.x + 10,
            y: labelPoint.y - 10,
        }, diagnostic ? `${label} - ${diagnostic}` : label));
    }
    updateCandidates(point, context, options = {}) {
        const previousPointerKey = this.pointerKey;
        const nextPointerKey = pointKey(point);
        const now = Date.now();
        if (!options.force &&
            previousPointerKey !== null &&
            previousPointerKey !== nextPointerKey &&
            now - this.lastPreviewUpdateAt < PREVIEW_THROTTLE_MS) {
            return;
        }
        this.pointerKey = nextPointerKey;
        this.lastPreviewUpdateAt = now;
        const result = (0, BoundaryFillEngine_1.getSelectableBoundaryFaces)(point, context.objects);
        this.candidates = result.candidates.map(faceToCandidate);
        this.diagnostics = result.diagnostics.map((diagnostic) => diagnostic.message);
        this.candidateIndex = previousPointerKey === this.pointerKey
            ? Math.min(this.candidateIndex, Math.max(0, this.candidates.length - 1))
            : 0;
        if (this.candidates.length > 0) {
            this.transitionState("preview", "preview");
        }
        else {
            this.transitionState("waitingInput", "await-input");
        }
    }
    clearPreview(context) {
        this.candidateIndex = 0;
        this.candidates = [];
        this.diagnostics = [];
        this.lastPreviewUpdateAt = 0;
        this.pointerKey = null;
        context.setHoveredObject(null);
        this.transitionState("waitingInput", "await-input");
    }
    commitCandidate(candidate, context) {
        const existingBoundaryRegion = findExistingBoundaryRegion(candidate.loopEdges, context.objects);
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
exports.FillTool = FillTool;
exports.fillTool = new FillTool();
function faceToCandidate(face) {
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
function pointKey(point) {
    return `${point.x.toFixed(4)},${point.y.toFixed(4)}`;
}
function renderDiagnosticLabel(message, point, context) {
    const screen = (0, viewport_1.worldToScreen)(point, context.viewport);
    return (0, react_1.createElement)("text", {
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
function worldPathToScreenPath(path, context) {
    const tokens = path.match(/[A-Za-z]|-?\d+(?:\.\d+)?/g) ?? [];
    const output = [];
    let index = 0;
    while (index < tokens.length) {
        const token = tokens[index];
        if (token === "M" || token === "L") {
            const x = Number(tokens[index + 1]);
            const y = Number(tokens[index + 2]);
            const screen = (0, viewport_1.worldToScreen)({ x, y }, context.viewport);
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
            const screen = (0, viewport_1.worldToScreen)({ x, y }, context.viewport);
            output.push("A", String(rx), String(ry), rotation, largeArc, sweep, String(screen.x), String(screen.y));
            index += 8;
            continue;
        }
        output.push(token ?? "");
        index += 1;
    }
    return output.join(" ");
}
