import { getPointObject, getBoundedLineEndpoints, getCircleGeometry } from "./derivedGeometry";
import { getEllipseGeometry, getHyperbolaGeometry } from "./conicGeometry";
import { evaluateLagrange } from "./polynomialGeometry";
import type { GeometryObjectRecord, Point2D } from "./types";

/**
 * Trả về danh sách các giá trị Y (có thể 0, 1, hoặc 2 giá trị) của object tại hoành độ x.
 */
export function evaluateCurveY(
  objectId: string,
  x: number,
  objects: GeometryObjectRecord
): number[] {
  const object = objects[objectId];
  if (!object) return [];

  switch (object.type) {
    case "line":
    case "segment":
    case "ray": {
      const linePts = getBoundedLineEndpoints(object as any, objects);
      if (!linePts) return [];
      const [p1, p2] = linePts;
      if (Math.abs(p2.x - p1.x) < 1e-6) return []; // Đường thẳng đứng
      
      const m = (p2.y - p1.y) / (p2.x - p1.x);
      return [p1.y + m * (x - p1.x)];
    }

    case "polynomial": {
      const pts = object.pointIds
        .map((id) => getPointObject(objects, id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
      if (pts.length < 2) return [];
      
      let minX = Infinity;
      let maxX = -Infinity;
      for (const p of pts) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
      }
      
      if (x < minX || x > maxX) return [];
      
      const y = evaluateLagrange(x, pts);
      if (Number.isNaN(y) || !isFinite(y)) return [];
      return [y];
    }

    case "circle": {
      const geom = getCircleGeometry(object, objects);
      if (!geom) return [];
      const dx = x - geom.center.x;
      const r2 = geom.radius * geom.radius;
      if (dx * dx > r2) return [];
      const dy = Math.sqrt(r2 - dx * dx);
      return [geom.center.y + dy, geom.center.y - dy];
    }

    case "ellipse": {
      const geom = getEllipseGeometry(object as any, objects);
      if (!geom) return [];
      return solveConicY(x, geom.center, geom.rx, geom.ry, geom.angleDegrees, 1);
    }

    case "hyperbola": {
      const geom = getHyperbolaGeometry(object as any, objects);
      if (!geom) return [];
      return solveConicY(x, geom.center, geom.a, geom.b, geom.angleDegrees, -1);
    }

    default:
      return [];
  }
}

/**
 * Giải phương trình bậc 2 tìm Y của Conic (Ellipse = 1, Hyperbola = -1)
 */
function solveConicY(
  x: number,
  center: Point2D,
  a: number,
  b: number,
  angleDegrees: number,
  signB2: 1 | -1
): number[] {
  const theta = (angleDegrees * Math.PI) / 180;
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);
  
  const a2 = a * a;
  const b2 = b * b;
  const invA2 = 1 / a2;
  const invB2 = signB2 / b2;

  const dx = x - center.x;
  
  const A = sin * sin * invA2 + cos * cos * invB2;
  if (Math.abs(A) < 1e-10) return [];

  const B = 2 * dx * sin * cos * (invA2 - invB2);
  const C = dx * dx * (cos * cos * invA2 + sin * sin * invB2) - 1;

  const delta = B * B - 4 * A * C;
  if (delta < 0) return [];

  const sqrtDelta = Math.sqrt(delta);
  const dy1 = (-B + sqrtDelta) / (2 * A);
  const dy2 = (-B - sqrtDelta) / (2 * A);

  return [center.y + dy1, center.y + dy2];
}

/**
 * Format số cho TikZ
 */
function formatNumber(num: number): string {
  if (Number.isNaN(num)) return "0";
  return Number(num.toFixed(5)).toString();
}

/**
 * Tạo chuỗi phương trình TikZ: (phương_trình)
 * Sử dụng \x làm biến.
 */
export function generateTikzEquation(
  objectId: string,
  objects: GeometryObjectRecord,
  topBranch: boolean = true
): string {
  const object = objects[objectId];
  if (!object) return "0";

  switch (object.type) {
    case "line":
    case "segment":
    case "ray": {
      const linePts = getBoundedLineEndpoints(object as any, objects);
      if (!linePts) return "0";
      const [p1, p2] = linePts;
      if (Math.abs(p2.x - p1.x) < 1e-6) return "0";
      
      const m = (p2.y - p1.y) / (p2.x - p1.x);
      return `${formatNumber(p1.y)} + ${formatNumber(m)} * (\\x - ${formatNumber(p1.x)})`;
    }

    case "polynomial": {
      const pts = object.pointIds
        .map((id) => getPointObject(objects, id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
      if (pts.length < 2) return "0";
      return buildPolynomialTikz(pts);
    }

    case "circle": {
      const geom = getCircleGeometry(object, objects);
      if (!geom) return "0";
      const sign = topBranch ? "+" : "-";
      return `${formatNumber(geom.center.y)} ${sign} sqrt(max(0, ${formatNumber(geom.radius * geom.radius)} - (\\x - ${formatNumber(geom.center.x)})^2))`;
    }

    case "ellipse": {
      const geom = getEllipseGeometry(object as any, objects);
      if (!geom) return "0";
      return buildConicTikz(geom.center, geom.rx, geom.ry, geom.angleDegrees, 1, topBranch);
    }

    case "hyperbola": {
      const geom = getHyperbolaGeometry(object as any, objects);
      if (!geom) return "0";
      return buildConicTikz(geom.center, geom.a, geom.b, geom.angleDegrees, -1, topBranch);
    }

    default:
      return "0";
  }
}

function buildConicTikz(
  center: Point2D,
  a: number,
  b: number,
  angleDegrees: number,
  signB2: 1 | -1,
  topBranch: boolean
): string {
  const theta = (angleDegrees * Math.PI) / 180;
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);
  
  const a2 = a * a;
  const b2 = b * b;
  const invA2 = 1 / a2;
  const invB2 = signB2 / b2;

  const A = sin * sin * invA2 + cos * cos * invB2;
  const B_factor = 2 * sin * cos * (invA2 - invB2);
  const C_factor = cos * cos * invA2 + sin * sin * invB2;

  const dx = `(\\x - ${formatNumber(center.x)})`;
  const B = `(${dx} * ${formatNumber(B_factor)})`;
  const C = `(${dx}^2 * ${formatNumber(C_factor)} - 1)`;
  
  const delta = `(${B}^2 - 4 * ${formatNumber(A)} * ${C})`;
  
  const sign = (topBranch && A > 0) || (!topBranch && A < 0) ? "+" : "-"; // Dựa vào dấu của A
  
  return `${formatNumber(center.y)} + ( -${B} ${sign} sqrt(max(0, ${delta})) ) / (2 * ${formatNumber(A)})`;
}

function buildPolynomialTikz(pts: Point2D[]): string {
  const n = pts.length;
  const X = pts.map(p => p.x);
  const Y = pts.map(p => p.y);
  
  const A = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => Math.pow(X[i]!, j))
  );

  const coeffs = solveLinearSystem(A, Y);
  if (!coeffs) return "0";

  let expr = "";
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(coeffs[i]!) < 1e-8) continue;
    
    let term = formatNumber(coeffs[i]!);
    if (i > 0) term += `*(\\x)^${i}`;
    
    if (expr) {
      expr += coeffs[i]! > 0 ? ` + ${term}` : ` - ${term.replace("-", "")}`;
    } else {
      expr = term;
    }
  }
  return expr || "0";
}

export function solveLinearSystem(A: number[][], B: number[]): number[] {
  const n = B.length;
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxEl = Math.abs(A[i]![i]!);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k]![i]!) > maxEl) {
        maxEl = Math.abs(A[k]![i]!);
        maxRow = k;
      }
    }
    
    // Swap rows
    const tmp = A[maxRow]!;
    A[maxRow] = A[i]!;
    A[i] = tmp;
    
    const tmpB = B[maxRow]!;
    B[maxRow] = B[i]!;
    B[i] = tmpB;

    // Eliminate
    for (let k = i + 1; k < n; k++) {
      const c = -A[k]![i]! / A[i]![i]!;
      for (let j = i; j < n; j++) {
        if (i === j) {
          A[k]![j] = 0;
        } else {
          A[k]![j]! += c * A[i]![j]!;
        }
      }
      B[k]! += c * B[i]!;
    }
  }

  // Back substitution
  const X = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i]![j]! * X[j]!;
    }
    X[i] = (B[i]! - sum) / A[i]![i]!;
  }
  return X;
}


