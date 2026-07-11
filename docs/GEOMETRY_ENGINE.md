# GEOMETRY_ENGINE.md

# NoadDVo Geometry Studio — Geometry Engine Specification

Version: 1.0  
Status: Draft  
Product: NoadDVo Geometry Studio  
Purpose: Define the mathematical engine, geometry object model, algorithms, dependency graph, snapping, hit testing, construction behavior, validation rules, and geometry-related performance requirements.

---

# Table of Contents

1. Purpose  
2. Core Philosophy  
3. Coordinate System  
4. Numeric Precision  
5. Core Types  
6. Base Geometry Object  
7. Geometry Object Types  
8. Point Object  
9. Segment Object  
10. Infinite Line Object  
11. Ray Object  
12. Vector Object  
13. Circle Object  
14. Polygon Object  
15. Arc Object  
16. Angle Object  
17. Text Object  
18. Region Object  
19. Geometry Scene  
20. Geometry Settings  
21. Core Math Functions  
22. Line Representation  
23. Intersection Algorithms  
24. Construction Algorithms  
25. Dependency Graph  
26. Snap Engine  
27. Hit Testing  
28. Bounding Boxes  
29. Region Detection  
30. Viewport Clipping  
31. Object Naming  
32. Validation Rules  
33. Measurements  
34. Geometry Cache  
35. Performance Requirements  
36. Error Handling  
37. Testing Requirements  
38. Definition of Done  
39. MVP Scope  
40. Future Scope  

---

# 1. Purpose

The Geometry Engine is the mathematical core of NoadDVo Geometry Studio.

It is responsible for:

- representing geometric objects
- calculating geometry
- validating constructions
- resolving dependencies
- detecting intersections
- snapping
- hit testing
- measurements
- updating dependent objects
- preparing data for rendering
- preparing data for TikZ export

The Geometry Engine must be independent from:

- React
- DOM
- SVG
- TailwindCSS
- UI components
- browser-specific APIs

The engine should be pure TypeScript.

The Geometry Engine should theoretically be able to run in:

- browser
- Node.js
- test environment
- future desktop app
- future server-side renderer

---

# 2. Core Philosophy

## 2.1 Geometry is the source of truth

The application UI must never invent geometry.

All geometric data must come from the Geometry Engine.

UI components may display geometry, but must not calculate geometry.

Bad:

```ts
const midpointX = (a.x + b.x) / 2;
```

inside a React component.

Good:

```ts
const midpoint = GeometryEngine.midpoint(a, b);
```

---

## 2.2 Pure functions first

Geometry calculations should be implemented as pure functions whenever possible.

Example:

```ts
function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
```

The same input must always produce the same output.

Pure geometry functions are easier to:

- test
- debug
- reuse
- optimize
- port to other platforms

---

## 2.3 Stable object references

Geometry objects should reference other objects by ID.

Example:

```ts
{
  type: "segment",
  startPointId: "point_A",
  endPointId: "point_B"
}
```

This allows dependent objects to update automatically when source points move.

---

## 2.4 Derived objects should not duplicate geometry

A midpoint should not permanently store its own coordinates.

Instead, it should store references to its parent points and compute its position from them.

Example:

```ts
{
  type: "point",
  pointKind: "derived",
  construction: {
    type: "midpoint",
    inputPointIds: ["A", "B"]
  }
}
```

---

## 2.5 Geometry should remain valid

Invalid geometry must not corrupt the scene.

Examples of invalid geometry:

- segment with identical endpoints
- circle with radius zero
- polygon with fewer than three points
- angle with duplicate vertex and endpoint
- construction with missing dependencies

Invalid operations should be rejected or marked as invalid.

The app must never crash because of invalid geometry.

---

# 3. Coordinate System

## 3.1 World coordinates

The Geometry Engine uses Cartesian coordinates.

Rules:

- Positive X goes right.
- Positive Y goes up.
- Origin is `(0, 0)`.
- Units are abstract mathematical units.

Example:

```txt
        y
        ↑
        |
        |
--------O--------→ x
        |
        |
```

---

## 3.2 Screen coordinates

The renderer uses screen coordinates.

Rules:

- Positive X goes right.
- Positive Y goes down.
- Origin is the top-left corner of the canvas.

Screen coordinates are only used by:

- renderer
- pointer event handling
- hit testing
- snapping distance in pixels

The Geometry Engine stores geometry in world coordinates.

---

## 3.3 Viewport

The viewport converts world coordinates to screen coordinates.

```ts
export type Viewport = {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};
```

Where:

- `scale` means pixels per world unit
- `offsetX` means horizontal screen offset
- `offsetY` means vertical screen offset
- `width` means canvas width in pixels
- `height` means canvas height in pixels

---

## 3.4 World to screen

```ts
export function worldToScreen(point: Point2D, viewport: Viewport): ScreenPoint {
  return {
    x: viewport.width / 2 + viewport.offsetX + point.x * viewport.scale,
    y: viewport.height / 2 + viewport.offsetY - point.y * viewport.scale,
  };
}
```

---

## 3.5 Screen to world

```ts
export function screenToWorld(point: ScreenPoint, viewport: Viewport): Point2D {
  return {
    x: (point.x - viewport.width / 2 - viewport.offsetX) / viewport.scale,
    y: -(point.y - viewport.height / 2 - viewport.offsetY) / viewport.scale,
  };
}
```

---

## 3.6 Viewport world bounds

The viewport should provide visible world bounds.

```ts
export type WorldBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};
```

```ts
export function getViewportWorldBounds(viewport: Viewport): WorldBounds {
  const topLeft = screenToWorld({ x: 0, y: 0 }, viewport);
  const bottomRight = screenToWorld(
    { x: viewport.width, y: viewport.height },
    viewport
  );

  return {
    minX: Math.min(topLeft.x, bottomRight.x),
    maxX: Math.max(topLeft.x, bottomRight.x),
    minY: Math.min(topLeft.y, bottomRight.y),
    maxY: Math.max(topLeft.y, bottomRight.y),
  };
}
```

---

# 4. Numeric Precision

Geometry software must handle floating point error carefully.

JavaScript uses floating point numbers, so exact equality is unsafe.

---

## 4.1 Epsilon

Use a global epsilon:

```ts
export const EPSILON = 1e-9;
```

For screen hit testing, use pixel thresholds instead.

---

## 4.2 Approximate equality

```ts
export function almostEqual(a: number, b: number, eps = EPSILON): boolean {
  return Math.abs(a - b) <= eps;
}
```

---

## 4.3 Point equality

```ts
export function pointsAlmostEqual(
  a: Point2D,
  b: Point2D,
  eps = EPSILON
): boolean {
  return almostEqual(a.x, b.x, eps) && almostEqual(a.y, b.y, eps);
}
```

---

## 4.4 Avoid negative zero

TikZ and UI output should never show `-0`.

```ts
export function cleanNumber(value: number, precision = 6): number {
  const rounded = Number(value.toFixed(precision));
  return Object.is(rounded, -0) ? 0 : rounded;
}
```

---

## 4.5 Finite numbers only

All coordinates must be finite.

Invalid:

```ts
Infinity
-Infinity
NaN
```

Validation:

```ts
export function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}
```

---

# 5. Core Types

## 5.1 Point2D

```ts
export type Point2D = {
  x: number;
  y: number;
};
```

---

## 5.2 ScreenPoint

```ts
export type ScreenPoint = {
  x: number;
  y: number;
};
```

---

## 5.3 Vector2D

```ts
export type Vector2D = {
  x: number;
  y: number;
};
```

---

## 5.4 BoundingBox

```ts
export type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};
```

---

## 5.5 Geometry Style

```ts
export type GeometryStyle = {
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  fill: string;
  fillOpacity: number;
  dash: "solid" | "dashed" | "dotted";
  pointSize: number;
  labelVisible: boolean;
  labelPosition:
    | "above"
    | "below"
    | "left"
    | "right"
    | "above-left"
    | "above-right"
    | "below-left"
    | "below-right";
};
```

---

# 6. Base Geometry Object

Every geometry object must extend this structure:

```ts
export type BaseGeometryObject = {
  id: string;
  type: GeometryObjectType;
  name?: string;
  visible: boolean;
  locked: boolean;
  style: GeometryStyle;
  dependencies: string[];
  dependents: string[];
  layerId?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};
```

Rules:

- `id` is immutable.
- `type` is immutable.
- `dependencies` contains parent object IDs.
- `dependents` contains child object IDs.
- `visible` controls rendering and export.
- `locked` prevents editing and deletion.
- `style` controls visual appearance.
- `metadata` is optional and should not be required for core logic.

---

# 7. Geometry Object Types

```ts
export type GeometryObjectType =
  | "point"
  | "segment"
  | "line"
  | "ray"
  | "vector"
  | "circle"
  | "arc"
  | "polygon"
  | "angle"
  | "text"
  | "region"
  | "measurement"
  | "construction";
```

---

# 8. Point Object

## 8.1 Free point

A free point stores its own coordinates.

```ts
export type PointObject = BaseGeometryObject & {
  type: "point";
  x: number;
  y: number;
  pointKind: "free" | "derived";
};
```

Validation:

- `x` must be finite.
- `y` must be finite.

---

## 8.2 Derived point

A derived point depends on other geometry objects.

Examples:

- midpoint
- intersection point
- projection point
- foot of altitude
- center of circle

```ts
export type DerivedPointObject = PointObject & {
  pointKind: "derived";
  construction: ConstructionDefinition;
};
```

Derived points may have computed coordinates.

They should update when parent objects update.

---

# 9. Segment Object

A segment connects two points.

```ts
export type SegmentObject = BaseGeometryObject & {
  type: "segment";
  startPointId: string;
  endPointId: string;
};
```

Validation:

- start point exists
- end point exists
- start and end are not equal

---

# 10. Infinite Line Object

An infinite line is defined by two distinct points.

```ts
export type LineObject = BaseGeometryObject & {
  type: "line";
  pointAId: string;
  pointBId: string;
};
```

Validation:

- point A exists
- point B exists
- points are distinct

The renderer clips the infinite line to the viewport.

---

# 11. Ray Object

A ray starts at one point and passes through another.

```ts
export type RayObject = BaseGeometryObject & {
  type: "ray";
  startPointId: string;
  throughPointId: string;
};
```

Validation:

- start point exists
- through point exists
- points are distinct

---

# 12. Vector Object

A vector is rendered as an arrow from start to end.

```ts
export type VectorObject = BaseGeometryObject & {
  type: "vector";
  startPointId: string;
  endPointId: string;
};
```

Validation:

- start point exists
- end point exists
- points are distinct

---

# 13. Circle Object

## 13.1 Circle by center and radius

```ts
export type CircleByRadiusObject = BaseGeometryObject & {
  type: "circle";
  circleKind: "center-radius";
  centerPointId: string;
  radius: number;
};
```

Validation:

- center exists
- radius is finite
- radius > EPSILON

---

## 13.2 Circle by center and point

```ts
export type CircleByPointObject = BaseGeometryObject & {
  type: "circle";
  circleKind: "center-point";
  centerPointId: string;
  radiusPointId: string;
};
```

The radius is computed from the distance between center point and radius point.

---

## 13.3 Circle through three points

```ts
export type CircleThroughThreePointsObject = BaseGeometryObject & {
  type: "circle";
  circleKind: "three-points";
  pointAId: string;
  pointBId: string;
  pointCId: string;
};
```

The circle is valid only if the three points are not collinear.

---

# 14. Polygon Object

```ts
export type PolygonObject = BaseGeometryObject & {
  type: "polygon";
  pointIds: string[];
  closed: true;
};
```

Validation:

- at least 3 points
- no missing points
- no duplicate neighboring points
- area must not be zero

---

# 15. Arc Object

```ts
export type ArcObject = BaseGeometryObject & {
  type: "arc";
  centerPointId: string;
  startPointId: string;
  endPointId: string;
  direction: "clockwise" | "counterclockwise";
};
```

Validation:

- center exists
- start point exists
- end point exists
- radius is not zero

---

# 16. Angle Object

```ts
export type AngleObject = BaseGeometryObject & {
  type: "angle";
  pointAId: string;
  vertexPointId: string;
  pointCId: string;
  radius: number;
  label?: string;
  showRightAngleMarker: boolean;
};
```

Angle is measured as `A-B-C`, where B is the vertex.

Validation:

- all points exist
- vertex is distinct from both arm points
- radius > 0

---

# 17. Text Object

```ts
export type TextObject = BaseGeometryObject & {
  type: "text";
  x: number;
  y: number;
  content: string;
  textMode: "plain" | "latex";
};
```

Validation:

- x and y are finite
- content is string

---

# 18. Region Object

A region is a filled area.

MVP region should be polygon-based.

```ts
export type RegionObject = BaseGeometryObject & {
  type: "region";
  boundaryPointIds: string[];
};
```

Validation:

- at least 3 boundary points
- all points exist
- polygon area is not zero

---

# 19. Geometry Scene

```ts
export type GeometryScene = {
  objects: Record<string, GeometryObject>;
  selectedObjectIds: string[];
  activeTool: string;
  viewport: Viewport;
  settings: GeometrySettings;
};
```

The scene is the full geometry state.

The scene should be serializable to JSON.

No functions should be stored inside the scene.

---

# 20. Geometry Settings

```ts
export type GeometrySettings = {
  snapEnabled: boolean;
  snapRadiusPx: number;
  showGrid: boolean;
  showAxes: boolean;
  gridSize: number;
  angleUnit: "degree" | "radian";
  precision: number;
};
```

Default values:

```ts
export const DEFAULT_GEOMETRY_SETTINGS: GeometrySettings = {
  snapEnabled: true,
  snapRadiusPx: 12,
  showGrid: true,
  showAxes: true,
  gridSize: 1,
  angleUnit: "degree",
  precision: 3,
};
```

---

# 21. Core Math Functions

## 21.1 Distance

```ts
export function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
```

---

## 21.2 Squared distance

Use this when comparing distances for performance.

```ts
export function distanceSquared(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}
```

---

## 21.3 Midpoint

```ts
export function midpoint(a: Point2D, b: Point2D): Point2D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}
```

---

## 21.4 Dot product

```ts
export function dot(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}
```

---

## 21.5 Cross product

```ts
export function cross(a: Vector2D, b: Vector2D): number {
  return a.x * b.y - a.y * b.x;
}
```

---

## 21.6 Vector from points

```ts
export function vectorFromPoints(a: Point2D, b: Point2D): Vector2D {
  return {
    x: b.x - a.x,
    y: b.y - a.y,
  };
}
```

---

## 21.7 Normalize vector

```ts
export function normalize(v: Vector2D): Vector2D {
  const length = Math.hypot(v.x, v.y);

  if (length < EPSILON) {
    return { x: 0, y: 0 };
  }

  return {
    x: v.x / length,
    y: v.y / length,
  };
}
```

---

## 21.8 Perpendicular vector

```ts
export function perpendicular(v: Vector2D): Vector2D {
  return {
    x: -v.y,
    y: v.x,
  };
}
```

---

## 21.9 Add vectors

```ts
export function addVectors(a: Vector2D, b: Vector2D): Vector2D {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}
```

---

## 21.10 Scale vector

```ts
export function scaleVector(v: Vector2D, scalar: number): Vector2D {
  return {
    x: v.x * scalar,
    y: v.y * scalar,
  };
}
```

---

# 22. Line Representation

For calculations, a line can be represented in parametric form:

```txt
P(t) = A + t(B - A)
```

Where:

- `A` is a point on the line
- `B` is another point on the line
- `t` is any real number

For a segment:

```txt
0 <= t <= 1
```

For a ray:

```txt
t >= 0
```

For an infinite line:

```txt
t ∈ R
```

---

# 23. Intersection Algorithms

## 23.1 Line-line intersection

Given:

```txt
P = A + tR
Q = C + uS
```

Where:

```txt
R = B - A
S = D - C
```

Intersection exists when:

```txt
cross(R, S) != 0
```

Formula:

```ts
export function lineLineIntersection(
  a: Point2D,
  b: Point2D,
  c: Point2D,
  d: Point2D
): Point2D | null {
  const r = vectorFromPoints(a, b);
  const s = vectorFromPoints(c, d);
  const denominator = cross(r, s);

  if (Math.abs(denominator) < EPSILON) {
    return null;
  }

  const cMinusA = vectorFromPoints(a, c);
  const t = cross(cMinusA, s) / denominator;

  return {
    x: a.x + t * r.x,
    y: a.y + t * r.y,
  };
}
```

---

## 23.2 Segment-segment intersection

Use line-line intersection and then check if parameters are in `[0, 1]`.

```ts
export function isBetween01(t: number): boolean {
  return t >= -EPSILON && t <= 1 + EPSILON;
}
```

Recommended result type:

```ts
export type SegmentIntersectionResult =
  | { type: "none" }
  | { type: "point"; point: Point2D }
  | { type: "overlap"; start: Point2D; end: Point2D };
```

---

## 23.3 Line-circle intersection

Line:

```txt
P(t) = A + tD
```

Circle:

```txt
|P(t) - O|² = r²
```

This produces a quadratic equation.

Return:

- zero points
- one tangent point
- two points

Recommended result type:

```ts
export type IntersectionResult =
  | { type: "none" }
  | { type: "point"; points: Point2D[] }
  | { type: "coincident" };
```

---

## 23.4 Circle-circle intersection

Two circles:

```txt
Circle 1: center O1, radius r1
Circle 2: center O2, radius r2
```

Cases:

- no intersection
- tangent
- two intersections
- coincident circles

Coincident circles should return a special result, not infinite points.

---

# 24. Construction Algorithms

## 24.1 Midpoint

Input:

- Point A
- Point B

Output:

- Point M

Formula:

```txt
M = ((Ax + Bx)/2, (Ay + By)/2)
```

---

## 24.2 Perpendicular line

Input:

- Point P
- Line AB

Formula:

Direction of AB:

```txt
d = B - A
```

Perpendicular direction:

```txt
n = (-dy, dx)
```

Line passes through P with direction n.

---

## 24.3 Parallel line

Input:

- Point P
- Line AB

Output line direction:

```txt
B - A
```

Line passes through P.

---

## 24.4 Perpendicular bisector

Input:

- Point A
- Point B

Output:

- line through midpoint M
- direction perpendicular to AB

---

## 24.5 Angle bisector

Input:

- Point A
- Vertex B
- Point C

Normalize:

```txt
u = normalize(A - B)
v = normalize(C - B)
```

Bisector direction:

```txt
u + v
```

If `u + v` is zero, the angle is 180 degrees and is invalid.

---

## 24.6 Projection of point onto line

Input:

- Point P
- Line AB

Formula:

```txt
t = dot(P - A, B - A) / |B - A|²
Projection = A + t(B - A)
```

---

## 24.7 Circumcenter

Given triangle ABC.

The circumcenter is the intersection of two perpendicular bisectors.

Invalid if A, B, C are collinear.

---

## 24.8 Incenter

Given triangle ABC.

Let side lengths:

```txt
a = |BC|
b = |CA|
c = |AB|
```

Then:

```txt
I = (aA + bB + cC) / (a + b + c)
```

---

## 24.9 Centroid

Given triangle ABC.

```txt
G = (A + B + C) / 3
```

---

## 24.10 Orthocenter

The orthocenter is the intersection of two altitudes.

---

# 25. Dependency Graph

## 25.1 Purpose

The dependency graph keeps derived objects updated.

Example:

```txt
A, B
 ↓
Midpoint M
 ↓
Circle centered at M
```

When A changes, M and the circle update.

---

## 25.2 Graph rules

- Dependencies must form a directed acyclic graph.
- A free object can have no dependencies.
- A derived object must list dependencies.
- Cycles are forbidden.
- Missing dependencies make the object invalid.
- Deleting a parent object should either delete or invalidate dependents.

---

## 25.3 Update propagation

When an object changes:

1. Mark object dirty.
2. Find all dependents.
3. Sort dependents topologically.
4. Recompute them.
5. Validate them.
6. Update scene.
7. Notify renderer and TikZ generator.

---

## 25.4 Invalid derived objects

If a dependency becomes invalid:

Example:

- circumcenter of collinear points

The derived object should either:

- become hidden temporarily
- show warning state
- remain in object list with invalid flag

Never crash.

---

# 26. Snap Engine

## 26.1 Snap targets

Snap should support:

- grid
- existing points
- segment endpoints
- midpoints
- intersections
- line
- segment
- circle
- polygon vertex

---

## 26.2 Snap result

```ts
export type SnapResult = {
  point: Point2D;
  type:
    | "grid"
    | "point"
    | "intersection"
    | "midpoint"
    | "line"
    | "segment"
    | "circle"
    | "polygon";
  targetObjectId?: string;
  distancePx: number;
};
```

---

## 26.3 Snap priority

Priority order:

1. Existing point
2. Intersection
3. Midpoint
4. Circle
5. Segment
6. Line
7. Grid

If two candidates are close, higher priority wins.

---

## 26.4 Grid snap

Grid snap rounds world coordinates.

```ts
export function snapToGrid(point: Point2D, gridSize: number): Point2D {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}
```

---

# 27. Hit Testing

## 27.1 Purpose

Hit testing determines which object the user is pointing at.

It uses screen distance, not world distance.

---

## 27.2 Hit test priority

1. Point
2. Label
3. Segment
4. Polygon
5. Circle
6. Line
7. Ray
8. Region

---

## 27.3 Point hit test

A point is hit if cursor is within:

```txt
pointRadius + tolerance
```

Default tolerance:

```txt
6 px
```

---

## 27.4 Segment hit test

Distance from cursor to segment must be less than tolerance.

---

## 27.5 Circle hit test

Distance from cursor to center should be approximately radius.

```txt
abs(distance(cursor, center) - radius) < tolerance
```

---

## 27.6 Polygon hit test

For filled polygon:

- use point-in-polygon

For border:

- test distance to edges

---

# 28. Bounding Boxes

Each object should provide a bounding box.

Bounding boxes are used for:

- selection
- zoom to fit
- export
- hit testing optimization
- viewport culling

---

## 28.1 Point bounding box

```txt
[x - r, y - r, x + r, y + r]
```

---

## 28.2 Segment bounding box

```txt
min/max of endpoints
```

---

## 28.3 Circle bounding box

```txt
center ± radius
```

---

## 28.4 Polygon bounding box

```txt
min/max of vertices
```

---

# 29. Region Detection

MVP:

Only explicit polygons can be filled.

Later:

Detect closed regions formed by lines and segments.

---

## 29.1 Polygon area

Use shoelace formula.

```ts
export function polygonArea(points: Point2D[]): number {
  let sum = 0;

  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    sum += current.x * next.y - next.x * current.y;
  }

  return sum / 2;
}
```

---

## 29.2 Point in polygon

Use ray casting.

```txt
Cast ray to the right.
Count intersections.
Odd = inside.
Even = outside.
```

---

# 30. Viewport Clipping

Infinite lines and rays must be clipped to the current viewport.

## 30.1 Infinite line clipping

Input:

- two points defining line
- viewport world bounds

Output:

- two points on viewport boundary

Use line-rectangle intersection.

---

## 30.2 Ray clipping

Input:

- ray start point
- ray direction
- viewport bounds

Output:

- start point
- boundary point

---

# 31. Object Naming

## 31.1 Points

Auto-name:

```txt
A, B, C, ..., Z, A1, B1, C1
```

Reserved common names:

```txt
O = center
M = midpoint
H = orthocenter or foot of altitude
G = centroid
I = incenter
```

---

## 31.2 Lines

Auto-name:

```txt
l, m, n, p, q, r
```

---

## 31.3 Circles

Auto-name:

```txt
c1, c2, c3
```

---

## 31.4 Angles

Auto-name:

```txt
α, β, γ, θ
```

---

# 32. Validation Rules

## 32.1 Point

Valid if:

- x and y are finite numbers

---

## 32.2 Segment

Valid if:

- both points exist
- endpoints are distinct

---

## 32.3 Line

Valid if:

- both points exist
- points are distinct

---

## 32.4 Circle

Valid if:

- center exists
- radius > EPSILON

---

## 32.5 Polygon

Valid if:

- at least three points
- points exist
- area is not zero

---

## 32.6 Angle

Valid if:

- all three points exist
- vertex is distinct from both arms

---

# 33. Measurements

The engine should compute:

- distance between points
- segment length
- slope
- angle
- polygon area
- polygon perimeter
- circle radius
- circle circumference
- circle area

Measurements should be recomputed when dependencies change.

---

# 34. Geometry Cache

Some calculations are expensive.

Cache:

- bounding boxes
- screen positions
- intersection results
- polygon area
- polygon perimeter

Invalidate cache when dependencies change.

---

# 35. Performance Requirements

The engine should support:

- 1,000 objects smoothly
- 10,000 objects later with optimization
- realtime dragging
- realtime TikZ update with debounce if needed

Target:

- geometry update under 16ms for normal scenes
- TikZ update under 100ms

---

# 36. Error Handling

Geometry errors must not crash the app.

Examples:

- invalid radius
- parallel lines
- overlapping circles
- missing dependency
- deleted parent object
- zero-length segment

Return structured errors.

```ts
export type GeometryError = {
  code: string;
  message: string;
  objectId?: string;
  severity: "info" | "warning" | "error";
};
```

---

# 37. Testing Requirements

Geometry Engine must have unit tests for:

- distance
- midpoint
- line-line intersection
- line-circle intersection
- circle-circle intersection
- polygon area
- point-in-polygon
- projection
- circumcenter
- incenter
- dependency propagation
- invalid geometry handling

---

# 38. Definition of Done

The Geometry Engine is complete for MVP when:

- free points work
- segments work
- lines work
- rays work
- vectors work
- circles work
- polygons work
- angles work
- midpoint works
- intersection works
- perpendicular line works
- parallel line works
- snapping works
- hit testing works
- dependency updates work
- invalid constructions do not crash the app
- all geometry functions are tested

---

# 39. MVP Scope

MVP Geometry Engine includes:

- Point
- Segment
- Line
- Ray
- Vector
- Circle
- Polygon
- Angle
- Midpoint
- Intersection
- Snap to grid
- Snap to point
- Snap to segment
- Hit testing
- Dependency graph
- Basic measurements

---

# 40. Future Scope

Future versions may include:

- ellipse
- parabola
- hyperbola
- Bezier curves
- transformations
- locus
- dynamic sliders
- animation
- macros
- 3D geometry
- symbolic constraints
- GeoGebra import
- TikZ import

---

# End of GEOMETRY_ENGINE.md