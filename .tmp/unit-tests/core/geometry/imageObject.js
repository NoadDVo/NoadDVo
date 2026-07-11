"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReferenceImageObject = createReferenceImageObject;
const types_1 = require("./types");
let imageIdCounter = 0;
function createReferenceImageObject({ height = 4, mimeType, name = "Reference Image", position, src, width = 6, }) {
    const now = Date.now();
    imageIdCounter += 1;
    return {
        createdAt: now,
        dependencies: [],
        dependents: [],
        height,
        id: `image-${Date.now().toString(36)}-${imageIdCounter}`,
        locked: false,
        mimeType,
        name,
        opacity: 0.45,
        preserveAspectRatio: true,
        src,
        style: {
            ...types_1.DEFAULT_GEOMETRY_STYLE,
            fillOpacity: 0,
            stroke: "#7ddcff",
            strokeOpacity: 0.7,
            strokeWidth: 1,
        },
        type: "image",
        updatedAt: now,
        visible: true,
        width,
        x: position.x,
        y: position.y,
    };
}
