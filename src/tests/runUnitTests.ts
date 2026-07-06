import { runGeometryTests } from "./geometry/geometry.test";
import { runMeasurementTests } from "./geometry/measurement.test";
import { runFillToolTests } from "./interactions/fillTool.test";
import { runHistoryTests } from "./history/history.test";
import { runSelectionTests } from "./interactions/selection.test";
import { runTextCreationTests } from "./interactions/textCreation.test";
import { runProjectTests } from "./project/project.test";
import { runVectorRendererTests } from "./renderer/vectorRenderer.test";
import { runSyncTests } from "./sync/sync.test";
import { runTikzApplyTests } from "./sync/tikzApply.test";
import { runMeasurementTikzTests } from "./tikz/measurementTikz.test";
import { runTikzTests } from "./tikz/tikz.test";
import { runTikzParserTests } from "./tikz/tikzParser.test";
import { runWorkspaceUxTests } from "./workspace/workspaceUx.test";

const suites = [
  ["geometry", runGeometryTests],
  ["measurements", runMeasurementTests],
  ["history", runHistoryTests],
  ["selection", runSelectionTests],
  ["fill-tool", runFillToolTests],
  ["text-creation", runTextCreationTests],
  ["renderer", runVectorRendererTests],
  ["sync", runSyncTests],
  ["tikz-apply", runTikzApplyTests],
  ["tikz", runTikzTests],
  ["tikz-parser", runTikzParserTests],
  ["measurement-tikz", runMeasurementTikzTests],
  ["project", runProjectTests],
  ["workspace-ux", runWorkspaceUxTests],
] as const;

suites.forEach(([name, run]) => {
  run();
  console.log(`ok ${name}`);
});
