"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTikzRoundTripTests = runTikzRoundTripTests;
const geometry_1 = require("../../core/geometry");
const tikz_1 = require("../../core/tikz");
const assert_1 = require("../assert");
function point(id, name, x, y) {
    return {
        createdAt: 1,
        dependencies: [],
        dependents: [],
        id,
        locked: false,
        name,
        pointKind: "free",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "point",
        updatedAt: 1,
        visible: true,
        x,
        y,
    };
}
function roundTrip(objects) {
    const code = (0, tikz_1.generateTikz)(objects, "academic").code;
    const parsed = (0, tikz_1.parseTikz)(code);
    if (parsed.issues.some((issue) => issue.severity === "error")) {
        throw new Error(`Generated TikZ should parse without errors: ${parsed.issues[0]?.message ?? "unknown"}`);
    }
    return parsed.objects;
}
function firstOfType(objects, type) {
    const object = objects.find((candidate) => candidate.type === type);
    if (!object) {
        throw new Error(`Expected parsed ${type} object.`);
    }
    return object;
}
function pointIdByName(objects, name) {
    const object = objects.find((candidate) => candidate.type === "point" && candidate.name === name);
    if (!object) {
        throw new Error(`Expected point ${name}.`);
    }
    return object.id;
}
function runTikzRoundTripTests() {
    assertPointRoundTrip();
    assertSegmentRoundTrip();
    assertLineRoundTrip();
    assertRayRoundTrip();
    assertVectorRoundTrip();
    assertCenterRadiusCircleRoundTrip();
    assertThreePointCircleRoundTrip();
    assertPolygonRoundTrip();
    assertRegionRoundTrip();
    assertAngleRoundTrip();
    assertArcRoundTrip();
    assertTextRoundTrip();
    assertMeasurementRoundTrip();
}
function assertPointRoundTrip() {
    const parsed = roundTrip({ a: point("a", "A", 2, 3) });
    const parsedPoint = firstOfType(parsed, "point");
    (0, assert_1.assertEqual)(parsedPoint.name, "A", "point round-trip preserves name");
    (0, assert_1.assertEqual)(parsedPoint.x, 2, "point round-trip preserves x");
    (0, assert_1.assertEqual)(parsedPoint.y, 3, "point round-trip preserves y");
    (0, assert_1.assert)(!parsed.some((object) => object.type === "circle"), "point markers do not parse as circles");
}
function assertSegmentRoundTrip() {
    const segment = {
        createdAt: 2,
        dependencies: ["a", "b"],
        dependents: [],
        endPointId: "b",
        id: "ab",
        locked: false,
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "segment",
        updatedAt: 2,
        visible: true,
    };
    const parsed = roundTrip({
        a: point("a", "A", 0, 0),
        ab: segment,
        b: point("b", "B", 4, 0),
    });
    const parsedSegment = firstOfType(parsed, "segment");
    (0, assert_1.assertEqual)(parsedSegment.startPointId, pointIdByName(parsed, "A"), "segment start dependency round-trips");
    (0, assert_1.assertEqual)(parsedSegment.endPointId, pointIdByName(parsed, "B"), "segment end dependency round-trips");
}
function assertLineRoundTrip() {
    const line = {
        createdAt: 2,
        dependencies: ["a", "b"],
        dependents: [],
        id: "line-ab",
        locked: false,
        pointAId: "a",
        pointBId: "b",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "line",
        updatedAt: 2,
        visible: true,
    };
    const parsed = roundTrip({
        a: point("a", "A", 0, 0),
        b: point("b", "B", 1, 0),
        "line-ab": line,
    });
    const parsedLine = firstOfType(parsed, "line");
    (0, assert_1.assertEqual)(parsedLine.pointAId, pointIdByName(parsed, "A"), "line first dependency round-trips");
    (0, assert_1.assertEqual)(parsedLine.pointBId, pointIdByName(parsed, "B"), "line second dependency round-trips");
}
function assertRayRoundTrip() {
    const ray = {
        createdAt: 2,
        dependencies: ["a", "b"],
        dependents: [],
        id: "ray-ab",
        locked: false,
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        throughPointId: "b",
        type: "ray",
        updatedAt: 2,
        visible: true,
    };
    const parsed = roundTrip({
        a: point("a", "A", 0, 0),
        b: point("b", "B", 1, 0),
        "ray-ab": ray,
    });
    const parsedRay = firstOfType(parsed, "ray");
    (0, assert_1.assertEqual)(parsedRay.startPointId, pointIdByName(parsed, "A"), "ray start dependency round-trips");
    (0, assert_1.assertEqual)(parsedRay.throughPointId, pointIdByName(parsed, "B"), "ray through dependency round-trips");
}
function assertVectorRoundTrip() {
    const vector = {
        createdAt: 2,
        dependencies: ["a", "b"],
        dependents: [],
        endPointId: "b",
        id: "vector-ab",
        locked: false,
        metadata: { arrowStyle: "latex" },
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "vector",
        updatedAt: 2,
        visible: true,
    };
    const parsed = roundTrip({
        a: point("a", "A", 0, 0),
        b: point("b", "B", 1, 0),
        "vector-ab": vector,
    });
    const parsedVector = firstOfType(parsed, "vector");
    (0, assert_1.assertEqual)(parsedVector.startPointId, pointIdByName(parsed, "A"), "vector start dependency round-trips");
    (0, assert_1.assertEqual)(parsedVector.endPointId, pointIdByName(parsed, "B"), "vector end dependency round-trips");
}
function assertCenterRadiusCircleRoundTrip() {
    const circle = {
        centerPointId: "o",
        circleKind: "center-radius",
        createdAt: 2,
        dependencies: ["o"],
        dependents: [],
        id: "circle-o",
        locked: false,
        radius: 2,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "circle",
        updatedAt: 2,
        visible: true,
    };
    const parsed = roundTrip({
        o: point("o", "O", 0, 0),
        "circle-o": circle,
    });
    const parsedCircle = firstOfType(parsed, "circle");
    (0, assert_1.assertEqual)(parsedCircle.circleKind, "center-radius", "center-radius circle kind round-trips");
}
function assertThreePointCircleRoundTrip() {
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
    const parsed = roundTrip({
        a: point("a", "A", 1, 0),
        b: point("b", "B", 0, 1),
        c: point("c", "C", -1, 0),
        "circle-abc": circle,
    });
    const parsedCircle = firstOfType(parsed, "circle");
    (0, assert_1.assertEqual)(parsedCircle.circleKind, "three-points", "three-point circle kind round-trips");
    (0, assert_1.assertEqual)(parsed.filter((object) => object.type === "point").length, 3, "three-point circle does not invent a center point");
}
function assertPolygonRoundTrip() {
    const polygon = {
        closed: true,
        createdAt: 2,
        dependencies: ["a", "b", "c"],
        dependents: [],
        id: "polygon-abc",
        locked: false,
        pointIds: ["a", "b", "c"],
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "polygon",
        updatedAt: 2,
        visible: true,
    };
    const parsed = roundTrip({
        a: point("a", "A", 0, 0),
        b: point("b", "B", 4, 0),
        c: point("c", "C", 0, 3),
        "polygon-abc": polygon,
    });
    (0, assert_1.assertEqual)(firstOfType(parsed, "polygon").pointIds.length, 3, "polygon boundary round-trips");
}
function assertRegionRoundTrip() {
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
    const parsed = roundTrip({
        a: point("a", "A", 0, 0),
        b: point("b", "B", 4, 0),
        c: point("c", "C", 0, 3),
        "region-abc": region,
    });
    (0, assert_1.assertEqual)(firstOfType(parsed, "region").boundaryPointIds.length, 3, "region boundary round-trips");
}
function assertAngleRoundTrip() {
    const angle = {
        createdAt: 2,
        dependencies: ["a", "b", "c"],
        dependents: [],
        id: "angle-abc",
        locked: false,
        pointAId: "a",
        pointCId: "c",
        radius: 0.6,
        showRightAngleMarker: false,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "angle",
        updatedAt: 2,
        vertexPointId: "b",
        visible: true,
    };
    const parsed = roundTrip({
        a: point("a", "A", 0, 1),
        b: point("b", "B", 0, 0),
        c: point("c", "C", 1, 0),
        "angle-abc": angle,
    });
    (0, assert_1.assertEqual)(firstOfType(parsed, "angle").vertexPointId, pointIdByName(parsed, "B"), "angle vertex round-trips");
}
function assertArcRoundTrip() {
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
    const parsed = roundTrip({
        a: point("a", "A", 1, 0),
        b: point("b", "B", 0, 1),
        o: point("o", "O", 0, 0),
        "arc-ab": arc,
    });
    const parsedArc = firstOfType(parsed, "arc");
    (0, assert_1.assertEqual)(parsedArc.centerPointId, pointIdByName(parsed, "O"), "arc center dependency round-trips");
    (0, assert_1.assertEqual)(parsedArc.startPointId, pointIdByName(parsed, "A"), "arc start dependency round-trips");
    (0, assert_1.assertEqual)(parsedArc.endPointId, pointIdByName(parsed, "B"), "arc end dependency round-trips");
}
function assertTextRoundTrip() {
    const text = {
        content: "$x^2+y^2$",
        createdAt: 2,
        dependencies: [],
        dependents: [],
        id: "text-a",
        locked: false,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        textMode: "math",
        type: "text",
        updatedAt: 2,
        visible: true,
        x: 2,
        y: 3,
    };
    const parsed = roundTrip({ "text-a": text });
    (0, assert_1.assertEqual)(firstOfType(parsed, "text").content, "x^2+y^2", "text content round-trips");
}
function assertMeasurementRoundTrip() {
    const segment = {
        createdAt: 2,
        dependencies: ["a", "b"],
        dependents: ["measure-ab"],
        endPointId: "b",
        id: "ab",
        locked: false,
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "segment",
        updatedAt: 2,
        visible: true,
    };
    const measurement = {
        createdAt: 3,
        dependencies: ["ab"],
        dependents: [],
        id: "measure-ab",
        labelPosition: "above",
        locked: false,
        measurementType: "segment-length",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        targetObjectId: "ab",
        type: "measurement",
        updatedAt: 3,
        visible: true,
    };
    const parsed = roundTrip({
        a: point("a", "A", 0, 0),
        ab: segment,
        b: point("b", "B", 4, 0),
        "measure-ab": measurement,
    });
    const parsedMeasurement = firstOfType(parsed, "measurement");
    (0, assert_1.assertEqual)(parsedMeasurement.measurementType, "segment-length", "measurement type round-trips");
    (0, assert_1.assertEqual)(parsedMeasurement.targetObjectId, firstOfType(parsed, "segment").id, "measurement target round-trips");
}
