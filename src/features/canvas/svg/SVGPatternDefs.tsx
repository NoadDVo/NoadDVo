import type { GeometryObjectRecord, GeometryStyle } from "../../../core/geometry";

type SVGPatternDefsProps = {
  readonly objects: GeometryObjectRecord;
};

function renderPatternElement(
  type: NonNullable<GeometryStyle["pattern"]>["type"],
  size: number,
  spacing: number,
  fillColor: string,
) {
  const cx = spacing / 2;
  const cy = spacing / 2;

  switch (type) {
    case "dots":
      return <circle cx={cx} cy={cy} r={size / 2} fill={fillColor} />;
    case "squares":
      return (
        <rect
          x={cx - size / 2}
          y={cy - size / 2}
          width={size}
          height={size}
          fill={fillColor}
        />
      );
    case "triangles": {
      const h = (size * Math.sqrt(3)) / 2;
      return (
        <polygon
          points={`${cx},${cy - h / 2} ${cx - size / 2},${cy + h / 2} ${cx + size / 2},${cy + h / 2}`}
          fill={fillColor}
        />
      );
    }
    case "stars": {
      // 5-pointed star
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      const points = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return <polygon points={points.join(" ")} fill={fillColor} />;
    }
    default:
      return null;
  }
}

function renderHatchPattern(
  spacing: number,
  hatchLineWidth: number,
  fillColor: string,
  isCrosshatch: boolean,
) {
  const mid = spacing / 2;
  const halfW = hatchLineWidth / 2;
  return (
    <>
      <rect
        x={mid - halfW} y={0}
        width={hatchLineWidth} height={spacing}
        fill={fillColor}
      />
      {isCrosshatch && (
        <rect
          x={0} y={mid - halfW}
          width={spacing} height={hatchLineWidth}
          fill={fillColor}
        />
      )}
    </>
  );
}

export function SVGPatternDefs({ objects }: SVGPatternDefsProps) {
  const patternedObjects = Object.values(objects).filter(
    (obj) => obj.style.pattern && obj.style.pattern.type !== "none" && obj.visible,
  );

  if (patternedObjects.length === 0) {
    return null;
  }

  return (
    <defs>
      {patternedObjects.map((obj) => {
        const pattern = obj.style.pattern!;
        const isHatch = pattern.type === "hatch" || pattern.type === "crosshatch";
        const fillColor = pattern.color ?? "#000000";

        if (isHatch) {
          const angle = pattern.angle ?? 45;
          const hatchSpacing = Math.max(2, (pattern.spacing ?? 0.2) * 40);
          const hatchLineWidth = Math.max(0.5, (pattern.lineWidth ?? 0.4) * 1.5);

          return (
            <pattern
              key={`pattern-${obj.id}`}
              id={`pattern-${obj.id}`}
              patternUnits="userSpaceOnUse"
              width={hatchSpacing}
              height={hatchSpacing}
              patternTransform={`rotate(${angle})`}
            >
              {renderHatchPattern(hatchSpacing, hatchLineWidth, fillColor, pattern.type === "crosshatch")}
            </pattern>
          );
        }

        // density is 0.1 to 1.
        // If density is 1, spacing = size * 1.5. If density is 0.1, spacing = size * 5.
        const spacing = Math.max(pattern.size * 1.5, pattern.size * (1.5 + (1 - pattern.density) * 3));

        return (
          <pattern
            key={`pattern-${obj.id}`}
            id={`pattern-${obj.id}`}
            patternUnits="userSpaceOnUse"
            width={spacing}
            height={spacing}
          >
            {renderPatternElement(pattern.type, pattern.size, spacing, fillColor)}
          </pattern>
        );
      })}
    </defs>
  );
}

