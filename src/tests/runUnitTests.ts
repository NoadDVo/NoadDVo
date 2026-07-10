import { runGeometryTests } from "./geometry/geometry.test";
import { runFillToolTests } from "./interactions/fillTool.test";
import { runImageAndTrimTests } from "./interactions/imageAndTrim.test";
import { runHistoryTests } from "./history/history.test";
import { runSelectionTests } from "./interactions/selection.test";
import { runTextCreationTests } from "./interactions/textCreation.test";
import { runToolbarToolsTests } from "./interactions/toolbarTools.test";
import { runProjectTests } from "./project/project.test";
import { runVectorRendererTests } from "./renderer/vectorRenderer.test";
import { runLiveSyncTests } from "./sync/liveSync.test";
import { runSyncTests } from "./sync/sync.test";
import { runTikzApplyTests } from "./sync/tikzApply.test";
import { runTikzRoundTripTests } from "./tikz/tikzRoundTrip.test";
import { runTikzTests } from "./tikz/tikz.test";
import { runTikzParserTests } from "./tikz/tikzParser.test";
import { runWorkspaceUxTests } from "./workspace/workspaceUx.test";

const suites = [
  ["geometry", runGeometryTests],
  ["history", runHistoryTests],
  ["selection", runSelectionTests],
  ["fill-tool", runFillToolTests],
  ["image-and-trim", runImageAndTrimTests],
  ["text-creation", runTextCreationTests],
  ["toolbar-tools", runToolbarToolsTests],
  ["renderer", runVectorRendererTests],
  ["sync", runSyncTests],
  ["live-sync", runLiveSyncTests],
  ["tikz-apply", runTikzApplyTests],
  ["tikz", runTikzTests],
  ["tikz-round-trip", runTikzRoundTripTests],
  ["tikz-parser", runTikzParserTests],
  ["project", runProjectTests],
  ["workspace-ux", runWorkspaceUxTests],
] as const;

suites.forEach(([name, run]) => {
  run();
  console.log(`ok ${name}`);
});
