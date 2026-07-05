import { runGeometryTests } from "./geometry/geometry.test";
import { runMeasurementTests } from "./geometry/measurement.test";
import { runHistoryTests } from "./history/history.test";
import { runSelectionTests } from "./interactions/selection.test";
import { runTextCreationTests } from "./interactions/textCreation.test";
import { runProjectTests } from "./project/project.test";
import { runVectorRendererTests } from "./renderer/vectorRenderer.test";
import { runMeasurementTikzTests } from "./tikz/measurementTikz.test";
import { runTikzTests } from "./tikz/tikz.test";

const suites = [
  ["geometry", runGeometryTests],
  ["measurements", runMeasurementTests],
  ["history", runHistoryTests],
  ["selection", runSelectionTests],
  ["text-creation", runTextCreationTests],
  ["renderer", runVectorRendererTests],
  ["tikz", runTikzTests],
  ["measurement-tikz", runMeasurementTikzTests],
  ["project", runProjectTests],
] as const;

suites.forEach(([name, run]) => {
  run();
  console.log(`ok ${name}`);
});
