"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExampleObjects = getExampleObjects;
const geometry_1 = require("../../core/geometry");
function baseObject(id, type, name, dependencies, dependents) {
    return {
        createdAt: 0,
        dependencies,
        dependents,
        id,
        locked: false,
        name,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type,
        updatedAt: 0,
        visible: true,
    };
}
const sampleSceneObjects = [
    {
        ...baseObject("point-a", "point", "A", [], [
            "segment-ab",
            "triangle-abc",
            "circle-a-through-b",
        ]),
        pointKind: "free",
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            fill: "#0b0f14",
            pointSize: 5,
            stroke: "#0b0f14",
            strokeWidth: 2,
        },
        x: -2,
        y: -1,
    },
    {
        ...baseObject("point-b", "point", "B", [], [
            "segment-ab",
            "triangle-abc",
            "circle-a-through-b",
        ]),
        pointKind: "free",
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            fill: "#0b0f14",
            pointSize: 5,
            stroke: "#0b0f14",
            strokeWidth: 2,
        },
        x: 3,
        y: -1,
    },
    {
        ...baseObject("point-c", "point", "C", [], ["triangle-abc"]),
        pointKind: "free",
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            fill: "#0b0f14",
            pointSize: 5,
            stroke: "#0b0f14",
            strokeWidth: 2,
        },
        x: 0.5,
        y: 2.6,
    },
    {
        ...baseObject("segment-ab", "segment", "AB", ["point-a", "point-b"], []),
        endPointId: "point-b",
        startPointId: "point-a",
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            stroke: "#0b0f14",
            strokeOpacity: 0.95,
            strokeWidth: 2,
        },
    },
    {
        ...baseObject("triangle-abc", "polygon", "Triangle ABC", ["point-a", "point-b", "point-c"], []),
        closed: true,
        pointIds: ["point-a", "point-b", "point-c"],
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            fill: "transparent",
            fillOpacity: 0,
            stroke: "#0b0f14",
            strokeOpacity: 1,
            strokeWidth: 2,
        },
    },
    {
        ...baseObject("circle-a-through-b", "circle", "Circle A,B", ["point-a", "point-b"], []),
        centerPointId: "point-a",
        circleKind: "center-point",
        radiusPointId: "point-b",
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            stroke: "#0b0f14",
            strokeOpacity: 1,
            strokeWidth: 2,
        },
    },
];
const circleExampleObjects = [
    {
        ...baseObject("circle-center", "point", "O", [], ["circle-radius"]),
        pointKind: "free",
        x: 0,
        y: 0,
    },
    {
        ...baseObject("circle-radius-point", "point", "A", [], ["circle-radius"]),
        pointKind: "free",
        x: 3,
        y: 0,
    },
    {
        ...baseObject("circle-radius", "circle", "c1", ["circle-center", "circle-radius-point"], []),
        centerPointId: "circle-center",
        circleKind: "center-point",
        radiusPointId: "circle-radius-point",
    },
];
const coordinateExampleObjects = [
    {
        ...baseObject("coord-a", "point", "A", [], ["coord-ab"]),
        pointKind: "free",
        x: -4,
        y: -2,
    },
    {
        ...baseObject("coord-b", "point", "B", [], ["coord-ab"]),
        pointKind: "free",
        x: 3,
        y: 2,
    },
    {
        ...baseObject("coord-ab", "segment", "AB", ["coord-a", "coord-b"], []),
        endPointId: "coord-b",
        startPointId: "coord-a",
    },
];
const olympiadExampleObjects = [
    ...sampleSceneObjects,
    {
        ...baseObject("olympiad-d", "point", "D", [], ["olympiad-cd"]),
        pointKind: "free",
        x: 0.5,
        y: -1,
    },
    {
        ...baseObject("olympiad-cd", "segment", "CD", ["point-c", "olympiad-d"], []),
        endPointId: "olympiad-d",
        startPointId: "point-c",
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            dash: "dashed",
            stroke: "#747b84",
            strokeWidth: 1.5,
        },
    },
];
function getExampleObjects(exampleId) {
    if (exampleId === "circle") {
        return circleExampleObjects;
    }
    if (exampleId === "coordinate") {
        return coordinateExampleObjects;
    }
    if (exampleId === "olympiad") {
        return olympiadExampleObjects;
    }
    return sampleSceneObjects;
}
