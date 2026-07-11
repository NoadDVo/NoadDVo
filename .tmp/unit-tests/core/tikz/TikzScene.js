"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTikzScene = buildTikzScene;
const objectOrder = {
    region: 10,
    line: 20,
    segment: 30,
    ray: 40,
    vector: 50,
    circle: 60,
    arc: 70,
    polygon: 80,
    angle: 90,
    point: 100,
    text: 110,
    image: 115,
    measurement: 120,
};
function buildTikzScene(objects, options) {
    const orderedObjects = Object.values(objects)
        .filter((object) => options.showHiddenObjects || object.visible)
        .sort((a, b) => {
        const orderDelta = objectOrder[a.type] - objectOrder[b.type];
        if (orderDelta !== 0) {
            return orderDelta;
        }
        const createdDelta = a.createdAt - b.createdAt;
        return createdDelta === 0 ? a.id.localeCompare(b.id) : createdDelta;
    });
    const points = orderedObjects.filter((object) => object.type === "point");
    return {
        objects,
        orderedObjects,
        points,
        sections: {
            coordinates: [],
            fills: [],
            labels: [],
            measurements: [],
            points: [],
            shapes: [],
        },
    };
}
