"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPointFromHit = getPointFromHit;
exports.resolveTwoPointSnap = resolveTwoPointSnap;
exports.hoverHitObject = hoverHitObject;
exports.resolveFirstEndpoint = resolveFirstEndpoint;
exports.resolveFinalEndpoint = resolveFinalEndpoint;
const geometry_1 = require("../geometry");
const HitTest_1 = require("../selection/HitTest");
const PointTool_1 = require("./PointTool");
function getPointFromHit(event, context) {
    const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
    return hit?.object.type === "point" ? hit.object : null;
}
function resolveTwoPointSnap(event, context) {
    return getPointFromHit(event, context) ?? event.snappedWorldPoint;
}
function hoverHitObject(event, context) {
    const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
    context.setHoveredObject(hit?.objectId ?? null);
}
function resolveFirstEndpoint(event, context, history) {
    const existingPoint = getPointFromHit(event, context);
    if (existingPoint) {
        context.selectObject(existingPoint.id);
        context.setHoveredObject(existingPoint.id);
        return { point: existingPoint };
    }
    const point = (0, PointTool_1.createNamedFreePoint)(event.snappedWorldPoint, context.objects);
    history.ensure(context);
    if (!context.addObject(point)) {
        history.cancel(context);
        return null;
    }
    context.selectObject(point.id);
    return { point };
}
function resolveFinalEndpoint({ context, event, history, objects, startPoint, }) {
    const existingPoint = getPointFromHit(event, context);
    const worldPoint = existingPoint ?? event.snappedWorldPoint;
    if (startPoint.id === existingPoint?.id || (0, geometry_1.pointsAlmostEqual)(startPoint, worldPoint)) {
        return null;
    }
    const endpoint = existingPoint ?? (0, PointTool_1.createNamedFreePoint)(worldPoint, objects);
    history.ensure(context);
    if (!existingPoint && !context.addObject(endpoint)) {
        history.commit(context);
        return null;
    }
    return endpoint;
}
