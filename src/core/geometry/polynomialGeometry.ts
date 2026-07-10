import type { Point2D } from "./types";

/**
 * Evaluates the Lagrange interpolation polynomial at a given x.
 * @param x The x-coordinate to evaluate at.
 * @param points The set of points (x_i, y_i) to interpolate.
 */
export function evaluateLagrange(x: number, points: Point2D[]): number {
  if (points.length === 0) return 0;
  
  let y = 0;
  for (let i = 0; i < points.length; i++) {
    let term = points[i]!.y;
    for (let j = 0; j < points.length; j++) {
      if (i !== j) {
        // Prevent division by zero if two points have the same x coordinate
        const dx = points[i]!.x - points[j]!.x;
        if (Math.abs(dx) > 1e-9) {
          term = term * (x - points[j]!.x) / dx;
        } else {
          return NaN; // Interpolation fails for vertical points
        }
      }
    }
    y += term;
  }
  return y;
}

/**
 * Solves the Vandermonde matrix to find polynomial coefficients a_0, a_1, ... a_{n-1}
 * where y = a_0 + a_1*x + a_2*x^2 + ...
 */
export function getPolynomialCoefficients(points: Point2D[]): number[] {
  const n = points.length;
  if (n === 0) return [];
  
  // Matrix A and vector B for A * X = B
  const A: number[][] = [];
  const B: number[] = [];
  
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    let x_pow = 1;
    for (let j = 0; j < n; j++) {
      row.push(x_pow);
      x_pow *= points[i]!.x;
    }
    A.push(row);
    B.push(points[i]!.y);
  }
  
  // Gaussian elimination
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
    
    // Swap rows in A and B
    const tmpA = A[maxRow]!;
    A[maxRow] = A[i]!;
    A[i] = tmpA;
    
    const tmpB = B[maxRow]!;
    B[maxRow] = B[i]!;
    B[i] = tmpB;
    
    if (Math.abs(A[i]![i]!) < 1e-9) {
       return new Array(n).fill(0); // singular matrix
    }
    
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
    X[i] = B[i]! / A[i]![i]!;
    for (let k = i - 1; k >= 0; k--) {
      B[k]! -= A[k]![i]! * X[i]!;
    }
  }
  
  return X;
}
