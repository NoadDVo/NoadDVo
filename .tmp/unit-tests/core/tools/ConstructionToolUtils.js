"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHitObject = getHitObject;
exports.getHitPoint = getHitPoint;
exports.getHitLine = getHitLine;
exports.getHitIntersectionSource = getHitIntersectionSource;
exports.createConstructionId = createConstructionId;
exports.createConstructionLine = createConstructionLine;
exports.createConstructionCircle = createConstructionCircle;
exports.createThreePointConstructionCircle = createThreePointConstructionCircle;
exports.hasLineWithEndpoints = hasLineWithEndpoints;
const geometry_1 = require("../geometry");
const HitTest_1 = require("../selection/HitTest");
let constructionIdCounter = 0;
function getHitObject(event, context) {
    return ((0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport)
        ?.object ?? null);
}
function getHitPoint(event, context) {
    const object = getHitObject(event, context);
    return object?.type === "point" ? object : null;
}
function getHitLine(event, context) {
    const object = getHitObject(event, context);
    return object?.type === "line" ? object : null;
}
function getHitIntersectionSource(event, context) {
    const object = getHitObject(event, context);
    if (object?.type === "line" ||
        object?.type === "segment" ||
        object?.type === "circle") {
        return object;
    }
    return null;
}
function createConstructionId(prefix) {
    constructionIdCounter += 1;
    return `${prefix}-${Date.now().toString(36)}-${constructionIdCounter}`;
}
function createConstructionLine(pointA, pointB, name) {
    const now = Date.now();
    return {
        createdAt: now,
        dependencies: [pointA.id, pointB.id],
        dependents: [],
        id: createConstructionId("line-construction"),
        locked: false,
        name,
        pointAId: pointA.id,
        pointBId: pointB.id,
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            dash: "dashed",
            stroke: "#747b84",
            strokeOpacity: 0.72,
            strokeWidth: 1.4,
        },
        type: "line",
        updatedAt: now,
        visible: true,
    };
}
function createConstructionCircle(centerPoint, radiusPoint, name) {
    const now = Date.now();
    return {
        centerPointId: centerPoint.id,
        circleKind: "center-point",
        createdAt: now,
        dependencies: [centerPoint.id, radiusPoint.id],
        dependents: [],
        id: createConstructionId("circle-construction"),
        locked: false,
        name,
        radiusPointId: radiusPoint.id,
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            stroke: "#747b84",
            strokeOpacity: 0.86,
            strokeWidth: 1.6,
        },
        type: "circle",
        updatedAt: now,
        visible: true,
    };
}
function createThreePointConstructionCircle(pointA, pointB, pointC, name) {
    const now = Date.now();
    return {
        circleKind: "three-points",
        createdAt: now,
        dependencies: [pointA.id, pointB.id, pointC.id],
        dependents: [],
        id: createConstructionId("circle-construction"),
        locked: false,
        name,
        pointAId: pointA.id,
        pointBId: pointB.id,
        pointCId: pointC.id,
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            stroke: "#747b84",
            strokeOpacity: 0.86,
            strokeWidth: 1.6,
        },
        type: "circle",
        updatedAt: now,
        visible: true,
    };
}
function hasLineWithEndpoints(pointAId, pointBId, objects) {
    return Object.values(objects).some((object) => object.type === "line" &&
        ((object.pointAId === pointAId && object.pointBId === pointBId) ||
            (object.pointAId === pointBId && object.pointBId === pointAId)));
}
