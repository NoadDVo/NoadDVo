"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const geometry_test_1 = require("./geometry/geometry.test");
const measurement_test_1 = require("./geometry/measurement.test");
const fillTool_test_1 = require("./interactions/fillTool.test");
const imageAndTrim_test_1 = require("./interactions/imageAndTrim.test");
const history_test_1 = require("./history/history.test");
const selection_test_1 = require("./interactions/selection.test");
const textCreation_test_1 = require("./interactions/textCreation.test");
const toolbarTools_test_1 = require("./interactions/toolbarTools.test");
const project_test_1 = require("./project/project.test");
const vectorRenderer_test_1 = require("./renderer/vectorRenderer.test");
const liveSync_test_1 = require("./sync/liveSync.test");
const sync_test_1 = require("./sync/sync.test");
const tikzApply_test_1 = require("./sync/tikzApply.test");
const measurementTikz_test_1 = require("./tikz/measurementTikz.test");
const tikzRoundTrip_test_1 = require("./tikz/tikzRoundTrip.test");
const tikz_test_1 = require("./tikz/tikz.test");
const tikzParser_test_1 = require("./tikz/tikzParser.test");
const workspaceUx_test_1 = require("./workspace/workspaceUx.test");
const suites = [
    ["geometry", geometry_test_1.runGeometryTests],
    ["measurements", measurement_test_1.runMeasurementTests],
    ["history", history_test_1.runHistoryTests],
    ["selection", selection_test_1.runSelectionTests],
    ["fill-tool", fillTool_test_1.runFillToolTests],
    ["image-and-trim", imageAndTrim_test_1.runImageAndTrimTests],
    ["text-creation", textCreation_test_1.runTextCreationTests],
    ["toolbar-tools", toolbarTools_test_1.runToolbarToolsTests],
    ["renderer", vectorRenderer_test_1.runVectorRendererTests],
    ["sync", sync_test_1.runSyncTests],
    ["live-sync", liveSync_test_1.runLiveSyncTests],
    ["tikz-apply", tikzApply_test_1.runTikzApplyTests],
    ["tikz", tikz_test_1.runTikzTests],
    ["tikz-round-trip", tikzRoundTrip_test_1.runTikzRoundTripTests],
    ["tikz-parser", tikzParser_test_1.runTikzParserTests],
    ["measurement-tikz", measurementTikz_test_1.runMeasurementTikzTests],
    ["project", project_test_1.runProjectTests],
    ["workspace-ux", workspaceUx_test_1.runWorkspaceUxTests],
];
suites.forEach(([name, run]) => {
    run();
    console.log(`ok ${name}`);
});
