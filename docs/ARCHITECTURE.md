# ARCHITECTURE.md

# NoadDVo Geometry Studio

Software Architecture Document

Version: 1.0

---

# 1. Purpose

This document describes the complete software architecture of
NoadDVo Geometry Studio.

It defines

- project structure
- rendering engine
- geometry engine
- state management
- event system
- TikZ generation
- interaction model

Every implementation should follow this architecture.

---

# 2. Architecture Philosophy

The project follows five principles.

## 1.

Geometry First

Everything revolves around geometry objects.

React components should never contain geometry calculations.

---

## 2.

Separation of Concerns

UI

↓

Interaction

↓

Geometry

↓

Export

Each layer only communicates with adjacent layers.

---

## 3.

Pure Geometry

Geometry algorithms must be independent from React.

Geometry engine should theoretically run inside NodeJS.

---

## 4.

Extensibility

Adding a new geometry tool should require

- new object
- renderer
- TikZ exporter

without changing old code.

---

## 5.

Predictable State

All application state belongs to stores.

No hidden component state.

---

# 3. Overall Architecture

+--------------------------------------------------------+

Application Shell

+--------------------------------------------------------+

↓

+--------------------------------------------------------+

UI Layer

+--------------------------------------------------------+

↓

+--------------------------------------------------------+

Interaction Layer

+--------------------------------------------------------+

↓

+--------------------------------------------------------+

Geometry Engine

+--------------------------------------------------------+

↓

+--------------------------------------------------------+

Rendering Engine

+--------------------------------------------------------+

↓

+--------------------------------------------------------+

TikZ Generator

+--------------------------------------------------------+

↓

Export System

---

# 4. Major Modules

The application contains

App Shell

↓

Canvas

↓

Toolbar

↓

Properties

↓

Geometry Store

↓

Tool Manager

↓

Renderer

↓

TikZ Generator

↓

Export Manager

↓

Persistence

---

# 5. Folder Structure

src/

app/

components/

canvas/

geometry/

renderer/

tools/

tikz/

store/

hooks/

styles/

types/

utils/

export/

import/

assets/

docs/

---

# 6. Detailed Folder Structure

src/

app/

App.tsx

main.tsx

providers/

routes/

---

components/

layout/

ui/

icons/

dialogs/

panels/

toolbar/

properties/

tikz/

statusbar/

---

canvas/

Canvas.tsx

Viewport.ts

Grid.tsx

Axis.tsx

Selection.tsx

Interaction.ts

Preview.tsx

---

geometry/

objects/

algorithms/

intersections/

constructions/

measurements/

styles/

serialization/

validation/

---

renderer/

PointRenderer.tsx

SegmentRenderer.tsx

LineRenderer.tsx

CircleRenderer.tsx

PolygonRenderer.tsx

AngleRenderer.tsx

RendererRegistry.ts

---

tools/

SelectTool.ts

MoveTool.ts

PointTool.ts

SegmentTool.ts

LineTool.ts

RayTool.ts

CircleTool.ts

PolygonTool.ts

AngleTool.ts

FillTool.ts

ConstructionTool.ts

---

tikz/

TikzGenerator.ts

TikzScene.ts

TikzStyles.ts

TikzExporter.ts

exporters/

PointExporter.ts

SegmentExporter.ts

CircleExporter.ts

PolygonExporter.ts

AngleExporter.ts

---

store/

GeometryStore.ts

UIStore.ts

HistoryStore.ts

SettingsStore.ts

ViewportStore.ts

---

export/

SVGExporter.ts

PNGExporter.ts

TexExporter.ts

JsonExporter.ts

---

import/

JsonImporter.ts

---

styles/

globals.css

tokens.css

theme.css

---

utils/

math.ts

uuid.ts

color.ts

events.ts

---

types/

geometry.ts

tools.ts

tikz.ts

ui.ts

---

# 7. Layer Responsibilities

UI Layer

Responsible for

buttons

panels

menus

dialogs

Never performs geometry calculations.

---

Interaction Layer

Responsible for

mouse

keyboard

touch

pointer

drag

selection

Never stores geometry.

---

Geometry Layer

Responsible for

mathematics

construction

dependencies

validation

No React.

Pure TypeScript.

---

Renderer Layer

Responsible for

SVG generation

Selection handles

Preview

Grid

Axis

---

TikZ Layer

Responsible only for

TikZ generation.

---

Persistence Layer

Responsible for

Save

Load

Autosave

Serialization

---

# 8. Dependency Rule

Allowed

UI

↓

Store

↓

Geometry

↓

Math

Forbidden

Geometry

↓

React

Forbidden

TikZ

↓

React

Forbidden

Renderer

↓

Business Logic

---

# 9. Application Boot

App

↓

Theme

↓

Stores

↓

Canvas

↓

Toolbar

↓

Renderer

↓

Ready

---

# 10. Rendering Pipeline

Geometry Objects

↓

Visibility Filter

↓

Viewport Transform

↓

Renderer Registry

↓

SVG Elements

↓

Browser
# 11. Geometry Engine

The Geometry Engine is the heart of the application.

It owns every mathematical object.

It contains no React code.

It contains no DOM code.

It contains no SVG code.

It only knows mathematics.

Responsibilities

- create geometry
- update geometry
- dependency tracking
- intersection calculation
- validation
- measurements
- serialization

---

# 12. Geometry Object Model

Every geometry object inherits from BaseGeometryObject.

```ts
interface BaseGeometryObject {

id: string;

type: GeometryType;

name?: string;

visible: boolean;

locked: boolean;

style: GeometryStyle;

dependencies: string[];

dependents: string[];

metadata: Record<string, unknown>;

createdAt: number;

updatedAt: number;

}
```

---

Every object MUST be immutable.

Updates produce new objects.

Never mutate.

---

# 13. Geometry Types

Supported objects

Point

Segment

Line

Ray

Vector

Circle

Arc

Ellipse

Polygon

Polyline

Angle

Label

Image

Measurement

Region

Construction

Guide

Future

Bezier

Spline

3D Objects

---

# 14. Scene Graph

The application maintains one Scene.

```
Scene

↓

Objects

↓

Renderer

↓

SVG
```

Scene interface

```ts
interface GeometryScene{

objects: Map<string,GeometryObject>;

selection:Set<string>;

viewport:Viewport;

settings:SceneSettings;

}
```

Objects never know renderer.

Renderer reads scene.

---

# 15. Dependency Graph

Every construction creates graph edges.

Example

```
Point A

Point B

↓

Segment AB

↓

Midpoint M

↓

Circle(O,M)

↓

Angle
```

Moving A

↓

Segment updates

↓

Midpoint updates

↓

Circle updates

↓

Angle updates

No manual refresh.

---

Dependencies form a Directed Acyclic Graph.

Cycles are forbidden.

---

# 16. Geometry Algorithms

Algorithms belong in

geometry/algorithms

Never inside React.

Examples

distance()

midpoint()

projection()

intersection()

circumcenter()

incenter()

orientation()

area()

perimeter()

polygonContains()

angle()

normalizeVector()

rotatePoint()

Every function should be pure.

Example

```ts
function midpoint(a,b){

return{

x:(a.x+b.x)/2,

y:(a.y+b.y)/2

}

}
```

---

# 17. Coordinate System

World coordinates

Cartesian.

Positive X

Right.

Positive Y

Up.

Screen coordinates

Positive X

Right.

Positive Y

Down.

Viewport converts between both.

Functions

screenToWorld()

worldToScreen()

---

# 18. Viewport

Viewport controls camera.

```ts
interface Viewport{

scale:number;

offsetX:number;

offsetY:number;

}
```

Functions

zoom()

pan()

fit()

center()

reset()

---

Zoom centered around cursor.

---

# 19. Grid System

Grid exists only visually.

Grid is never stored.

Grid spacing

Adaptive.

Examples

Scale

0.5

↓

Grid

50

Scale

2

↓

Grid

10

Major grid every

5 cells.

---

# 20. Snap Engine

Snap Manager computes candidate targets.

Priority

Point

↓

Intersection

↓

Midpoint

↓

Circle

↓

Segment

↓

Line

↓

Grid

Nearest valid target wins.

Configurable radius

12 px.

Future

Magnetic snapping.

---

# 21. Tool Manager

Exactly one tool active.

Tool interface

```ts
interface Tool{

id:string;

icon:string;

cursor:string;

onPointerDown();

onPointerMove();

onPointerUp();

onCancel();

}
```

Tool Manager dispatches events.

Canvas never knows tool logic.

---

# 22. Event System

All pointer events go through

Interaction Manager.

```
Mouse

↓

Interaction

↓

Active Tool

↓

Geometry Store

↓

Renderer

↓

SVG
```

No component directly modifies geometry.

---

# 23. Selection Engine

Selection supports

single

multiple

rectangle

group

Selection stores IDs only.

Never copies objects.

Selection overlay rendered separately.

---

# 24. Hover Engine

Hover calculated every pointer move.

Stores

hoveredObjectId

Only one hover target.

Priority

Point

↓

Handle

↓

Label

↓

Segment

↓

Polygon

↓

Circle

↓

Line

---

# 25. Preview Engine

Preview exists while drawing.

Examples

Segment preview

Circle preview

Polygon preview

Preview objects

Not stored.

Not exported.

Not serialized.

Only rendered.

---

# 26. Hit Testing

Renderer exposes

hitTest()

Returns

GeometryObject

or

null.

Priority

Point

↓

Vertex

↓

Segment

↓

Polygon

↓

Circle

↓

Line

↓

Grid

Uses screen distance.

---

# 27. Render Pipeline

Scene

↓

Visible Objects

↓

Viewport Transform

↓

Renderer Registry

↓

SVG Elements

↓

Browser

Renderer never changes geometry.

---

# 28. Renderer Registry

Each object type owns renderer.

PointRenderer

SegmentRenderer

CircleRenderer

PolygonRenderer

AngleRenderer

Future additions

BezierRenderer

SplineRenderer

Renderer interface

```ts
interface GeometryRenderer{

render(object,context)

}
```

No switch(type) everywhere.

Use registry pattern.

---

# 29. Object Factory

Objects created by factory.

Example

createPoint()

createSegment()

createCircle()

Benefits

Validation

Defaults

Naming

IDs

Styles

Centralized creation.

---

# 30. Validation

Geometry validated before commit.

Examples

Segment

Two distinct points.

Circle

Radius > 0.

Polygon

Minimum three vertices.

Construction

Dependencies exist.

Invalid objects rejected.
# 31. State Management

The application uses Zustand as the primary state manager.

The state is divided into independent domains.

Stores must never depend on each other directly.

Communication happens through actions.

---

Stores

GeometryStore

UIStore

ViewportStore

HistoryStore

SettingsStore

ClipboardStore

ProjectStore

ExportStore

---

# 32. Geometry Store

GeometryStore is the source of truth.

It owns

Objects

Selection

Current Tool

Construction State

Dependencies

Current Project

Interface

GeometryStore

↓

Objects

↓

Selection

↓

Actions

↓

Computed Values

---

Actions

addObject()

updateObject()

removeObject()

select()

clearSelection()

duplicate()

lock()

unlock()

hide()

show()

rename()

moveObject()

Every action creates history entry.

---

# 33. UI Store

UI state never contains geometry.

Stores

Theme

Opened Panels

Active Sidebar

Dialogs

Notifications

Current Cursor

Hovered Tool

Command Palette

Search Query

UI can be reset without affecting geometry.

---

# 34. Viewport Store

Viewport controls camera.

Properties

scale

offsetX

offsetY

gridSize

snapEnabled

showGrid

showAxes

Functions

zoomIn()

zoomOut()

pan()

fitToObjects()

centerOrigin()

resetView()

---

# 35. History Store

Undo/Redo uses command history.

History stores Commands instead of full snapshots
(after MVP).

Temporary MVP

Snapshot based.

Future

Command pattern.

History Entry

id

timestamp

description

undo()

redo()

Commands

CreateObject

DeleteObject

MoveObject

StyleObject

RenameObject

ImportProject

ExportSettings

Undo depth

Unlimited until memory limit.

---

# 36. Clipboard Store

Stores copied geometry.

Supports

Copy

Paste

Duplicate

Future

Cross-tab copy

Clipboard format

Internal JSON.

---

# 37. Settings Store

Contains

Theme

Language

Grid Size

Snap Radius

TikZ Options

Export Preferences

Autosave

Always persisted.

---

# 38. Project Store

Contains

Project Name

Author

Created Date

Modified Date

Version

Description

Recent Files

Autosave

Future

Cloud Metadata

---

# 39. Event Bus

Large systems should communicate through Event Bus.

Examples

Object Created

↓

Renderer Refresh

↓

TikZ Refresh

↓

History Update

↓

Autosave

Example Events

ObjectAdded

ObjectDeleted

SelectionChanged

ViewportChanged

ThemeChanged

ProjectLoaded

ExportCompleted

---

# 40. Command Pattern

Every user action becomes a command.

CreatePointCommand

MovePointCommand

DeleteObjectCommand

ChangeStyleCommand

RenameCommand

Benefits

Undo

Redo

Macro Recording (future)

History Compression

---

# 41. Serialization

Every geometry object must serialize itself.

Interface

serialize()

deserialize()

Output

Pure JSON.

No functions.

No React state.

No DOM references.

---

# 42. Project File Format

Extension

.ndv

Structure

{
  "version":1,
  "project":{},
  "viewport":{},
  "settings":{},
  "objects":[],
  "metadata":{}
}

Versioned from day one.

Future versions remain backward compatible.

---

# 43. Autosave

Autosave every

60 seconds

Also autosave

Before page unload

After import

After major operations

Storage

IndexedDB

Fallback

LocalStorage

---

# 44. TikZ Generator Architecture

TikZ generation is a separate subsystem.

Pipeline

Geometry Scene

↓

Object Exporters

↓

TikZ Scene

↓

Formatter

↓

Code

Renderer never knows TikZ.

TikZ never knows React.

---

# 45. TikZ Exporter Registry

Each geometry object owns exporter.

PointExporter

SegmentExporter

CircleExporter

PolygonExporter

AngleExporter

ArcExporter

VectorExporter

Registry

Object Type

↓

Exporter

↓

TikZ String

Avoid giant switch statements.

---

# 46. TikZ Formatter

Responsible for

Indentation

Comments

Grouping

Coordinate naming

Number formatting

Sorting

Never calculate geometry.

Only format.

---

# 47. Export Manager

Supported exports

TikZ

TEX

SVG

PNG

JSON

Future

PDF

GeoGebra

DXF

Pipeline

Scene

↓

Exporter

↓

Blob

↓

Download

---

# 48. Import Manager

Supports

JSON

Future

GeoGebra

TikZ

SVG

Import process

Read

↓

Validate

↓

Deserialize

↓

Geometry Store

↓

Render

---

# 49. Plugin System

Future architecture.

Plugin API

registerTool()

registerRenderer()

registerExporter()

registerPanel()

registerShortcut()

Plugins never modify core code.

---

# 50. Renderer Performance

Renderer should avoid full rerender.

Strategy

Render only changed objects.

Memoize SVG.

Separate

Grid

Selection

Preview

Geometry

Labels

Independent layers.

---

# 51. Object Caching

Expensive calculations cached.

Examples

Bounding Box

Area

Perimeter

Center

Screen Coordinates

Cache invalidated only when needed.

---

# 52. Viewport Optimization

Viewport transform calculated once.

All renderers reuse transform.

Avoid repeated calculations.

---

# 53. Selection Optimization

Selection overlay rendered separately.

No rerender of geometry.

Only overlay updates.

---

# 54. Geometry Optimization

Intersection cache.

Distance cache.

Bounding box cache.

Dependency traversal cache.

Future

Spatial Index

QuadTree

---

# 55. Rendering Strategy

SVG chosen for

Accessibility

Precision

DOM inspection

TikZ similarity

Future

Canvas rendering for huge scenes.

---

# 56. Memory Management

Objects immutable.

Unused previews destroyed.

History compressed.

Large exports streamed.

Avoid memory leaks.

---

# 57. Error Recovery

Any geometry error

↓

Reject operation

↓

Show notification

↓

Keep scene intact

Never corrupt project.

---

# 58. Logging

Development

Verbose

Geometry timing

Render timing

History timing

Production

Warnings

Errors

No console spam.

---

# 59. Build Strategy

Development

Fast Refresh

Production

Minified

Tree Shaken

Code Split

Lazy Panels

Dynamic Imports

---

# 60. Definition of Architecture Complete

Architecture is complete when

✓ UI independent from Geometry

✓ Geometry independent from React

✓ Renderer independent from TikZ

✓ TikZ independent from SVG

✓ Stores separated

✓ Export separated

✓ History separated

✓ Plugin-ready

✓ Easy to extend

✓ Easy to test
# 61. Geometry Dependency Engine

The Dependency Engine maintains relationships between geometry objects.

Every object may depend on one or more parent objects.

Example:

Point A
Point B
↓

Segment AB
↓

Midpoint M
↓

Circle(M, A)

If Point A changes:

↓

Segment updates

↓

Midpoint updates

↓

Circle updates

Dependencies are directional.

The graph must remain acyclic.

---

Responsibilities

• Track parent-child relationships

• Detect invalid dependencies

• Prevent cycles

• Trigger recalculation

• Optimize update order

---

Data Structure

interface DependencyNode {

id: string;

parents: string[];

children: string[];

}

---

Recalculation Strategy

Topological Sort

↓

Update Parents

↓

Update Children

↓

Render

---

# 62. Construction Engine

Construction Engine computes derived geometry.

Supported constructions

Midpoint

Perpendicular

Parallel

Intersection

Altitude

Median

Angle Bisector

Perpendicular Bisector

Circumcenter

Incenter

Orthocenter

Centroid

Incircle

Circumcircle

Each construction is deterministic.

Construction objects never store coordinates directly.

Coordinates are derived.

---

# 63. Geometry Validation Engine

Before committing an object:

Validate.

Examples

Segment

Different endpoints.

Circle

Radius > 0

Polygon

Minimum 3 vertices

Angle

Three distinct points

Invalid geometry should never enter the Scene.

---

# 64. Rendering Engine

Rendering Engine converts geometry into SVG.

Pipeline

Geometry Scene

↓

Visibility Filter

↓

Viewport Transform

↓

Geometry Renderer

↓

SVG Elements

↓

DOM

Renderer is stateless.

Renderer never edits objects.

---

# 65. SVG Layering

Render order

Grid

↓

Axes

↓

Regions

↓

Polygons

↓

Circles

↓

Lines

↓

Segments

↓

Vectors

↓

Arcs

↓

Points

↓

Labels

↓

Selection

↓

Preview

Each layer is rendered independently.

---

# 66. Label Engine

Responsible for:

Object labels

Coordinate labels

Measurement labels

Angle labels

Rules

Avoid overlapping where possible.

Labels follow object movement.

Label position options

Above

Below

Left

Right

Above Left

Above Right

Below Left

Below Right

---

# 67. Measurement Engine

Provides:

Distance

Angle

Area

Perimeter

Radius

Diameter

Circumference

Centroid

Bounding Box

These values are computed on demand.

Cached when possible.

---

# 68. Hit Test Engine

Purpose

Detect object under cursor.

Priority

Point

↓

Handle

↓

Label

↓

Segment

↓

Polygon

↓

Circle

↓

Line

↓

Grid

Algorithm

Bounding Box

↓

Distance Check

↓

Precise Geometry Test

---

# 69. Tool Framework

Every tool implements:

interface Tool {

id

name

icon

cursor

shortcut

activate()

deactivate()

pointerDown()

pointerMove()

pointerUp()

cancel()

renderPreview()

}

Tools never directly manipulate SVG.

Tools dispatch actions.

---

# 70. Tool Lifecycle

Inactive

↓

Activate

↓

Pointer Down

↓

Pointer Move

↓

Pointer Up

↓

Commit

↓

Deactivate

Escape

↓

Cancel

---

# 71. Cursor Manager

Cursor changes according to active tool.

Examples

Pointer

Move

Crosshair

Grab

Grabbing

Text

Zoom In

Zoom Out

Forbidden

Custom animated cursors.

---

# 72. Selection Overlay

Selection is rendered separately.

Contains

Bounding Box

Resize Handles

Rotation Handle (future)

Highlight

Selection never modifies geometry.

---

# 73. Clipboard System

Copy

↓

Serialize Objects

↓

Clipboard

Paste

↓

Deserialize

↓

Assign New IDs

↓

Insert Scene

Referenced objects must remain valid.

---

# 74. Import Pipeline

Read File

↓

Validate Version

↓

Parse JSON

↓

Deserialize Objects

↓

Validate Dependencies

↓

Insert Scene

↓

Render

---

# 75. Export Pipeline

Scene

↓

Validation

↓

Formatter

↓

Exporter

↓

Download

Supported

SVG

PNG

TEX

TikZ

JSON

---

# 76. Autosave Strategy

Autosave triggers

Every 60 seconds

Project Close

Large Operation

Import

History Threshold

Autosave should never interrupt interaction.

---

# 77. Theme Engine

Theme defined using CSS Variables.

Dark Arctic

Default.

Future

Light

High Contrast

Custom Themes

Components never hardcode colors.

---

# 78. Performance Strategy

Target

60 FPS

Avoid

Full rerender

Large DOM updates

Repeated calculations

Strategies

Memoization

Viewport Caching

Bounding Box Cache

Object Cache

Intersection Cache

Lazy Panels

Virtual Lists

---

# 79. Error Recovery

If an operation fails

↓

Rollback

↓

Show Notification

↓

Keep Scene Valid

No corrupted state.

No partial updates.

---

# 80. Logging Strategy

Development

Geometry timing

Render timing

Store updates

Pointer events

Production

Warnings

Critical Errors

No verbose logs.

---

# 81. Testing Architecture

Unit Tests

Geometry Algorithms

Store Actions

TikZ Export

Integration Tests

Canvas Interaction

Selection

Undo

Construction

UI Tests

Panels

Toolbar

Dialogs

Visual Regression

Canvas

TikZ

---

# 82. Build Pipeline

Source

↓

TypeScript

↓

Vite

↓

Bundle

↓

Minify

↓

Tree Shake

↓

Deploy

---

# 83. Deployment

Static Hosting

Vercel

Netlify

Cloudflare Pages

GitHub Pages

Future

Electron

Desktop App

---

# 84. Security

No server required.

No authentication.

No remote execution.

Sanitize imported files.

Escape all user text before rendering.

Prevent XSS.

---

# 85. Coding Rules

No component larger than 300 lines.

No function larger than 80 lines.

No circular imports.

No geometry inside React components.

No TikZ inside UI components.

No duplicated calculations.

Always use strict TypeScript.

---

# 86. Documentation Rules

Every exported function

↓

JSDoc

Every geometry algorithm

↓

Formula

↓

Reference

↓

Complexity

---

# 87. Project Evolution

Version 1

Interactive Geometry

TikZ

Export

Version 2

Macros

Animation

Templates

Version 3

Plugin API

Cloud Sync

Collaboration

3D

---

# 88. Architecture Principles Summary

The architecture must always satisfy:

✓ Geometry independent from UI

✓ UI independent from TikZ

✓ TikZ independent from SVG

✓ Renderer independent from Store

✓ Tools independent from Renderer

✓ Export independent from UI

✓ Stores independent from Components

✓ Pure Geometry Engine

✓ Extensible Tool System

✓ Plugin Ready

✓ Testable

✓ High Performance

---

# End of Architecture Document