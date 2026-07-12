import type { LineObject, Point2D, GeometryObjectRecord } from "../geometry";
import { intersectLinearObjects } from "../geometry/constructions/ConstructionAlgorithms";
import { normalize, vectorFromPoints, midpoint } from "../geometry/math";
import { worldToScreen, type Viewport } from "../geometry/viewport";

type ConstructionSymbolsProps = {
  readonly line: LineObject;
  readonly objects: GeometryObjectRecord;
  readonly viewport: Viewport;
  readonly stroke: string;
};

function getLineKindIndex(line: LineObject, objects: GeometryObjectRecord): number {
  const allLines = Object.values(objects).filter(o => o.type === "line" && o.lineKind === line.lineKind) as LineObject[];
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

function ArcSymbol({ vertex, u, v, radius, color, count = 1, hasTick = false }: { vertex: Point2D, u: Point2D, v: Point2D, radius: number, color: string, count?: number, hasTick?: boolean }) {
  const arcs = [];
  const spacing = 4;
  
  // Calculate angle to determine large arc flag and sweep flag
  const cross = u.x * v.y - u.y * v.x;
  const dot = u.x * v.x + u.y * v.y;
  const angle = Math.atan2(cross, dot);
  
  const largeArcFlag = Math.abs(angle) > Math.PI ? 1 : 0;
  const sweepFlag = angle > 0 ? 1 : 0;

  for (let i = 0; i < count; i++) {
    const r = radius + i * spacing;
    const start = { x: vertex.x + u.x * r, y: vertex.y + u.y * r };
    const end = { x: vertex.x + v.x * r, y: vertex.y + v.y * r };
    arcs.push(
      <path
        key={`arc-${i}`}
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`}
        fill="none"
      />
    );
  }

  let tick = null;
  if (hasTick) {
    const midAngle = angle / 2;
    const cosM = Math.cos(midAngle);
    const sinM = Math.sin(midAngle);
    const bDir = { x: u.x * cosM - u.y * sinM, y: u.x * sinM + u.y * cosM };
    const r = radius + ((count - 1) * spacing) / 2;
    const mid = { x: vertex.x + bDir.x * r, y: vertex.y + bDir.y * r };
    const tickLen = 4;
    const p1 = { x: mid.x + bDir.x * tickLen, y: mid.y + bDir.y * tickLen };
    const p2 = { x: mid.x - bDir.x * tickLen, y: mid.y - bDir.y * tickLen };
    tick = <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth={1.5} />;
  }

  return (
    <g stroke={color} strokeWidth={1.5} strokeOpacity={0.8}>
      {arcs}
      {tick}
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
        let arcCount = 1;
        let hasTick = false;
        if (index === 2) {
          arcCount = 1;
          hasTick = true;
        } else if (index >= 3) {
          arcCount = 2;
        }

        return (
          <ArcSymbol vertex={vertexScreen} u={u} v={w} radius={size * 1.5} color={stroke} count={arcCount} hasTick={hasTick} />
        );
      }
    }
  }

  return null;
}
