const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function removeTransientLayers(svg: SVGSVGElement): void {
  const selectorsToRemove = [
    '[data-layer="preview"]',
    '[data-layer="grid"]',
    '[data-layer="axes"]'
  ];
  
  selectorsToRemove.forEach((selector) => {
    svg.querySelectorAll(selector).forEach((node) => node.remove());
  });
}

function addCanvasBackground(svg: SVGSVGElement, backgroundColor: string = "#0F1820"): void {
  const viewBox = svg.getAttribute("viewBox");
  const [x = "0", y = "0", width = "0", height = "0"] = viewBox?.trim().split(/[\s,]+/) ?? [];
  const background = document.createElementNS(SVG_NAMESPACE, "rect");

  background.setAttribute("x", x);
  background.setAttribute("y", y);
  background.setAttribute("width", width);
  background.setAttribute("height", height);
  background.setAttribute("fill", backgroundColor);
  svg.insertBefore(background, svg.firstChild);
}

export function exportSvgElement(svgElement: SVGSVGElement, backgroundColor: string = "#0F1820"): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  
  const attrW = parseFloat(svgElement.getAttribute("width") || "0");
  const attrH = parseFloat(svgElement.getAttribute("height") || "0");
  const width = attrW || svgElement.viewBox.baseVal.width || svgElement.clientWidth || 1;
  const height = attrH || svgElement.viewBox.baseVal.height || svgElement.clientHeight || 1;

  const viewBoxAttr = svgElement.getAttribute("viewBox");

  clone.setAttribute("xmlns", SVG_NAMESPACE);
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  
  if (viewBoxAttr) {
    clone.setAttribute("viewBox", viewBoxAttr);
  } else {
    clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  clone.removeAttribute("class");
  clone.removeAttribute("role");
  clone.removeAttribute("aria-label");

  removeTransientLayers(clone);
  addCanvasBackground(clone, backgroundColor);

  return new XMLSerializer().serializeToString(clone);
}
