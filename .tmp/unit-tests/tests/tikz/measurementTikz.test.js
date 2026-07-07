"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMeasurementTikzTests = runMeasurementTikzTests;
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
function runMeasurementTikzTests() {
    const segment = {
        createdAt: 1,
        dependencies: ["a", "b"],
        dependents: ["length-ab"],
        endPointId: "b",
        id: "ab",
        locked: false,
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "segment",
        updatedAt: 1,
        visible: true,
    };
    const measurement = {
        createdAt: 2,
        dependencies: ["ab"],
        dependents: [],
        id: "length-ab",
        labelPosition: "above",
        locked: false,
        measurementType: "segment-length",
        precision: 2,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        targetObjectId: "ab",
        type: "measurement",
        updatedAt: 2,
        visible: true,
    };
    const objects = {
        a: point("a", "A", 0, 0),
        ab: segment,
        b: point("b", "B", 3, 4),
        "length-ab": measurement,
    };
    const code = (0, tikz_1.generateTikz)(objects, "academic").code;
    (0, assert_1.assertIncludes)(code, "\\node", "TikZ measurement exports a node");
    (0, assert_1.assertIncludes)(code, "{$5$};", "TikZ measurement exports formatted value");
}
