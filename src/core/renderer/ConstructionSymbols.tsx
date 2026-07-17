import type { GeometryObjectRecord, Point2D, PointObject } from "../geometry/types";
import type { LineObject } from "../geometry";
import { intersectLinearObjects } from "../geometry/constructions/ConstructionAlgorithms";
import { normalize, vectorFromPoints, midpoint } from "../geometry/math";
import { worldToScreen, type Viewport } from "../geometry/viewport";

type ConstructionSymbolsProps = {
  readonly line: LineObject;
  readonly objects: GeometryObjectRecord;
  readonly viewport: Viewport;
  readonly stroke: string;
};

function getLineKindIndex(line: any, objects: GeometryObjectRecord): number {
  const allLines = Object.values(objects).filter(o => {
    if (line.type === "segment" && line.specialLineKind) {
      return o.type === "segment" && (o as any).specialLineKind === line.specialLineKind;
    }
    return o.type === "line" && (o as any).lineKind === line.lineKind;
  });
  allLines.sort((a, b) => a.createdAt - b.createdAt);
  const index = allLines.findIndex(l => l.id === line.id);
  return index === -1 ? 1 : index + 1;
}

function getScreenVector(p1: Point2D, p2: Point2D, viewport: Viewport) {
  const s1 = worldToScreen(p1, viewport);
  const s2 = worldToScreen(p2, viewport);
  return normalize(vectorFromPoints(s1, s2));
}

function RightAngleSymbol({ foot, u, v, size, color }: { foot: Point2D, u: Point2D, v: Point2D, size: number, color: string }) {
  const p1 = { x: foot.x + u.x * size, y: foot.y + u.y * size };
  const p2 = { x: foot.x + u.x * size + v.x * size, y: foot.y + u.y * size + v.y * size };
  const p3 = { x: foot.x + v.x * size, y: foot.y + v.y * size };

  return (
    <polyline
      points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeOpacity={0.8}
    />
  );
}

function TickMarksSymbol({ center, dir, perp, size, color, count = 1 }: { center: Point2D, dir: Point2D, perp: Point2D, size: number, color: string, count?: number }) {
  const gap = 2;
  const length = size;
  
  const marks = [];
  const spacing = 3;
  const startOffset = -((count - 1) * spacing) / 2;

  for (let i = 0; i < count; i++) {
    const offset = startOffset + i * spacing;
    const c = { x: center.x + dir.x * offset, y: center.y + dir.y * offset };
    const pTop = { x: c.x - dir.x * gap + perp.x * length, y: c.y - dir.y * gap + perp.y * length };
    const pBot = { x: c.x - dir.x * gap - perp.x * length, y: c.y - dir.y * gap - perp.y * length };
    marks.push(<line key={i} x1={pTop.x} y1={pTop.y} x2={pBot.x} y2={pBot.y} />);
  }

  return (
    <g stroke={color} strokeWidth={1.5} strokeOpacity={0.8}>
      {marks}
    </g>
  );
}

function ArcSymbol({ vertex, u, v, radius, color, tickCount = 0 }: { vertex: Point2D, u: Point2D, v: Point2D, radius: number, color: string, tickCount?: number }) {
  // Calculate angle to determine large arc flag and sweep flag
  const cross = u.x * v.y - u.y * v.x;
  const dot = u.x * v.x + u.y * v.y;
  const angle = Math.atan2(cross, dot);
  
  const largeArcFlag = Math.abs(angle) > Math.PI ? 1 : 0;
  const sweepFlag = angle > 0 ? 1 : 0;

  const start = { x: vertex.x + u.x * radius, y: vertex.y + u.y * radius };
  const end = { x: vertex.x + v.x * radius, y: vertex.y + v.y * radius };
  
  const arcPath = (
    <path
      d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeOpacity={0.8}
    />
  );

  const ticks = [];
  if (tickCount > 0) {
    const midAngle = angle / 2;
    
    // The direction of the tick is ALONG the bisector, meaning crossing the arc radially.
    const tickLen = 4;
    const gap = 3;
    const angleGap = gap / radius;

    for (let i = 0; i < tickCount; i++) {
      const offsetAngle = midAngle + (i - (tickCount - 1) / 2) * angleGap;
      const cosA = Math.cos(offsetAngle);
      const sinA = Math.sin(offsetAngle);
      const tickDir = { x: u.x * cosA - u.y * sinA, y: u.x * sinA + u.y * cosA };
      
      const p1 = { x: vertex.x + tickDir.x * (radius - tickLen), y: vertex.y + tickDir.y * (radius - tickLen) };
      const p2 = { x: vertex.x + tickDir.x * (radius + tickLen), y: vertex.y + tickDir.y * (radius + tickLen) };
      ticks.push(<line key={`tick-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth={1.5} strokeOpacity={0.8} />);
    }
  }

  return (
    <g>
      {arcPath}
      {ticks}
    </g>
  );
}

export function ConstructionSymbols({ line, objects, viewport, stroke }: ConstructionSymbolsProps) {
  const size = 10; // fixed pixel size

  if (line.lineKind === "perpendicular" && line.sourceLineId) {
    const sourceLine = objects[line.sourceLineId];
    if (sourceLine && (sourceLine.type === "line" || sourceLine.type === "segment" || sourceLine.type === "ray")) {
      const intersections = intersectLinearObjects(line, sourceLine as any, objects);
      if (intersections.length > 0) {
        const footWorld = intersections[0] as Point2D;
        const footScreen = worldToScreen(footWorld, viewport);
        
        const sourcePointA = objects[(sourceLine as any).pointAId || (sourceLine as any).startPointId];
        const sourcePointB = objects[(sourceLine as any).pointBId || (sourceLine as any).endPointId || (sourceLine as any).throughPointId];
        const linePointA = objects[line.pointAId];
        const linePointB = objects[line.pointBId];

        if (sourcePointA && sourcePointB && linePointA && linePointB && 
            sourcePointA.type === "point" && sourcePointB.type === "point" &&
            linePointA.type === "point" && linePointB.type === "point") {
          
          let u = getScreenVector(sourcePointA, sourcePointB, viewport);
          let v = getScreenVector(linePointA, linePointB, viewport);
          
          const index = getLineKindIndex(line, objects);
          const rightAngleSize = size + (index > 1 ? (index - 1) * 3 : 0);
          
          return <RightAngleSymbol foot={footScreen} u={u} v={v} size={rightAngleSize} color={stroke} />;
        }
      }
    }
  }

  if (line.specialLineKind === "altitude") {
    const dependentPointId = (line as any).pointBId || (line as any).endPointId;
    const vertexId = (line as any).pointAId || (line as any).startPointId;
    const dependentPoint = objects[dependentPointId];
    if (dependentPoint?.type === "point" && dependentPoint.construction?.type === "special-line-projection") {
      const segment = objects[dependentPoint.construction.segmentId];
      if (segment?.type === "segment") {
        const segPointA = objects[segment.startPointId];
        const segPointB = objects[segment.endPointId];
        const vertex = objects[vertexId];
        if (segPointA?.type === "point" && segPointB?.type === "point" && vertex?.type === "point") {
          const footScreen = worldToScreen(dependentPoint, viewport);
          const u = getScreenVector(segPointA, segPointB, viewport);
          const v = getScreenVector(dependentPoint, vertex, viewport);
          return <RightAngleSymbol foot={footScreen} u={u} v={v} size={size} color={stroke} />;
        }
      }
    }
  }

  if (line.specialLineKind === "perpendicular-bisector-3step") {
    const midpointId = (line as any).pointAId || (line as any).startPointId;
    const dependentId = (line as any).pointBId || (line as any).endPointId;
    const midpointPoint = objects[midpointId];
    const dependentPoint = objects[dependentId];
    if (midpointPoint?.type === "point" && midpointPoint.construction?.type === "midpoint") {
      const pointA = objects[midpointPoint.construction.pointAId];
      const pointB = objects[midpointPoint.construction.pointBId];
      if (pointA && pointB && pointA.type === "point" && pointB.type === "point" && dependentPoint?.type === "point") {
        const midWorld = midpoint(pointA, pointB);
        const footScreen = worldToScreen(midWorld, viewport);
        const u = getScreenVector(pointA, pointB, viewport);       // direction along AB
        const v = getScreenVector(midpointPoint, dependentPoint, viewport); // direction of bisector
        // Midpoints of the two half-segments for tick positions
        const mid1Screen = worldToScreen(midpoint(pointA, midWorld), viewport);
        const mid2Screen = worldToScreen(midpoint(midWorld, pointB), viewport);

        const tickCount = Math.min(getLineKindIndex(line, objects), 3);

        return (
          <g>
            {/* Right angle mark at midpoint */}
            <RightAngleSymbol foot={footScreen} u={u} v={v} size={size} color={stroke} />
            {/* Equal tick marks on each half of AB */}
            <TickMarksSymbol center={mid1Screen} dir={u} perp={v} size={5} color={stroke} count={tickCount} />
            <TickMarksSymbol center={mid2Screen} dir={u} perp={v} size={5} color={stroke} count={tickCount} />
          </g>
        );
      }
    }
  }

  if (line.lineKind === "perpendicular-bisector" && line.sourceSegmentAId && line.sourceSegmentBId) {
    const pointA = objects[line.sourceSegmentAId];
    const pointB = objects[line.sourceSegmentBId];
    if (pointA && pointB && pointA.type === "point" && pointB.type === "point") {
      const midWorld = midpoint(pointA, pointB);
      const midScreen = worldToScreen(midWorld, viewport);
      
      const u = getScreenVector(pointA, pointB, viewport);
      const linePointA = objects[line.pointAId];
      const linePointB = objects[line.pointBId];
      
      if (linePointA && linePointB && linePointA.type === "point" && linePointB.type === "point") {
        const v = getScreenVector(linePointA, linePointB, viewport);
        const midA = worldToScreen(midpoint(pointA, midWorld), viewport);
        const midB = worldToScreen(midpoint(pointB, midWorld), viewport);
        
        const index = getLineKindIndex(line, objects);
        const rightAngleSize = size;
        const tickCount = Math.min(index, 3); // Max 3 ticks

        return (
          <g>
            <RightAngleSymbol foot={midScreen} u={u} v={v} size={rightAngleSize} color={stroke} />
            <TickMarksSymbol center={midA} dir={u} perp={v} size={4} color={stroke} count={tickCount} />
            <TickMarksSymbol center={midB} dir={u} perp={v} size={4} color={stroke} count={tickCount} />
          </g>
        );
      }
    }
  }

  if (line.specialLineKind === "angle-bisector") {
    const dependentPointId = (line as any).pointBId || (line as any).endPointId;
    const vertexId = (line as any).pointAId || (line as any).startPointId;
    const vertex = objects[vertexId];
    const endpointP = objects[dependentPointId];
    
    if (vertex?.type === "point" && endpointP?.type === "point") {
      let pointA: PointObject | undefined;
      let pointC: PointObject | undefined;

      if (endpointP.construction?.type === "special-line-bisector") {
        const segment = objects[endpointP.construction.segmentId];
        if (segment?.type === "segment") {
          pointA = objects[segment.startPointId] as PointObject;
          pointC = objects[segment.endPointId] as PointObject;
        }
      } else if (endpointP.construction?.type === "angle-bisector-endpoint") {
        pointA = objects[endpointP.construction.pointAId] as PointObject;
        pointC = objects[endpointP.construction.pointCId] as PointObject;
      }

      if (pointA?.type === "point" && pointC?.type === "point") {
        const vertexScreen = worldToScreen(vertex, viewport);
        const uA = getScreenVector(vertex, pointA, viewport);
        const uP = getScreenVector(vertex, endpointP, viewport);
        const uC = getScreenVector(vertex, pointC, viewport);

        const index = getLineKindIndex(line, objects);
        const tickCount = Math.min(index, 3);
        const r1 = size * 1.5;
        const r2 = size * 2.0;
        
        return (
          <g>
            <ArcSymbol vertex={vertexScreen} u={uA} v={uP} radius={r1} color={stroke} tickCount={tickCount} />
            <ArcSymbol vertex={vertexScreen} u={uP} v={uC} radius={r2} color={stroke} tickCount={tickCount} />
          </g>
        );
      }
    }
  }

  if (line.specialLineKind === "median") {
    const dependentPointId = (line as any).pointBId || (line as any).endPointId;
    const dependentPoint = objects[dependentPointId];
    if (dependentPoint?.type === "point" && dependentPoint.construction?.type === "special-line-midpoint") {
      const segment = objects[dependentPoint.construction.segmentId];
      if (segment?.type === "segment") {
        const segPointA = objects[segment.startPointId];
        const segPointB = objects[segment.endPointId];
        if (segPointA?.type === "point" && segPointB?.type === "point") {
          const u = getScreenVector(segPointA, segPointB, viewport);
          const v = { x: -u.y, y: u.x }; // perpendicular
          
          const midA = worldToScreen(midpoint(segPointA, dependentPoint), viewport);
          const midB = worldToScreen(midpoint(dependentPoint, segPointB), viewport);
          
          const index = getLineKindIndex(line, objects);
          const tickCount = Math.min(index, 3);

          return (
            <g>
              <TickMarksSymbol center={midA} dir={u} perp={v} size={4} color={stroke} count={tickCount} />
              <TickMarksSymbol center={midB} dir={u} perp={v} size={4} color={stroke} count={tickCount} />
            </g>
          );
        }
      }
    }
  }

  if (line.lineKind === "angle-bisector-4step") {
    // vertex = line.pointAId, dependent endpoint = line.pointBId
    const vertex = objects[line.pointAId];
    const endpointP = objects[line.pointBId];
    if (vertex?.type === "point" && endpointP?.type === "point" && endpointP.construction?.type === "angle-bisector-endpoint") {
      const pointA = objects[endpointP.construction.pointAId]; // click-1 point
      const pointC = objects[endpointP.construction.pointCId]; // click-3 point

      if (pointA?.type === "point" && pointC?.type === "point") {
        const vertexScreen = worldToScreen(vertex, viewport);
        const uA = getScreenVector(vertex, pointA, viewport);     // BA direction
        const uP = getScreenVector(vertex, endpointP, viewport);  // bisector direction
        const uC = getScreenVector(vertex, pointC, viewport);     // BC direction

        const index = getLineKindIndex(line, objects);
        const tickCount = Math.min(index, 3);
        const r1 = size * 1.5;
        const r2 = size * 2.0;
        
        return (
          <g>
            <ArcSymbol vertex={vertexScreen} u={uA} v={uP} radius={r1} color={stroke} tickCount={tickCount} />
            <ArcSymbol vertex={vertexScreen} u={uP} v={uC} radius={r2} color={stroke} tickCount={tickCount} />
          </g>
        );
      }
    }
  }

  if (line.lineKind === "angle-bisector" && line.vertexPointId && line.anglePointAId && line.anglePointBId) {
    const vertex = objects[line.vertexPointId];
    const pointA = objects[line.anglePointAId];
    const pointB = objects[line.anglePointBId];
    
    if (vertex && pointA && pointB && vertex.type === "point" && pointA.type === "point" && pointB.type === "point") {
      const vertexScreen = worldToScreen(vertex, viewport);
      const u = getScreenVector(vertex, pointA, viewport);
      const w = getScreenVector(vertex, pointB, viewport);
      const linePointA = objects[line.pointAId];
      const linePointB = objects[line.pointBId];
      
      if (linePointA && linePointB && linePointA.type === "point" && linePointB.type === "point") {

        const index = getLineKindIndex(line, objects);
        const tickCount = Math.min(index, 3);

        return (
          <ArcSymbol vertex={vertexScreen} u={u} v={w} radius={size * 1.5} color={stroke} tickCount={tickCount} />
        );
      }
    }
  }

  return null;
}
