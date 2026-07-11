"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runProjectTests = runProjectTests;
const geometry_1 = require("../../core/geometry");
const viewport_1 = require("../../core/geometry/viewport");
const export_1 = require("../../core/export");
const project_1 = require("../../core/project");
const ProjectSerializer_1 = require("../../core/project/ProjectSerializer");
const tikz_1 = require("../../core/tikz");
const assert_1 = require("../assert");
const point = {
    createdAt: 1,
    dependencies: [],
    dependents: [],
    id: "a",
    locked: false,
    name: "A",
    pointKind: "free",
    style: geometry_1.DEFAULT_GEOMETRY_STYLE,
    type: "point",
    updatedAt: 1,
    visible: true,
    x: 0,
    y: 0,
};
function runProjectTests() {
    assertBasicProjectSerialization();
    assertArcAndRegionProjectRoundTrip();
}
function assertBasicProjectSerialization() {
    const document = (0, ProjectSerializer_1.createProjectDocument)((0, project_1.createProjectMetadata)("Test"), {
        objects: { a: point },
        selectedObjectIds: ["a"],
        settings: {
            gridSize: 1,
            showAxes: true,
            showGrid: true,
            snapEnabled: true,
        },
        theme: "dark-arctic",
        tikzOptions: (0, tikz_1.getTikzOptions)("academic"),
        viewport: viewport_1.DEFAULT_VIEWPORT,
    });
    const parsed = JSON.parse((0, ProjectSerializer_1.serializeProjectDocument)(document));
    (0, assert_1.assertEqual)(parsed.version, 1, "project version is serialized");
    (0, assert_1.assertEqual)(parsed.objects.length, 1, "project objects are serialized");
    (0, assert_1.assertEqual)(parsed.selection[0], "a", "project selection is serialized");
}
function assertArcAndRegionProjectRoundTrip() {
    const arc = {
        centerPointId: "a",
        createdAt: 2,
        dependencies: ["a", "b", "c"],
        dependents: [],
        direction: "counterclockwise",
        endPointId: "c",
        id: "arc-bc",
        locked: false,
        startPointId: "b",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "arc",
        updatedAt: 2,
        visible: true,
    };
    const region = {
        boundaryPointIds: ["a", "b", "c"],
        createdAt: 3,
        dependencies: ["a", "b", "c"],
        dependents: [],
        id: "region-abc",
        locked: false,
        style: { ...geometry_1.DEFAULT_GEOMETRY_STYLE, fill: "#7ddcff", fillOpacity: 0.2 },
        type: "region",
        updatedAt: 3,
        visible: true,
    };
    const pointB = { ...point, id: "b", name: "B", x: 1, y: 0 };
    const pointC = { ...point, id: "c", name: "C", x: 0, y: 1 };
    const document = (0, ProjectSerializer_1.createProjectDocument)((0, project_1.createProjectMetadata)("Geometry Types"), {
        objects: { a: point, b: pointB, c: pointC, "arc-bc": arc, "region-abc": region },
        selectedObjectIds: ["arc-bc", "region-abc"],
        settings: {
            gridSize: 1,
            showAxes: true,
            showGrid: true,
            snapEnabled: true,
        },
        theme: "dark-arctic",
        tikzOptions: (0, tikz_1.getTikzOptions)("academic"),
        viewport: viewport_1.DEFAULT_VIEWPORT,
    });
    const imported = (0, export_1.importProjectJson)((0, ProjectSerializer_1.serializeProjectDocument)(document));
    (0, assert_1.assertEqual)(imported.valid, true, "arc and region project imports successfully");
    if (imported.valid) {
        (0, assert_1.assertEqual)(imported.objects["arc-bc"]?.type, "arc", "arc survives project import");
        (0, assert_1.assertEqual)(imported.objects["region-abc"]?.type, "region", "region survives project import");
    }
}
