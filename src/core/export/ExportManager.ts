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

  exportTikz(objects: GeometryObjectRecord, filename: string = defaultFilename("tex"), mode: TikzMode = "academic"): void {
    const tikz = generateTikz(objects, mode).code;

    downloadText(tikz, filename, "tikz");
  }

  exportTex(objects: GeometryObjectRecord, filename: string = defaultFilename("tex"), mode: TikzMode = "academic"): void {
    const tikz = generateTikz(objects, mode).code;
    const tex = wrapTikzInStandaloneDocument(tikz);

    downloadText(tex, filename, "tex");
  }

  exportJson(snapshot: ProjectExportSnapshot, filename: string = defaultFilename("ndv")): void {
    downloadText(exportProjectJson(snapshot), filename, "json");
  }

  exportProjectText(content: string, filename = defaultFilename("ndv")): void {
    downloadText(content, filename, "json");
  }

  exportSvg(svgElement: SVGSVGElement, filename: string = defaultFilename("svg")): void {
    downloadText(exportSvgElement(svgElement), filename, "svg");
  }

  private async getCanvasBlob(svgElement: SVGSVGElement, scale: number = 4): Promise<Blob | null> {
    const attrW = parseFloat(svgElement.getAttribute("width") || "0");
    const attrH = parseFloat(svgElement.getAttribute("height") || "0");
    const baseW = attrW || svgElement.viewBox.baseVal.width || svgElement.clientWidth || 800;
    const baseH = attrH || svgElement.viewBox.baseVal.height || svgElement.clientHeight || 600;

    const width = baseW * scale;
    const height = baseH * scale;

    svgElement.setAttribute("width", String(width));
    svgElement.setAttribute("height", String(height));
    const svgString = exportSvgElement(svgElement, "#ffffff");

    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const DOMURL = window.URL || window.webkitURL || window;
      const url = DOMURL.createObjectURL(svgBlob);

      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          DOMURL.revokeObjectURL(url);
          canvas.toBlob((blob) => resolve(blob), "image/png");
        } else {
          resolve(null);
        }
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = url;
    });
  }

  async exportPng(svgElement: SVGSVGElement, filename: string = defaultFilename("png")): Promise<void> {
    const blob = await this.getCanvasBlob(svgElement);
    if (blob) {
      const DOMURL = window.URL || window.webkitURL || window;
      const downloadUrl = DOMURL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = filename;
      anchor.click();
      DOMURL.revokeObjectURL(downloadUrl);
    }
  }

  async copyPng(svgElement: SVGSVGElement): Promise<boolean> {
    const blob = await this.getCanvasBlob(svgElement);
    if (blob) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        return true;
      } catch (e) {
        console.error("Failed to copy image to clipboard", e);
        return false;
      }
    }
    return false;
  }
}

export const exportManager = new ExportManager();
