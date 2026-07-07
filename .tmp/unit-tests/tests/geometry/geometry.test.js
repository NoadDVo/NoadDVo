"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGeometryTests = runGeometryTests;
const geometry_1 = require("../../core/geometry");
const viewport_1 = require("../../core/geometry/viewport");
const ToolManager_1 = require("../../core/tools/ToolManager");
const assert_1 = require("../assert");
function createPoint(id, x, y) {
    return {
        createdAt: 1,
        dependencies: [],
        dependents: [],
        id,
        locked: false,
        pointKind: "free",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "point",
        updatedAt: 1,
        visible: true,
        x,
        y,
    };
}
function runGeometryTests() {
    const pointA = createPoint("a", 0, 0);
    const pointB = createPoint("b", 3, 4);
    const center = (0, geometry_1.midpoint)(pointA, pointB);
    const validation = (0, geometry_1.validateGeometryObject)(pointA, { a: pointA });
    (0, assert_1.assertEqual)((0, geometry_1.distance)(pointA, pointB), 5, "distance computes a 3-4-5 triangle");
    (0, assert_1.assertEqual)(center.x, 1.5, "midpoint x is averaged");
    (0, assert_1.assertEqual)(center.y, 2, "midpoint y is averaged");
    (0, assert_1.assertEqual)((0, geometry_1.polygonArea)([pointA, pointB, createPoint("c", 0, 4)]), 6, "polygon area is signed");
    (0, assert_1.assert)(validation.valid, "valid point passes validation");
    assertViewportConversionsAreInverse();
    assertRayValidationAndClipping();
    assertRayDependencyMetadata();
    assertVectorValidation();
    assertVectorDependencyMetadata();
    assertTextValidation();
    assertTextDependencyMetadata();
    assertThreePointCircleGeometry();
    assertArcValidationAndDependencies();
    assertRegionValidationAndDependencies();
    assertAdvancedConstructionRecomputation();
    assertAdvancedConstructionToolsAreRegistered();
}
function assertViewportConversionsAreInverse() {
    const viewport = {
        height: 420.25,
        offsetX: -32.5,
        offsetY: 18.75,
        scale: 67.25,
        width: 719.5,
    };
    const worldPoint = { x: 2.375, y: -1.625 };
    const screenPoint = (0, viewport_1.worldToScreen)(worldPoint, viewport);
    const converted = (0, viewport_1.screenToWorld)(screenPoint, viewport);
    (0, assert_1.assert)(Math.abs(converted.x - worldPoint.x) < 1e-9, "worldToScreen/screenToWorld preserve x");
    (0, assert_1.assert)(Math.abs(converted.y - worldPoint.y) < 1e-9, "worldToScreen/screenToWorld preserve y");
}
function createRay(startPointId, throughPointId) {
    return {
        createdAt: 2,
        dependencies: [startPointId, throughPointId],
        dependents: [],
        id: "ray-ab",
        locked: false,
        startPointId,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        throughPointId,
        type: "ray",
        updatedAt: 2,
        visible: true,
    };
}
function assertRayValidationAndClipping() {
    const pointA = createPoint("a", 0, 0);
    const pointB = createPoint("b", 1, 0);
    const validRay = createRay("a", "b");
    const invalidRay = createRay("a", "a");
    const bounds = {
        maxX: 10,
        maxY: 10,
        minX: -10,
        minY: -10,
    };
    const clipped = (0, viewport_1.clipRayToBounds)(pointA, pointB, bounds);
    (0, assert_1.assert)((0, geometry_1.validateGeometryObject)(validRay, { a: pointA, b: pointB }).valid, "ray validates distinct points");
    (0, assert_1.assert)(!(0, geometry_1.validateGeometryObject)(invalidRay, { a: pointA }).valid, "ray rejects duplicate endpoints");
    (0, assert_1.assert)(clipped !== null, "ray clips to viewport bounds");
    (0, assert_1.assertEqual)(clipped?.[0].x, 0, "ray clipping starts at ray origin");
    (0, assert_1.assertEqual)(clipped?.[1].x, 10, "ray clipping extends to positive x bound");
}
function assertRayDependencyMetadata() {
    const pointA = createPoint("a", 0, 0);
    const pointB = createPoint("b", 1, 0);
    const ray = createRay("a", "b");
    const objects = (0, geometry_1.normalizeDependencyMetadata)({
        a: pointA,
        b: pointB,
        "ray-ab": ray,
    });
    const movedObjects = {
        ...objects,
        a: { ...pointA, updatedAt: 3, x: 2 },
    };
    const propagated = (0, geometry_1.propagateGeometryUpdates)(movedObjects, "a");
    (0, assert_1.assert)(objects.a?.dependents.includes("ray-ab"), "ray depends on start point");
    (0, assert_1.assert)(objects.b?.dependents.includes("ray-ab"), "ray depends on through point");
    (0, assert_1.assert)(propagated.valid, "ray dependency propagation remains valid");
    (0, assert_1.assert)(propagated.valid && (propagated.objects["ray-ab"]?.updatedAt ?? 0) > ray.updatedAt, "ray dependent metadata updates when endpoint moves");
}
function createVector(startPointId, endPointId) {
    return {
        createdAt: 2,
        dependencies: [startPointId, endPointId],
        dependents: [],
        endPointId,
        id: "vector-ab",
        locked: false,
        startPointId,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "vector",
        updatedAt: 2,
        visible: true,
    };
}
function assertVectorValidation() {
    const pointA = createPoint("a", 0, 0);
    const pointB = createPoint("b", 2, 0);
    const validVector = createVector("a", "b");
    const invalidVector = createVector("a", "a");
    (0, assert_1.assert)((0, geometry_1.validateGeometryObject)(validVector, { a: pointA, b: pointB }).valid, "vector validates distinct points");
    (0, assert_1.assert)(!(0, geometry_1.validateGeometryObject)(invalidVector, { a: pointA }).valid, "vector rejects duplicate endpoints");
}
function assertVectorDependencyMetadata() {
    const pointA = createPoint("a", 0, 0);
    const pointB = createPoint("b", 2, 0);
    const vector = createVector("a", "b");
    const objects = (0, geometry_1.normalizeDependencyMetadata)({
        a: pointA,
        b: pointB,
        "vector-ab": vector,
    });
    const movedObjects = {
        ...objects,
        b: { ...pointB, updatedAt: 3, x: 4 },
    };
    const propagated = (0, geometry_1.propagateGeometryUpdates)(movedObjects, "b");
    (0, assert_1.assert)(objects.a?.dependents.includes("vector-ab"), "vector depends on start point");
    (0, assert_1.assert)(objects.b?.dependents.includes("vector-ab"), "vector depends on end point");
    (0, assert_1.assert)(propagated.valid, "vector dependency propagation remains valid");
    (0, assert_1.assert)(propagated.valid && (propagated.objects["vector-ab"]?.updatedAt ?? 0) > vector.updatedAt, "vector dependent metadata updates when endpoint moves");
}
function createText(id, x, y) {
    return {
        content: "Hello",
        createdAt: 2,
        dependencies: [],
        dependents: [],
        id,
        locked: false,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        textMode: "plain",
        type: "text",
        updatedAt: 2,
        visible: true,
        x,
        y,
    };
}
function assertTextValidation() {
    const text = createText("text-a", 1, 2);
    const invalidText = createText("text-b", Number.NaN, 2);
    (0, assert_1.assert)((0, geometry_1.validateGeometryObject)(text, {}).valid, "text validates finite position");
    (0, assert_1.assert)(!(0, geometry_1.validateGeometryObject)(invalidText, {}).valid, "text rejects invalid position");
}
function assertTextDependencyMetadata() {
    const pointA = createPoint("a", 1, 1);
    const text = {
        ...createText("text-a", 0.25, 0.5),
        dependencies: ["a"],
        metadata: {
            followObject: true,
        },
    };
    const objects = (0, geometry_1.normalizeDependencyMetadata)({
        a: pointA,
        "text-a": text,
    });
    const propagated = (0, geometry_1.propagateGeometryUpdates)({
        ...objects,
        a: { ...pointA, updatedAt: 3, x: 2 },
    }, "a");
    (0, assert_1.assert)(objects.a?.dependents.includes("text-a"), "text may depend on an attached point");
    (0, assert_1.assert)(propagated.valid, "text dependency propagation remains valid");
    (0, assert_1.assert)(propagated.valid && (propagated.objects["text-a"]?.updatedAt ?? 0) > text.updatedAt, "text dependent metadata updates when attachment moves");
}
function assertThreePointCircleGeometry() {
    const pointA = createPoint("a", 1, 0);
    const pointB = createPoint("b", 0, 1);
    const pointC = createPoint("c", -1, 0);
    const circle = {
        circleKind: "three-points",
        createdAt: 2,
        dependencies: ["a", "b", "c"],
        dependents: [],
        id: "circle-abc",
        locked: false,
        pointAId: "a",
        pointBId: "b",
        pointCId: "c",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "circle",
        updatedAt: 2,
        visible: true,
    };
    const objects = { a: pointA, b: pointB, c: pointC, "circle-abc": circle };
    const geometry = (0, geometry_1.getCircleGeometry)(circle, objects);
    (0, assert_1.assert)((0, geometry_1.validateGeometryObject)(circle, objects).valid, "three-point circle validates non-collinear points");
    (0, assert_1.assertEqual)(geometry?.center.x, 0, "three-point circle computes center x");
    (0, assert_1.assertEqual)(geometry?.center.y, 0, "three-point circle computes center y");
    (0, assert_1.assertEqual)(geometry?.radius, 1, "three-point circle computes radius");
}
function assertArcValidationAndDependencies() {
    const arc = {
        centerPointId: "o",
        createdAt: 2,
        dependencies: ["o", "a", "b"],
        dependents: [],
        direction: "counterclockwise",
        endPointId: "b",
        id: "arc-ab",
        locked: false,
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "arc",
        updatedAt: 2,
        visible: true,
    };
    const objects = (0, geometry_1.normalizeDependencyMetadata)({
        a: createPoint("a", 1, 0),
        b: createPoint("b", 0, 1),
        o: createPoint("o", 0, 0),
        "arc-ab": arc,
    });
    const propagated = (0, geometry_1.propagateGeometryUpdates)({
        ...objects,
        a: { ...objects.a, updatedAt: 3, x: 0, y: -1 },
    }, "a");
    (0, assert_1.assert)((0, geometry_1.validateGeometryObject)(arc, objects).valid, "arc validates center/start/end points on same radius");
    (0, assert_1.assert)(objects.o?.dependents.includes("arc-ab"), "arc depends on center point");
    (0, assert_1.assert)(objects.a?.dependents.includes("arc-ab"), "arc depends on start point");
    (0, assert_1.assert)(propagated.valid, "arc dependency propagation remains valid");
    (0, assert_1.assert)(propagated.valid && (propagated.objects["arc-ab"]?.updatedAt ?? 0) > arc.updatedAt, "arc metadata updates when an endpoint moves");
}
function assertRegionValidationAndDependencies() {
    const region = {
        boundaryPointIds: ["a", "b", "c"],
        createdAt: 2,
        dependencies: ["a", "b", "c"],
        dependents: [],
        id: "region-abc",
        locked: false,
        style: { ...geometry_1.DEFAULT_GEOMETRY_STYLE, fill: "#7ddcff", fillOpacity: 0.2 },
        type: "region",
        updatedAt: 2,
        visible: true,
    };
    const objects = (0, geometry_1.normalizeDependencyMetadata)({
        a: createPoint("a", 0, 0),
        b: createPoint("b", 4, 0),
        c: createPoint("c", 0, 3),
        "region-abc": region,
    });
    const propagated = (0, geometry_1.propagateGeometryUpdates)({
        ...objects,
        c: { ...objects.c, updatedAt: 3, y: 4 },
    }, "c");
    (0, assert_1.assert)((0, geometry_1.validateGeometryObject)(region, objects).valid, "region validates polygonal boundary");
    (0, assert_1.assert)(objects.a?.dependents.includes("region-abc"), "region depends on boundary points");
    (0, assert_1.assert)(propagated.valid, "region dependency propagation remains valid");
    (0, assert_1.assert)(propagated.valid && (propagated.objects["region-abc"]?.updatedAt ?? 0) > region.updatedAt, "region metadata updates when a boundary point moves");
}
function assertAdvancedConstructionRecomputation() {
    const objects = {
        a: createPoint("a", 0, 0),
        b: createPoint("b", 2, 0),
        c: createPoint("c", 0, 2),
        p: createPoint("p", 1, 1),
    };
    const perpendicularBisectorPoint = (0, geometry_1.recomputeConstructedPoint)({ pointAId: "a", pointBId: "b", type: "perpendicular-bisector-point" }, objects);
    const angleBisectorPoint = (0, geometry_1.recomputeConstructedPoint)({
        pointAId: "b",
        pointCId: "c",
        type: "angle-bisector-point",
        vertexPointId: "a",
    }, objects);
    const projectionPoint = (0, geometry_1.recomputeConstructedPoint)({
        linePointAId: "a",
        linePointBId: "b",
        pointId: "p",
        type: "projection-point",
    }, objects);
    const incenter = (0, geometry_1.recomputeConstructedPoint)({
        pointAId: "a",
        pointBId: "b",
        pointCId: "c",
        type: "incenter",
    }, objects);
    (0, assert_1.assertEqual)(perpendicularBisectorPoint?.x, 1, "perpendicular bisector helper x is recomputed");
    (0, assert_1.assertEqual)(perpendicularBisectorPoint?.y, 2, "perpendicular bisector helper y is recomputed");
    (0, assert_1.assertEqual)(angleBisectorPoint?.x, 1, "angle bisector helper x is recomputed");
    (0, assert_1.assertEqual)(angleBisectorPoint?.y, 1, "angle bisector helper y is recomputed");
    (0, assert_1.assertEqual)(projectionPoint?.x, 1, "altitude projection x is recomputed");
    (0, assert_1.assertEqual)(projectionPoint?.y, 0, "altitude projection y is recomputed");
    (0, assert_1.assertEqual)(Number(incenter?.x.toFixed(6)), 0.585786, "incenter x is recomputed");
    (0, assert_1.assertEqual)(Number(incenter?.y.toFixed(6)), 0.585786, "incenter y is recomputed");
}
function assertAdvancedConstructionToolsAreRegistered() {
    const expectedTools = [
        "perpendicular-bisector",
        "angle-bisector",
        "median",
        "altitude",
        "circumcircle",
        "incircle",
        "fill",
    ];
    expectedTools.forEach((toolId) => {
        (0, assert_1.assertEqual)(ToolManager_1.toolManager.getTool(toolId).id, toolId, `${toolId} tool is registered`);
    });
}
