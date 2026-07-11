# TIKZ_SPEC.md

# NoadDVo Geometry Studio — TikZ Generator Specification

Version: 1.0  
Status: Draft  
Product: NoadDVo Geometry Studio  
Purpose: Define the TikZ/LaTeX generation system, output rules, object exporters, formatting conventions, style mapping, export modes, and acceptance criteria.

---

# Table of Contents

1. Purpose  
2. TikZ Philosophy  
3. Generator Goals  
4. Supported Output Types  
5. TikZ Architecture  
6. TikZ Options  
7. Output Structure  
8. Document Wrapper  
9. TikZ Libraries  
10. Number Formatting  
11. Coordinate Naming  
12. Object Export Order  
13. Color Handling  
14. Style Mapping  
15. Point Export  
16. Segment Export  
17. Line Export  
18. Ray Export  
19. Vector Export  
20. Circle Export  
21. Polygon Export  
22. Arc Export  
23. Angle Export  
24. Text Export  
25. Region Export  
26. Measurement Export  
27. Construction Object Export  
28. Labels  
29. Fill Rules  
30. Dash Rules  
31. Arrow Rules  
32. Opacity Rules  
33. TikZ Modes  
34. Minimal Mode  
35. Academic Mode  
36. Colorful Mode  
37. Olympiad Mode  
38. tkz-euclide Compatibility  
39. Error Handling  
40. Export to `.tex`  
41. Export to TikZ Snippet  
42. Export to Clipboard  
43. TikZ Preview  
44. Formatting Rules  
45. Testing Requirements  
46. MVP Scope  
47. Future Scope  
48. Definition of Done  

---

# 1. Purpose

The TikZ Generator is one of the most important systems in NoadDVo Geometry Studio.

Unlike many geometry applications, TikZ export is not a secondary feature.

TikZ generation is a first-class product capability.

The goal is to allow users to draw geometry interactively and immediately obtain clean, readable, reusable TikZ code.

The generated TikZ should be suitable for:

- LaTeX documents
- exam papers
- olympiad geometry solutions
- lecture notes
- books
- worksheets
- academic articles
- math blogs
- SVG/PDF rendering through LaTeX

---

# 2. TikZ Philosophy

## 2.1 Human-readable code

Generated TikZ should be readable by humans.

Bad:

```tex
\draw (1.00000000002, -0.0000000003)--(3.99999999998, 2.0000000001);
```

Good:

```tex
\draw (1,0) -- (4,2);
```

---

## 2.2 Stable output

The same scene should generate the same TikZ code every time.

Object ordering must be deterministic.

Coordinates must be formatted consistently.

Names must remain stable unless the user renames objects.

---

## 2.3 Minimal when possible

The generator should not overcomplicate simple diagrams.

Bad:

```tex
\definecolor{customColor00001}{HTML}{000000}
\draw[color=customColor00001, line width=0.999999pt] (A) -- (B);
```

Good:

```tex
\draw (A) -- (B);
```

---

## 2.4 Style-preserving when needed

When the user chooses Colorful Mode, object colors, opacity, fill, dash, and line width should be preserved as much as possible.

---

## 2.5 TikZ should compile

Generated code must compile in a standard LaTeX distribution.

The default full `.tex` export must compile without manual edits.

---

# 3. Generator Goals

The TikZ Generator must:

- generate valid TikZ
- support all MVP geometry objects
- update in realtime
- provide clean formatting
- support multiple export modes
- support document wrapper
- support clipboard copy
- support `.tex` export
- support color preservation
- support labels
- support filled polygons
- support angle markers
- avoid invalid LaTeX identifiers
- avoid negative zero
- round coordinates consistently

---

# 4. Supported Output Types

The system should support these output types:

## 4.1 TikZ snippet

Only the `tikzpicture` environment:

```tex
\begin{tikzpicture}[scale=1]
...
\end{tikzpicture}
```

---

## 4.2 Full standalone `.tex`

A complete LaTeX document:

```tex
\documentclass[tikz,border=5pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{calc,angles,quotes,intersections,arrows.meta}
\begin{document}

\begin{tikzpicture}[scale=1]
...
\end{tikzpicture}

\end{document}
```

---

## 4.3 Raw TikZ commands

Only commands inside the picture:

```tex
\coordinate (A) at (0,0);
\coordinate (B) at (4,0);
\draw (A) -- (B);
```

---

## 4.4 Clipboard output

Clipboard output should usually use TikZ snippet mode.

---

# 5. TikZ Architecture

The TikZ system should be independent from:

- React
- SVG
- DOM
- UI components
- Canvas rendering

It should accept a pure geometry scene and return a string.

Recommended architecture:

```txt
Geometry Scene
      ↓
TikZ Scene Builder
      ↓
Object Exporter Registry
      ↓
TikZ Formatter
      ↓
Output String
```

---

## 5.1 Main generator function

```ts
export function generateTikz(
  scene: GeometryScene,
  options: TikzOptions
): TikzGenerationResult;
```

---

## 5.2 Generation result

```ts
export type TikzGenerationResult = {
  code: string;
  warnings: TikzWarning[];
  errors: TikzError[];
  metadata: {
    objectCount: number;
    generatedAt: number;
    mode: TikzMode;
  };
};
```

---

## 5.3 Exporter interface

Each geometry object type should have its own exporter.

```ts
export interface TikzObjectExporter<TObject> {
  objectType: GeometryObjectType;
  export(
    object: TObject,
    context: TikzExportContext
  ): TikzExportChunk;
}
```

---

## 5.4 Export chunk

```ts
export type TikzExportChunk = {
  coordinates?: string[];
  fills?: string[];
  drawings?: string[];
  points?: string[];
  labels?: string[];
  comments?: string[];
  warnings?: TikzWarning[];
};
```

---

## 5.5 Export context

```ts
export type TikzExportContext = {
  scene: GeometryScene;
  options: TikzOptions;
  nameRegistry: TikzNameRegistry;
  colorRegistry: TikzColorRegistry;
  precision: number;
};
```

---

# 6. TikZ Options

```ts
export type TikzMode =
  | "minimal"
  | "academic"
  | "colorful"
  | "olympiad";

export type TikzOptions = {
  mode: TikzMode;
  includeDocumentWrapper: boolean;
  includeComments: boolean;
  includeColorDefinitions: boolean;
  includeTikzLibraries: boolean;
  coordinatePrecision: number;
  scale: number;
  usePointNames: boolean;
  showHiddenObjects: boolean;
  exportLabels: boolean;
  exportPoints: boolean;
  exportGrid: boolean;
  exportAxes: boolean;
  preferTkzEuclide: boolean;
};
```

Default:

```ts
export const DEFAULT_TIKZ_OPTIONS: TikzOptions = {
  mode: "academic",
  includeDocumentWrapper: false,
  includeComments: true,
  includeColorDefinitions: true,
  includeTikzLibraries: true,
  coordinatePrecision: 3,
  scale: 1,
  usePointNames: true,
  showHiddenObjects: false,
  exportLabels: true,
  exportPoints: true,
  exportGrid: false,
  exportAxes: false,
  preferTkzEuclide: false,
};
```

---

# 7. Output Structure

Default TikZ snippet structure:

```tex
\begin{tikzpicture}[scale=1]

% Coordinates
\coordinate (A) at (0,0);
\coordinate (B) at (4,0);
\coordinate (C) at (1.5,3);

% Filled regions
\fill[blue!15] (A) -- (B) -- (C) -- cycle;

% Lines and shapes
\draw (A) -- (B);
\draw (B) -- (C);
\draw (C) -- (A);

% Points
\fill (A) circle (1.5pt);
\fill (B) circle (1.5pt);
\fill (C) circle (1.5pt);

% Labels
\node[below left] at (A) {$A$};
\node[below right] at (B) {$B$};
\node[above] at (C) {$C$};

\end{tikzpicture}
```

---

# 8. Document Wrapper

When `includeDocumentWrapper` is true:

```tex
\documentclass[tikz,border=5pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{calc,angles,quotes,intersections,arrows.meta}
\begin{document}

\begin{tikzpicture}[scale=1]
...
\end{tikzpicture}

\end{document}
```

---

# 9. TikZ Libraries

Default libraries:

```tex
\usetikzlibrary{calc}
\usetikzlibrary{angles}
\usetikzlibrary{quotes}
\usetikzlibrary{intersections}
\usetikzlibrary{arrows.meta}
```

Can be combined:

```tex
\usetikzlibrary{calc,angles,quotes,intersections,arrows.meta}
```

Use libraries only when needed if possible.

Required by feature:

| Feature | Library |
|---|---|
| Angle marker | `angles`, `quotes` |
| Vector arrow | `arrows.meta` |
| Coordinate calculation | `calc` |
| Named intersections | `intersections` |

---

# 10. Number Formatting

## 10.1 Precision

Default precision: 3 decimal places.

Examples:

```txt
1.000 -> 1
1.250 -> 1.25
0.333333 -> 0.333
-0.000 -> 0
```

---

## 10.2 Formatting function

```ts
export function formatNumber(value: number, precision = 3): string {
  const rounded = Number(value.toFixed(precision));

  if (Object.is(rounded, -0)) {
    return "0";
  }

  return String(rounded);
}
```

---

## 10.3 Coordinate formatting

```ts
export function formatPoint(point: Point2D, precision = 3): string {
  return `(${formatNumber(point.x, precision)},${formatNumber(point.y, precision)})`;
}
```

---

# 11. Coordinate Naming

## 11.1 Point names

Points should use their object names when possible.

Example:

```tex
\coordinate (A) at (0,0);
\coordinate (B) at (4,0);
```

---

## 11.2 Valid TikZ identifiers

TikZ coordinate names should avoid problematic characters.

Allowed internal format:

```txt
A
B
C
O
M
H
P1
Q2
pointA
```

Avoid:

```txt
P_1
A-B
A B
α
```

Greek letters can be used as labels, not coordinate identifiers.

---

## 11.3 Name sanitization

Rules:

- remove spaces
- remove punctuation
- replace invalid characters
- ensure name starts with a letter
- avoid duplicates

Example:

```ts
export function sanitizeTikzName(name: string): string {
  const cleaned = name
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");

  if (!cleaned) {
    return "P";
  }

  if (/^[0-9]/.test(cleaned)) {
    return `P${cleaned}`;
  }

  return cleaned;
}
```

---

## 11.4 Duplicate handling

If name already exists:

```txt
A
A1
A2
A3
```

---

# 12. Object Export Order

Objects must be exported in deterministic order.

Recommended order:

1. Color definitions
2. Coordinates
3. Filled regions
4. Construction helpers
5. Lines
6. Segments
7. Rays
8. Vectors
9. Circles
10. Arcs
11. Polygons
12. Angles
13. Points
14. Labels
15. Measurements

---

# 13. Color Handling

## 13.1 Minimal mode

Use standard TikZ colors when possible:

```txt
black
white
gray
red
blue
green
cyan
magenta
yellow
orange
purple
brown
```

---

## 13.2 Custom colors

For custom hex colors:

```tex
\definecolor{noaddvoIceBlue}{HTML}{A8D8FF}
```

Generated names should be deterministic.

Example:

```txt
ndvColorA8D8FF
```

```tex
\definecolor{ndvColorA8D8FF}{HTML}{A8D8FF}
```

---

## 13.3 HEX normalization

Accept:

```txt
#A8D8FF
A8D8FF
#a8d8ff
```

Normalize to uppercase:

```txt
A8D8FF
```

---

# 14. Style Mapping

Geometry style should map to TikZ options.

Example style:

```ts
{
  stroke: "#A8D8FF",
  strokeWidth: 2,
  strokeOpacity: 1,
  fill: "#A8D8FF",
  fillOpacity: 0.15,
  dash: "solid"
}
```

TikZ:

```tex
[draw=ndvColorA8D8FF, line width=0.8pt, opacity=1]
```

---

## 14.1 Stroke width conversion

SVG pixels do not exactly equal TikZ points.

Approximate mapping:

```txt
1 px -> 0.4 pt
2 px -> 0.8 pt
3 px -> 1.2 pt
```

Function:

```ts
function strokeWidthToPt(px: number): string {
  return `${formatNumber(px * 0.4, 2)}pt`;
}
```

---

## 14.2 Dash mapping

```txt
solid  -> no option
dashed -> dashed
dotted -> dotted
```

---

## 14.3 Opacity mapping

TikZ:

```tex
opacity=0.5
draw opacity=0.5
fill opacity=0.2
```

Prefer:

```tex
draw opacity=...
fill opacity=...
```

for filled objects.

---

# 15. Point Export

## 15.1 Coordinate declaration

Each point should generate:

```tex
\coordinate (A) at (0,0);
```

---

## 15.2 Point marker

If `exportPoints` is true:

```tex
\fill (A) circle (1.5pt);
```

With style:

```tex
\fill[white] (A) circle (1.5pt);
```

---

## 15.3 Point label

If labels are enabled:

```tex
\node[above right] at (A) {$A$};
```

---

## 15.4 Full point example

```tex
\coordinate (A) at (0,0);
\fill (A) circle (1.5pt);
\node[below left] at (A) {$A$};
```

---

# 16. Segment Export

Segment AB:

```tex
\draw (A) -- (B);
```

With style:

```tex
\draw[blue, line width=0.8pt] (A) -- (B);
```

Segment labels are optional.

---

# 17. Line Export

An infinite line must be clipped to the visible export bounds.

Example:

```tex
% line through A and B
\draw (-5,-1) -- (7,3);
```

If using named points directly would create a segment, do not do this:

```tex
\draw (A) -- (B);
```

unless the user intentionally wants a segment.

For infinite lines, export two computed boundary points.

---

# 18. Ray Export

Ray from A through B:

```tex
% ray from A through B
\draw (A) -- (8,4);
```

The endpoint should be computed from export bounds.

---

# 19. Vector Export

Vector AB:

```tex
\draw[-{Latex}] (A) -- (B);
```

With style:

```tex
\draw[-{Latex}, blue, line width=0.8pt] (A) -- (B);
```

Requires:

```tex
\usetikzlibrary{arrows.meta}
```

---

# 20. Circle Export

## 20.1 Center-radius circle

```tex
\draw (O) circle (2);
```

---

## 20.2 Circle by center and point

Compute radius:

```tex
\draw (O) circle (2.5);
```

---

## 20.3 Circle through three points

Compute circumcenter and radius.

```tex
\coordinate (O) at (1.5,1.2);
\draw (O) circle (2.3);
```

If the center is not an explicit visible object, generated coordinate may be internal:

```tex
\coordinate (Oabc) at (1.5,1.2);
\draw (Oabc) circle (2.3);
```

---

# 21. Polygon Export

## 21.1 Outline only

```tex
\draw (A) -- (B) -- (C) -- cycle;
```

---

## 21.2 Filled polygon

```tex
\filldraw[fill=blue!15, draw=blue] (A) -- (B) -- (C) -- cycle;
```

---

## 21.3 Polygon with opacity

```tex
\filldraw[fill=blue, fill opacity=0.15, draw=blue] (A) -- (B) -- (C) -- cycle;
```

---

# 22. Arc Export

Arc should use center, radius, start angle, and end angle.

Example:

```tex
\draw (2,0) arc[start angle=0, end angle=90, radius=2];
```

For an arc centered at O:

```tex
\draw ($(O)+(2,0)$) arc[start angle=0, end angle=90, radius=2];
```

Requires `calc` if coordinate calculation is used.

---

# 23. Angle Export

Use TikZ angle pic.

```tex
\pic [draw, "$\alpha$", angle eccentricity=1.4, angle radius=0.6cm]
  {angle = A--B--C};
```

Where B is the vertex.

---

## 23.1 Right angle

Right angle marker:

```tex
\pic [draw, angle radius=0.4cm] {right angle = A--B--C};
```

---

## 23.2 Angle label

If label is provided:

```tex
"$\alpha$"
```

If no label:

```tex
\pic [draw, angle radius=0.6cm] {angle = A--B--C};
```

---

# 24. Text Export

Plain text:

```tex
\node at (1,2) {Hello};
```

Math text:

```tex
\node at (1,2) {$x^2+y^2=r^2$};
```

Escape unsafe characters in plain text.

Do not escape LaTeX text if `textMode = "latex"`.

---

# 25. Region Export

MVP region uses boundary points.

```tex
\fill[blue, opacity=0.15] (A) -- (B) -- (C) -- cycle;
```

If border should also be drawn:

```tex
\filldraw[fill=blue, fill opacity=0.15, draw=blue] (A) -- (B) -- (C) -- cycle;
```

---

# 26. Measurement Export

Measurements may be exported as labels.

Segment length:

```tex
\node at (2,0.2) {$4$};
```

Angle measurement:

```tex
\node at (1,1) {$60^\circ$};
```

MVP may skip measurement export unless user enables it.

---

# 27. Construction Object Export

Construction helper objects should be exported only if visible.

Examples:

- perpendicular bisector
- altitude
- median
- angle bisector

In Olympiad Mode, construction lines should be thin and gray.

```tex
\draw[gray, dashed] (-2,1) -- (5,1);
```

---

# 28. Labels

## 28.1 Label positions

Map internal label position to TikZ anchor:

| Internal | TikZ |
|---|---|
| above | above |
| below | below |
| left | left |
| right | right |
| above-left | above left |
| above-right | above right |
| below-left | below left |
| below-right | below right |

---

## 28.2 Label command

```tex
\node[above right] at (A) {$A$};
```

---

## 28.3 Label escaping

Object names used as labels should be wrapped in math mode:

```tex
$A$
```

Text labels should respect text mode.

---

# 29. Fill Rules

If fill opacity is zero:

Do not export fill.

If fill color is transparent:

Do not export fill.

If polygon has fill:

Use `\filldraw` if stroke is also visible.

Use `\fill` if no stroke.

---

# 30. Dash Rules

Internal dash style:

```txt
solid
dashed
dotted
```

TikZ:

```tex
dashed
dotted
```

Solid should omit dash option.

---

# 31. Arrow Rules

Vectors use:

```tex
-{Latex}
```

Ray arrows are optional.

Future arrow styles:

```txt
latex
stealth
triangle
none
```

---

# 32. Opacity Rules

For stroke-only objects:

```tex
draw opacity=0.5
```

For fill-only objects:

```tex
fill opacity=0.2
```

For filldraw:

```tex
fill opacity=0.2, draw opacity=1
```

Avoid global `opacity` unless both fill and stroke should share opacity.

---

# 33. TikZ Modes

The app supports four modes:

1. Minimal
2. Academic
3. Colorful
4. Olympiad

Each mode changes output style.

---

# 34. Minimal Mode

Goal:

Smallest clean output.

Characteristics:

- few comments
- minimal styling
- no unnecessary color definitions
- no excessive labels
- simple `\draw`
- simple `\fill`
- no advanced libraries unless needed

Example:

```tex
\begin{tikzpicture}
\coordinate (A) at (0,0);
\coordinate (B) at (4,0);
\coordinate (C) at (1,3);
\draw (A) -- (B) -- (C) -- cycle;
\end{tikzpicture}
```

---

# 35. Academic Mode

Goal:

Readable LaTeX code for papers and teaching.

Characteristics:

- comments enabled
- labels enabled
- points shown
- clean structure
- moderate styling
- stable naming

Example:

```tex
\begin{tikzpicture}[scale=1]

% Coordinates
\coordinate (A) at (0,0);
\coordinate (B) at (4,0);
\coordinate (C) at (1,3);

% Triangle
\draw (A) -- (B) -- (C) -- cycle;

% Points
\fill (A) circle (1.5pt);
\fill (B) circle (1.5pt);
\fill (C) circle (1.5pt);

% Labels
\node[below left] at (A) {$A$};
\node[below right] at (B) {$B$};
\node[above] at (C) {$C$};

\end{tikzpicture}
```

---

# 36. Colorful Mode

Goal:

Preserve visual appearance from canvas.

Characteristics:

- colors exported
- opacity exported
- fill exported
- line width exported
- dash exported
- labels exported
- custom color definitions enabled

Example:

```tex
\definecolor{ndvColorA8D8FF}{HTML}{A8D8FF}

\begin{tikzpicture}[scale=1]
\coordinate (A) at (0,0);
\coordinate (B) at (4,0);
\coordinate (C) at (1,3);

\filldraw[
  fill=ndvColorA8D8FF,
  fill opacity=0.15,
  draw=ndvColorA8D8FF,
  line width=0.8pt
] (A) -- (B) -- (C) -- cycle;

\end{tikzpicture}
```

---

# 37. Olympiad Mode

Goal:

Produce clean olympiad-style geometry figures.

Characteristics:

- thin black lines
- gray construction lines
- no excessive color
- small points
- serif math labels
- circles thin
- filled regions only if necessary
- angle markers clean

Default styles:

```txt
main lines: black
construction lines: gray dashed
points: black
labels: math mode
circles: black thin
```

Example:

```tex
\begin{tikzpicture}[scale=1]
\coordinate (A) at (0,0);
\coordinate (B) at (5,0);
\coordinate (C) at (1.5,3);

\draw (A) -- (B) -- (C) -- cycle;
\draw[gray, dashed] (C) -- (2,0);

\fill (A) circle (1.2pt);
\fill (B) circle (1.2pt);
\fill (C) circle (1.2pt);

\node[below left] at (A) {$A$};
\node[below right] at (B) {$B$};
\node[above] at (C) {$C$};
\end{tikzpicture}
```

---

# 38. tkz-euclide Compatibility

Future support may include `tkz-euclide`.

Example:

```tex
\usepackage{tkz-euclide}
```

Potential output:

```tex
\tkzDefPoint(0,0){A}
\tkzDefPoint(4,0){B}
\tkzDrawSegment(A,B)
\tkzDrawPoints(A,B)
\tkzLabelPoints(A,B)
```

MVP should focus on standard TikZ first.

`tkz-euclide` output can be added later.

---

# 39. Error Handling

The TikZ Generator must not crash.

If an object cannot be exported:

- skip the object
- add warning
- continue export

Example warning:

```ts
{
  code: "TIKZ_INVALID_CIRCLE",
  message: "Circle could not be exported because radius is zero.",
  objectId: "circle_123"
}
```

---

## 39.1 Error types

```ts
export type TikzWarning = {
  code: string;
  message: string;
  objectId?: string;
};

export type TikzError = {
  code: string;
  message: string;
  objectId?: string;
};
```

---

# 40. Export to `.tex`

Full `.tex` export must include:

- document class
- package imports
- TikZ libraries
- color definitions
- document body
- tikzpicture
- generated objects

Default:

```tex
\documentclass[tikz,border=5pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{calc,angles,quotes,intersections,arrows.meta}

\begin{document}

\begin{tikzpicture}[scale=1]
...
\end{tikzpicture}

\end{document}
```

---

# 41. Export to TikZ Snippet

Snippet export includes:

```tex
\begin{tikzpicture}[scale=1]
...
\end{tikzpicture}
```

No document class.

No `\begin{document}`.

---

# 42. Export to Clipboard

Clipboard copy should:

1. generate TikZ code
2. copy text
3. show success notification
4. preserve selected TikZ mode

The clipboard output should respect current options.

---

# 43. TikZ Preview

Future feature.

Possible approaches:

- use local LaTeX compiler server
- use browser LaTeX rendering where possible
- convert TikZ to SVG through backend
- integrate with external compiler

MVP does not require compiled TikZ preview.

---

# 44. Formatting Rules

## 44.1 Blank lines

Use blank lines between major sections.

Example:

```tex
% Coordinates
...

% Lines
...

% Points
...
```

---

## 44.2 Indentation

Inside `tikzpicture`, no indentation required for simple commands.

For multi-line options, indent two spaces.

Example:

```tex
\filldraw[
  fill=blue,
  fill opacity=0.2,
  draw=black
] (A) -- (B) -- (C) -- cycle;
```

---

## 44.3 Comments

Comments depend on option:

```ts
includeComments: boolean
```

Academic mode should enable comments.

Minimal mode should disable most comments.

---

## 44.4 Sorting

Objects should be sorted by:

1. layer order
2. object type order
3. creation time
4. object id

This ensures stable output.

---

# 45. Testing Requirements

TikZ Generator must have tests for:

- point export
- segment export
- line export
- ray export
- vector export
- circle export
- polygon export
- filled polygon export
- angle export
- label export
- color export
- opacity export
- dash export
- document wrapper
- number formatting
- name sanitization
- invalid object warning
- deterministic output

---

# 46. MVP Scope

MVP TikZ Generator includes:

- TikZ snippet export
- full `.tex` export
- point export
- segment export
- line export
- ray export
- vector export
- circle export
- polygon export
- angle export
- text export
- labels
- fill
- stroke
- opacity
- dash
- copy to clipboard
- TikZ mode selector

---

# 47. Future Scope

Future TikZ features may include:

- TikZ import
- tkz-euclide export
- TikZ preview
- syntax highlighting
- editable TikZ panel
- round-trip editing
- macro generation
- reusable style presets
- custom preamble
- export selected objects only
- export with coordinate scaling
- export with named styles
- export with theorem diagram templates

---

# 48. Definition of Done

The TikZ Generator is complete for MVP when:

- generated TikZ compiles in LaTeX
- point coordinates are exported correctly
- segments export correctly
- lines and rays clip to viewport/export bounds
- circles export correctly
- polygons export correctly
- fill and opacity work
- labels export correctly
- angles export with TikZ angle syntax
- copy button works
- `.tex` export works
- output is deterministic
- output is readable
- invalid objects do not crash the generator
- warnings are returned for skipped objects
- modes Minimal, Academic, Colorful, Olympiad work
- tests pass

---

# End of TIKZ_SPEC.md