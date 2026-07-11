"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjectAtPoint = getObjectAtPoint;
exports.getObjectIdsInSelectionBox = getObjectIdsInSelectionBox;
exports.getVisibleObjectIds = getVisibleObjectIds;
const BoundingBox_1 = require("./BoundingBox");
const HitTest_1 = require("./HitTest");
function getObjectAtPoint(screenPoint, worldPoint, objects, viewport) {
    return (0, HitTest_1.hitTest)(screenPoint, worldPoint, objects, viewport)?.object ?? null;
}
function getObjectIdsInSelectionBox(start, end, objects) {
    const selectionBox = (0, BoundingBox_1.boxFromCorners)(start, end);
    return Object.values(objects)
        .filter((object) => object.visible)
        .filter((object) => {
        const boundingBox = (0, BoundingBox_1.getBoundingBox)(object, objects);
        return boundingBox ? (0, BoundingBox_1.boxIntersectsBox)(selectionBox, boundingBox) : false;
    })
        .map((object) => object.id);
}
function getVisibleObjectIds(objects) {
    return Object.values(objects)
        .filter((object) => object.visible)
        .map((object) => object.id);
}
