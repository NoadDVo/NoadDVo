"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportSvgElement = exportSvgElement;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
function removeTransientLayers(svg) {
    svg.querySelectorAll('[data-layer="preview"]').forEach((node) => {
        node.remove();
    });
}
function addCanvasBackground(svg) {
    const viewBox = svg.getAttribute("viewBox");
    const [, , width = "0", height = "0"] = viewBox?.split(/\s+/) ?? [];
    const background = document.createElementNS(SVG_NAMESPACE, "rect");
    background.setAttribute("x", "0");
    background.setAttribute("y", "0");
    background.setAttribute("width", width);
    background.setAttribute("height", height);
    background.setAttribute("fill", "#0F1820");
    svg.insertBefore(background, svg.firstChild);
}
function exportSvgElement(svgElement) {
    const clone = svgElement.cloneNode(true);
    const width = svgElement.viewBox.baseVal.width || svgElement.clientWidth || 1;
    const height = svgElement.viewBox.baseVal.height || svgElement.clientHeight || 1;
    clone.setAttribute("xmlns", SVG_NAMESPACE);
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
    clone.removeAttribute("class");
    clone.removeAttribute("role");
    clone.removeAttribute("aria-label");
    removeTransientLayers(clone);
    addCanvasBackground(clone);
    return new XMLSerializer().serializeToString(clone);
}
