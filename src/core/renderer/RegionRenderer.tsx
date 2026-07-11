import type { PointObject, RegionObject } from "../geometry";
import { getRegionBoundaryPath } from "../geometry";
import { worldToScreen, type Viewport } from "../geometry/viewport";
import type { GeometryRenderer, GeometryRendererContext } from "./RendererRegistry";

function screenPath(points: readonly PointObject[], context: GeometryRendererContext): string {
  return `${points
    .map((point, index) => {
      const screenPoint = worldToScreen(point, context.viewport);

      return `${index === 0 ? "M" : "L"} ${screenPoint.x} ${screenPoint.y}`;
    })
    .join(" ")} Z`;
}

function worldPathToScreenPath(path: string, viewport: Viewport): string {
  const tokens = path.match(/[A-Za-z]|-?\d+(?:\.\d+)?/g) ?? [];
  const output: string[] = [];
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];

    if (token === "M" || token === "L") {
      const x = Number(tokens[index + 1]);
      const y = Number(tokens[index + 2]);
      const screen = worldToScreen({ x, y }, viewport);

      output.push(token, String(screen.x), String(screen.y));
      index += 3;
      continue;
    }

    if (token === "A") {
      const rx = Number(tokens[index + 1]) * viewport.scale;
      const ry = Number(tokens[index + 2]) * viewport.scale;
      const rotation = tokens[index + 3] ?? "0";
      const largeArc = tokens[index + 4] ?? "0";
      const sweep = tokens[index + 5] === "1" ? "0" : "1";
      const x = Number(tokens[index + 6]);
      const y = Number(tokens[index + 7]);
      const screen = worldToScreen({ x, y }, viewport);

      output.push("A", String(rx), String(ry), rotation, largeArc, sweep, String(screen.x), String(screen.y));
      index += 8;
      continue;
    }

    output.push(token ?? "");
    index += 1;
  }

  return output.join(" ");
}

export const RegionRenderer: GeometryRenderer<RegionObject> = {
  objectType: "region",
  render: (object, context) => {
    const boundary = getRegionBoundaryPath(object, context.objects);

    if (!boundary) {
      return null;
    }

    const path = boundary.kind === "polygon"
      ? screenPath(boundary.points, context)
      : worldPathToScreenPath(boundary.path, context.viewport);
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <path
            d={path}
            fill="#7ddcff"
            fillOpacity={0.1}
            stroke="#7ddcff"
            strokeLinejoin="round"
            strokeOpacity={0.34}
            strokeWidth={object.style.strokeWidth + 6}
          />
        )}
        {isHovered && (
          <path
            d={path}
            fill="#a8f0ff"
            fillOpacity={0.08}
            stroke="#a8f0ff"
            strokeLinejoin="round"
            strokeOpacity={0.22}
            strokeWidth={object.style.strokeWidth + 4}
          />
        )}
        <path
          d={path}
          fill={object.style.fill === "transparent" ? object.style.stroke : object.style.fill}
          fillOpacity={
            object.style.fill === "transparent"
              ? Math.max(0.12, object.style.fillOpacity)
              : object.style.fillOpacity
          }
          stroke={object.style.stroke}
          strokeLinejoin="round"
          strokeOpacity={object.style.strokeOpacity}
          strokeWidth={object.style.strokeWidth}
        />
      </g>
    );
  },
};
