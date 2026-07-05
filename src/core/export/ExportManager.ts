import type { GeometryObjectRecord } from "../geometry";
import { generateTikz, type TikzMode } from "../tikz";
import { exportProjectJson, type ProjectExportSnapshot } from "./ExportJson";
import { exportSvgElement } from "./ExportSvg";
import { wrapTikzInStandaloneDocument } from "./ExportTex";

type DownloadFormat = "tex" | "json" | "svg" | "tikz";

const mimeTypes: Record<DownloadFormat, string> = {
  json: "application/json;charset=utf-8",
  svg: "image/svg+xml;charset=utf-8",
  tex: "application/x-tex;charset=utf-8",
  tikz: "text/plain;charset=utf-8",
};

function createTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function downloadText(content: string, filename: string, format: DownloadFormat): void {
  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function defaultFilename(extension: string): string {
  return `noaddvo-geometry-${createTimestamp()}.${extension}`;
}

export class ExportManager {
  copyTikzToClipboard(objects: GeometryObjectRecord, mode: TikzMode = "academic") {
    const tikz = generateTikz(objects, mode).code;

    return navigator.clipboard.writeText(tikz);
  }

  exportTikz(objects: GeometryObjectRecord, mode: TikzMode = "academic"): void {
    const tikz = generateTikz(objects, mode).code;

    downloadText(tikz, defaultFilename("tex"), "tikz");
  }

  exportTex(objects: GeometryObjectRecord, mode: TikzMode = "academic"): void {
    const tikz = generateTikz(objects, mode).code;
    const tex = wrapTikzInStandaloneDocument(tikz);

    downloadText(tex, defaultFilename("tex"), "tex");
  }

  exportJson(snapshot: ProjectExportSnapshot): void {
    downloadText(exportProjectJson(snapshot), defaultFilename("ndv"), "json");
  }

  exportProjectText(content: string, filename = defaultFilename("ndv")): void {
    downloadText(content, filename, "json");
  }

  exportSvg(svgElement: SVGSVGElement): void {
    downloadText(exportSvgElement(svgElement), defaultFilename("svg"), "svg");
  }
}

export const exportManager = new ExportManager();
