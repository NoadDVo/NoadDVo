"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runVectorRendererTests = runVectorRendererTests;
const geometry_1 = require("../../core/geometry");
const ArcRenderer_1 = require("../../core/renderer/ArcRenderer");
const CircleRenderer_1 = require("../../core/renderer/CircleRenderer");
const RegionRenderer_1 = require("../../core/renderer/RegionRenderer");
const VectorRenderer_1 = require("../../core/renderer/VectorRenderer");
const assert_1 = require("../assert");
function point(id, x, y) {
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
function hasPropValue(node, propName, expected) {
    if (Array.isArray(node)) {
        return node.some((child) => hasPropValue(child, propName, expected));
    }
    if (typeof node !== "object" || node === null) {
        return false;
    }
    const props = node.props;
    if (!props) {
        return false;
    }
    return props[propName] === expected || hasPropValue(props.children, propName, expected);
}
function runVectorRendererTests() {
    assertVectorRenderer();
    assertThreePointCircleRenderer();
    assertArcRenderer();
    assertRegionRenderer();
}
function defaultViewport() {
    return {
        height: 100,
        offsetX: 0,
        offsetY: 0,
        scale: 10,
        width: 100,
    };
}
function assertVectorRenderer() {
    const vector = {
        createdAt: 2,
        dependencies: ["a", "b"],
        dependents: [],
        endPointId: "b",
        id: "vector-ab",
        locked: false,
        metadata: {
            arrowSize: 12,
            arrowStyle: "stealth",
        },
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "vector",
        updatedAt: 2,
        visible: true,
    };
    const objects = {
        a: point("a", 0, 0),
        b: point("b", 1, 0),
        "vector-ab": vector,
    };
    const rendered = VectorRenderer_1.VectorRenderer.render(vector, {
        hoveredObjectId: null,
        objects,
        selectedObjectIds: [],
        viewport: defaultViewport(),
    });
    (0, assert_1.assert)(hasPropValue(rendered, "markerEnd", "url(#ndv-vector-arrow-vector-ab)"), "vector renderer applies a per-vector arrow marker");
    (0, assert_1.assert)(hasPropValue(rendered, "id", "ndv-vector-arrow-vector-ab"), "vector renderer defines the configured arrow marker");
}
function assertThreePointCircleRenderer() {
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
    const objects = {
        a: point("a", 1, 0),
        b: point("b", 0, 1),
        c: point("c", -1, 0),
        "circle-abc": circle,
    };
    const rendered = CircleRenderer_1.CircleRenderer.render(circle, {
        hoveredObjectId: null,
        objects,
        selectedObjectIds: [],
        viewport: defaultViewport(),
    });
    (0, assert_1.assert)(hasPropValue(rendered, "r", 10), "three-point circle renderer computes screen radius");
}
function assertArcRenderer() {
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
    const objects = {
        a: point("a", 1, 0),
        b: point("b", 0, 1),
        o: point("o", 0, 0),
        "arc-ab": arc,
    };
    const rendered = ArcRenderer_1.ArcRenderer.render(arc, {
        hoveredObjectId: null,
        objects,
        selectedObjectIds: [],
        viewport: defaultViewport(),
    });
    (0, assert_1.assert)(hasPropValue(rendered, "data-object-type", "arc"), "arc renderer emits an arc object group");
}
function assertRegionRenderer() {
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
    const objects = {
        a: point("a", 0, 0),
        b: point("b", 4, 0),
        c: point("c", 0, 3),
        "region-abc": region,
    };
    const rendered = RegionRenderer_1.RegionRenderer.render(region, {
        hoveredObjectId: null,
        objects,
        selectedObjectIds: [],
        viewport: defaultViewport(),
    });
    (0, assert_1.assert)(hasPropValue(rendered, "data-object-type", "region"), "region renderer emits a region object group");
}
