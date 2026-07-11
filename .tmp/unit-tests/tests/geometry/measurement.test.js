"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMeasurementTests = runMeasurementTests;
const geometry_1 = require("../../core/geometry");
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
function measurement(type, targetObjectId) {
    return {
        createdAt: 2,
        dependencies: [targetObjectId],
        dependents: [],
        id: `measurement-${type}`,
        labelPosition: "above",
        locked: false,
        measurementType: type,
        precision: 2,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        targetObjectId,
        type: "measurement",
        updatedAt: 2,
        visible: true,
    };
}
function runMeasurementTests() {
    assertSegmentLength();
    assertPolygonMeasurements();
    assertCircleMeasurements();
    assertThreePointCircleMeasurements();
    assertArcMeasurement();
    assertRegionMeasurement();
    assertAngleMeasurement();
    assertMeasurementDependencyUpdate();
}
function assertSegmentLength() {
    const segment = {
        createdAt: 1,
        dependencies: ["a", "b"],
        dependents: [],
        endPointId: "b",
        id: "ab",
        locked: false,
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "segment",
        updatedAt: 1,
        visible: true,
    };
    const objects = { a: point("a", 0, 0), ab: segment, b: point("b", 3, 4) };
    (0, assert_1.assertEqual)((0, geometry_1.measureValue)(measurement("segment-length", "ab"), objects), 5, "segment length is dynamic");
}
function assertPolygonMeasurements() {
    const polygon = {
        closed: true,
        createdAt: 1,
        dependencies: ["a", "b", "c"],
        dependents: [],
        id: "triangle",
        locked: false,
        pointIds: ["a", "b", "c"],
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "polygon",
        updatedAt: 1,
        visible: true,
    };
    const objects = {
        a: point("a", 0, 0),
        b: point("b", 4, 0),
        c: point("c", 0, 3),
        triangle: polygon,
    };
    (0, assert_1.assertEqual)((0, geometry_1.measureValue)(measurement("polygon-area", "triangle"), objects), 6, "polygon area is measured");
    (0, assert_1.assertEqual)((0, geometry_1.measureValue)(measurement("polygon-perimeter", "triangle"), objects), 12, "polygon perimeter is measured");
}
function assertCircleMeasurements() {
    const circle = {
        centerPointId: "o",
        circleKind: "center-radius",
        createdAt: 1,
        dependencies: ["o"],
        dependents: [],
        id: "circle-o",
        locked: false,
        radius: 3,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "circle",
        updatedAt: 1,
        visible: true,
    };
    const objects = { "circle-o": circle, o: point("o", 0, 0) };
    (0, assert_1.assertEqual)((0, geometry_1.measureValue)(measurement("circle-radius", "circle-o"), objects), 3, "circle radius is measured");
    (0, assert_1.assertEqual)((0, geometry_1.measureValue)(measurement("circle-diameter", "circle-o"), objects), 6, "circle diameter is measured");
    (0, assert_1.assertEqual)((0, geometry_1.formatMeasurementValue)(measurement("circle-circumference", "circle-o"), objects), "18.85", "circle circumference is formatted");
    (0, assert_1.assertEqual)((0, geometry_1.formatMeasurementValue)(measurement("circle-area", "circle-o"), objects), "28.27", "circle area is formatted");
}
function assertThreePointCircleMeasurements() {
    const circle = {
        circleKind: "three-points",
        createdAt: 1,
        dependencies: ["a", "b", "c"],
        dependents: [],
        id: "circle-abc",
        locked: false,
        pointAId: "a",
        pointBId: "b",
        pointCId: "c",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "circle",
        updatedAt: 1,
        visible: true,
    };
    const objects = {
        a: point("a", 1, 0),
        b: point("b", 0, 1),
        c: point("c", -1, 0),
        "circle-abc": circle,
    };
    (0, assert_1.assertEqual)((0, geometry_1.measureValue)(measurement("circle-radius", "circle-abc"), objects), 1, "three-point circle radius is measured");
}
function assertArcMeasurement() {
    const arc = {
        centerPointId: "o",
        createdAt: 1,
        dependencies: ["o", "a", "b"],
        dependents: [],
        direction: "counterclockwise",
        endPointId: "b",
        id: "arc-ab",
        locked: false,
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "arc",
        updatedAt: 1,
        visible: true,
    };
    const objects = {
        a: point("a", 1, 0),
        b: point("b", 0, 1),
        o: point("o", 0, 0),
        "arc-ab": arc,
    };
    (0, assert_1.assertEqual)((0, geometry_1.formatMeasurementValue)(measurement("arc-length", "arc-ab"), objects), "1.57", "arc length is measured");
}
function assertRegionMeasurement() {
    const region = {
        boundaryPointIds: ["a", "b", "c"],
        createdAt: 1,
        dependencies: ["a", "b", "c"],
        dependents: [],
        id: "region-abc",
        locked: false,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "region",
        updatedAt: 1,
        visible: true,
    };
    const objects = {
        a: point("a", 0, 0),
        b: point("b", 4, 0),
        c: point("c", 0, 3),
        "region-abc": region,
    };
    (0, assert_1.assertEqual)((0, geometry_1.measureValue)(measurement("region-area", "region-abc"), objects), 6, "region area is measured");
}
function assertAngleMeasurement() {
    const angle = {
        createdAt: 1,
        dependencies: ["a", "b", "c"],
        dependents: [],
        id: "angle-abc",
        locked: false,
        pointAId: "a",
        pointCId: "c",
        radius: 1,
        showRightAngleMarker: false,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "angle",
        updatedAt: 1,
        vertexPointId: "b",
        visible: true,
    };
    const objects = {
        a: point("a", 1, 0),
        b: point("b", 0, 0),
        c: point("c", 0, 1),
        "angle-abc": angle,
    };
    (0, assert_1.assertEqual)((0, geometry_1.formatMeasurementValue)(measurement("angle-value", "angle-abc"), objects), "90°", "angle value is formatted");
}
function assertMeasurementDependencyUpdate() {
    const segment = {
        createdAt: 1,
        dependencies: ["a", "b"],
        dependents: [],
        endPointId: "b",
        id: "ab",
        locked: false,
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "segment",
        updatedAt: 1,
        visible: true,
    };
    const length = measurement("segment-length", "ab");
    const objects = (0, geometry_1.normalizeDependencyMetadata)({
        a: point("a", 0, 0),
        ab: segment,
        b: point("b", 3, 4),
        "measurement-segment-length": length,
    });
    const propagated = (0, geometry_1.propagateGeometryUpdates)({ ...objects, a: { ...objects.a, x: 1, updatedAt: 3 } }, "a");
    (0, assert_1.assert)(objects.ab?.dependents.includes(length.id), "measurement depends on target segment");
    (0, assert_1.assert)(propagated.valid, "measurement dependency propagation remains valid");
    (0, assert_1.assert)(propagated.valid && (propagated.objects[length.id]?.updatedAt ?? 0) > length.updatedAt, "measurement updates when target dependencies move");
}
