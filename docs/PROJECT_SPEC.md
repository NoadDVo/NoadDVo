# PROJECT_SPEC.md

# NoadDVo Geometry Studio

Version: 1.0
Status: Draft
Author: NoadDVo
Last Updated: 2026

---

# 1. Product Overview

## 1.1 Project Name

NoadDVo Geometry Studio

---

## 1.2 Product Description

NoadDVo Geometry Studio là một ứng dụng web hình học tương tác (Interactive Geometry Application) lấy cảm hứng từ GeoGebra, nhưng được thiết kế lại hoàn toàn với mục tiêu trở thành công cụ mạnh nhất dành cho người sử dụng LaTeX/TikZ.

Thay vì tập trung vào CAS hay đại số, sản phẩm tập trung vào:

- Vẽ hình học chính xác
- Sinh mã TikZ theo thời gian thực
- Giao diện hiện đại
- Trải nghiệm cao cấp
- Dễ sử dụng cho giáo viên, học sinh và người làm tài liệu toán.

Ứng dụng hoạt động hoàn toàn trên trình duyệt và không yêu cầu cài đặt.

---

# 2. Vision

## Our Vision

Create the best geometry drawing application for LaTeX users.

The application should combine:

- GeoGebra interaction
- TikZ export quality
- Modern UI
- Fast performance
- Beautiful experience

The goal is NOT to replace GeoGebra.

The goal is to become the best geometry editor for academic publishing.

---

# 3. Target Users

## Primary Users

### Teachers

Need:

- Draw geometry
- Export TikZ
- Prepare exams
- Prepare lecture notes

### Students

Need:

- Learn geometry
- Solve olympiad problems
- Practice constructions

### Researchers

Need:

- Publication-quality figures

### LaTeX Users

Need:

- Clean TikZ code
- Fast workflow

### Content Creators

Need:

- SVG export
- PNG export
- High quality diagrams

---

# 4. Product Philosophy

The application should feel:

- Fast
- Minimal
- Elegant
- Accurate
- Professional
- Inspiring

The interface should never feel crowded.

Everything should have clear hierarchy.

---

# 5. Product Goals

The product has five primary goals.

## Goal 1

Interactive Geometry.

Users should be able to create geometry naturally.

---

## Goal 2

Realtime TikZ generation.

Every modification immediately updates TikZ.

No manual export step is required.

---

## Goal 3

Beautiful UI.

The application should look premium.

Inspired by:

- Apple
- Linear
- Framer
- Arctic fashion editorials
- Modern architecture websites

---

## Goal 4

Extensible architecture.

Every geometry object should be modular.

New geometry tools can be added without rewriting existing code.

---

## Goal 5

Educational quality.

The application should encourage clean geometric constructions.

---

# 6. Product Principles

## Principle 1

Geometry first.

Everything revolves around geometry objects.

---

## Principle 2

TikZ is a first-class feature.

TikZ is NOT an export plugin.

TikZ is one of the core systems.

---

## Principle 3

No unnecessary complexity.

Avoid hidden settings.

Keep interactions intuitive.

---

## Principle 4

Every action must feel responsive.

Target:

Interaction latency < 16 ms.

---

## Principle 5

UI should disappear.

The canvas should remain the focus.

---

# 7. Supported Platforms

Desktop:

- Chrome
- Edge
- Firefox
- Safari

Tablet:

- iPad
- Android Tablet

Mobile:

Read-only mode initially.

Editing later.

---

# 8. Technology Stack

Frontend

- React
- TypeScript
- Vite

State Management

- Zustand

Styling

- TailwindCSS

Rendering

- SVG

Utilities

- clsx
- uuid
- lodash-es

Future

- Dexie
- IndexedDB
- KaTeX
- MathJax

---

# 9. Core Modules

The application consists of the following systems.

1.

Application Shell

2.

Canvas Engine

3.

Geometry Engine

4.

Construction Engine

5.

Selection Engine

6.

Property System

7.

History Manager

8.

TikZ Generator

9.

Export Manager

10.

Import Manager

11.

Theme Manager

12.

Shortcut Manager

---

# 10. Main Screens

## Landing Screen

Contains

- logo

- recent projects

- new project

- open project

- documentation

---

## Main Workspace

Contains

Top Navigation

Left Toolbar

Canvas

Properties Panel

TikZ Panel

Status Bar

---

## Settings

Contains

Theme

Grid

Snap

Language

TikZ Settings

Export Settings

---

# 11. Workspace Layout

-----------------------------------------------------
 Top Navigation
-----------------------------------------------------

 Toolbar | Canvas | Properties

 Toolbar | Canvas | Properties

 Toolbar | Canvas | Properties

-----------------------------------------------------
 TikZ Panel
-----------------------------------------------------

---

# 12. Navigation Bar

Must include

Logo

Project Name

Undo

Redo

Save

Export

Settings

Theme Toggle

Help

---

# 13. Left Toolbar

The toolbar should support categories.

Selection

Move

Points

Lines

Circles

Polygons

Angles

Measurements

Transformations

Text

Fill

Construction

Utilities

---

# 14. Canvas

The canvas is the heart of the application.

Requirements

Infinite feeling

Pan

Zoom

Snap

Grid

Axis

Object previews

Selection box

Multi-selection

Keyboard interaction

Drag and drop

High performance

---

# 15. Geometry Objects

Supported geometry objects.

Point

Segment

Infinite Line

Ray

Vector

Circle

Ellipse

Arc

Polygon

Polyline

Angle

Region

Text

Image

Measurement

Construction Line

Helper Object

---

# 16. Object Properties

Every geometry object shares:

ID

Type

Name

Visible

Locked

Layer

Style

Metadata

Dependencies

Creation Time

Update Time

---

# 17. Style Properties

Every drawable object supports:

Stroke Color

Stroke Width

Stroke Opacity

Fill Color

Fill Opacity

Dash Style

Point Size

Arrow Style

Glow

Shadow

Rotation

Scale

Visibility

Label Position

Label Visibility
# 18. Geometry Tool Specification

Every tool in the application must follow a unified interaction model.

Each tool has:

- icon
- id
- display name
- shortcut
- cursor
- interaction state
- preview rendering
- completion rule
- cancellation rule

Only one tool can be active at any time.

---

## 18.1 Select Tool

Purpose

Select existing geometry objects.

Functions

- click to select
- Ctrl+click multi-select
- drag selection rectangle
- move selected objects
- edit properties
- delete
- duplicate

Cursor

Default arrow.

---

## 18.2 Move Tool

Purpose

Move objects.

Supports

- points
- polygons
- labels
- circles
- groups

Dragging should update all dependent constructions.

---

## 18.3 Point Tool

Interaction

Single click creates one point.

If snapping is enabled:

Point snaps to

- grid
- existing point
- line
- segment
- circle
- intersection

Automatic naming:

A
B
C
...

After Z:

A1
B1
...

---

## 18.4 Segment Tool

Workflow

Click first point

↓

Click second point

↓

Create segment

Preview line shown while moving mouse.

If clicking empty space:

Automatically create point.

---

## 18.5 Infinite Line Tool

Workflow

Point A

↓

Point B

↓

Create infinite line.

Rendering

Line extends beyond viewport.

---

## 18.6 Ray Tool

Workflow

Point A

↓

Point B

↓

Create ray starting at A passing through B.

---

## 18.7 Vector Tool

Workflow

Point A

↓

Point B

↓

Render arrow.

Arrow style configurable.

---

## 18.8 Circle Tool

Modes

Center + Radius Point

Center + Radius Value

Three Points

Compass Construction

Default mode

Center + Radius Point.

Preview shown before second click.

---

## 18.9 Polygon Tool

Workflow

Click vertices.

Preview current edge.

Finish by

- clicking first point
- Enter
- Double click

Escape cancels.

Supports

triangle

quadrilateral

n-gon

---

## 18.10 Arc Tool

Modes

Center-start-end

Three points

Start-angle-length

---

## 18.11 Angle Tool

Select

Point

↓

Vertex

↓

Point

Angle marker appears.

Supports

label

radius

color

right-angle symbol

---

## 18.12 Text Tool

Click canvas.

Insert editable text.

Supports

LaTeX

Plain text

Math symbols

---

## 18.13 Fill Tool

Click inside closed polygon.

Fill region.

Supports

solid color

opacity

pattern (future)

---

# 19. Construction Tools

Construction objects remain linked to parents.

Changing parent updates child automatically.

---

## Midpoint

Input

Two points.

Output

One midpoint.

---

## Intersection

Supports

Line-Line

Line-Circle

Circle-Circle

Segment-Line

Segment-Segment

Ray-Line

Ray-Ray

---

## Parallel Line

Input

Point

Line

Output

Parallel line.

---

## Perpendicular Line

Input

Point

Line

Output

Perpendicular line.

---

## Perpendicular Bisector

Input

Segment

Output

Perpendicular bisector.

---

## Angle Bisector

Input

Three points.

Output

Bisector line.

---

## Median

Input

Triangle

Output

Median.

---

## Altitude

Input

Triangle

Output

Altitude.

---

## Circumcircle

Input

Triangle

Output

Circumcircle.

---

## Incircle

Input

Triangle

Output

Incircle.

---

# 20. Interaction Rules

All tools follow common rules.

Left Click

Primary action.

Right Click

Context menu.

Double Click

Edit object.

Escape

Cancel current tool.

Enter

Complete construction.

Delete

Delete selection.

Ctrl+C

Copy.

Ctrl+V

Paste.

Ctrl+D

Duplicate.

Ctrl+A

Select all.

---

# 21. Mouse Behaviour

Mouse Down

Begin action.

Mouse Move

Update preview.

Mouse Up

Commit action.

Dragging

Continuous update.

Scroll Wheel

Zoom.

Middle Mouse

Pan.

Shift + Scroll

Horizontal pan.

---

# 22. Snap System

Snap improves precision.

Snap targets

Grid

Existing Point

Segment Endpoint

Midpoint

Line

Circle

Intersection

Nearest Vertex

Snap radius configurable.

Default

12 pixels.

Visual feedback

Blue highlight.

---

# 23. Selection System

Supports

Single selection

Multiple selection

Selection rectangle

Group movement

Selection outline

Selection glow

Selection handles

Properties panel updates immediately.

---

# 24. Layer System

Every object belongs to one layer.

Default layer

Geometry

Future layers

Background

Annotation

Construction

Helper

Image

Locked

Hidden

Layer order determines render priority.

---

# 25. Command Palette

Shortcut

Ctrl + K

Search

Tools

Commands

Export

Settings

Theme

Open project

Recent projects

Every action should be searchable.

---

# 26. Undo / Redo

Unlimited while session active.

Keyboard

Ctrl + Z

Ctrl + Shift + Z

Toolbar buttons.

History stores

Object creation

Deletion

Style edits

Movement

Construction

Import

Export settings

---

# 27. Clipboard

Supports

Copy

Paste

Duplicate

Internal format

JSON

Future

SVG clipboard

TikZ clipboard

---

# 28. Project Saving

Project format

.ndv

Internally JSON.

Contains

Objects

Styles

Viewport

Settings

History (optional)

Metadata

---

# 29. Import

Supported

JSON

SVG (future)

GeoGebra (future)

TikZ parsing (future)

---

# 30. Export

Supported

SVG

PNG

PDF

TikZ

LaTeX

JSON

Future

GeoGebra

DXF
# 31. Functional Requirements

This section defines all functional requirements (FR) of NoadDVo Geometry Studio.

Each requirement has:

- ID
- Priority
- Description
- Acceptance Criteria

Priority levels:

Critical
High
Medium
Low

---

# FR-001

Title

Application Startup

Priority

Critical

Description

The application shall load the workspace in less than 3 seconds on a modern desktop browser.

Acceptance

✓ Loading screen appears.

✓ Main workspace loads.

✓ Toolbar visible.

✓ Canvas visible.

✓ No JavaScript errors.

---

# FR-002

Title

Create Point

Priority

Critical

Description

User can create a point by clicking on the canvas.

Acceptance

✓ Point appears.

✓ Point stored.

✓ Point selectable.

✓ Point rendered.

---

# FR-003

Title

Move Point

Priority

Critical

Description

Dragging a point updates its position.

Acceptance

✓ Point moves smoothly.

✓ Connected objects update immediately.

✓ No visual lag.

---

# FR-004

Title

Delete Object

Priority

Critical

Description

User can delete selected objects.

Acceptance

✓ Object removed.

✓ Dependencies handled.

✓ TikZ updated.

---

# FR-005

Title

Undo

Priority

Critical

Acceptance

Undo restores previous geometry state.

---

# FR-006

Title

Redo

Priority

Critical

Acceptance

Redo restores undone operation.

---

# FR-007

Title

Pan Canvas

Priority

Critical

Acceptance

Middle mouse drag pans viewport.

---

# FR-008

Title

Zoom Canvas

Priority

Critical

Acceptance

Mouse wheel zooms centered around cursor.

---

# FR-009

Title

Snap

Priority

High

Acceptance

Objects snap to enabled targets.

---

# FR-010

Title

Selection

Priority

Critical

Acceptance

Single click selects object.

Ctrl+Click multi-selects.

---

# FR-011

Create Segment

---

User selects two points.

Segment is created.

---

# FR-012

Create Line

---

User selects two points.

Infinite line rendered.

---

# FR-013

Create Ray

---

User selects two points.

Ray rendered.

---

# FR-014

Create Vector

---

Arrow rendered.

---

# FR-015

Create Circle

---

Center

↓

Radius Point

↓

Circle

---

# FR-016

Create Polygon

---

Multiple vertices.

Finish by Enter.

---

# FR-017

Fill Polygon

---

User chooses fill color.

Region updates.

TikZ updates.

---

# FR-018

Label Object

---

Objects support labels.

---

# FR-019

Edit Style

---

User edits

Stroke

Fill

Opacity

Width

Dash

---

# FR-020

Property Panel

---

Selecting object updates panel.

Editing panel updates object.

---

# FR-021

Export TikZ

---

Realtime TikZ generated.

---

# FR-022

Copy TikZ

---

Copy button copies valid TikZ.

---

# FR-023

Export TEX

---

Standalone TEX generated.

---

# FR-024

Export SVG

---

Current scene exported.

---

# FR-025

Export PNG

---

Current viewport exported.

---

# FR-026

Save Project

---

Project stored locally.

---

# FR-027

Open Project

---

JSON loaded.

Objects restored.

---

# FR-028

Keyboard Shortcuts

---

Ctrl+Z

Ctrl+Y

Ctrl+C

Ctrl+V

Delete

Ctrl+K

---

# FR-029

Dark Theme

---

Enabled by default.

---

# FR-030

Responsive Layout

---

Desktop optimized.

Tablet supported.

---

# 32. Non Functional Requirements

Performance

Reliability

Maintainability

Accessibility

Security

Scalability

---

## Performance

Canvas FPS

Target

60 FPS

Minimum

30 FPS

---

Maximum render latency

16 ms

---

Maximum startup

3 seconds

---

Maximum memory

500 MB

Typical

<150 MB

---

Geometry update

Instant.

---

TikZ update

Under

100 ms

---

## Reliability

Application should never crash from invalid geometry.

Gracefully recover.

---

Autosave every

60 seconds.

---

Recover last session.

---

## Maintainability

Code should follow:

SOLID

DRY

KISS

Composition over inheritance.

---

Maximum component size

300 lines.

---

Maximum function size

80 lines.

---

Business logic separated from UI.

---

Geometry calculations isolated.

---

TikZ isolated.

---

Renderer isolated.

---

## Accessibility

Keyboard accessible.

Visible focus.

High contrast mode later.

Tooltips everywhere.

---

## Browser Support

Chrome

Latest

Firefox

Latest

Safari

Latest

Edge

Latest

---

# 33. Error Handling

Geometry errors

Should never crash UI.

---

Invalid construction

Display notification.

---

Import error

Display dialog.

---

Export error

Display message.

---

Unexpected exception

Log.

Keep workspace alive.

---

# 34. Logging

Development

Verbose.

Production

Minimal.

Future

Optional analytics.

---

# 35. Security

No user account.

No remote storage.

No tracking.

No cookies required.

Future cloud sync optional.

---

# 36. Localization

Language system should support:

English

Vietnamese

Future:

Japanese

Chinese

French

German

Spanish

---

All UI text must come from translation dictionary.

No hardcoded strings.

---

# 37. Coding Standards

Language

TypeScript.

Strict mode.

---

Naming

Components

PascalCase

Variables

camelCase

Constants

UPPER_CASE

Folders

lowercase

---

Avoid

any

Prefer

unknown

Generics

Discriminated unions

Readonly

---

Use ESLint.

Use Prettier.

---

# 38. Documentation

Every exported function

Has JSDoc.

Every geometry algorithm

Has explanation.

Complex math

References formula.

---

# 39. Testing Requirements

Unit tests

Geometry calculations.

---

Integration tests

Tool interactions.

---

UI tests

Panels.

---

Snapshot tests

TikZ output.

---

Regression tests

Known geometry cases.

---

# 40. Acceptance Criteria

Version 1.0 is complete when:

✓ User can create geometry.

✓ User can edit geometry.

✓ User can style geometry.

✓ User can generate TikZ.

✓ User can export TEX.

✓ User can export SVG.

✓ User can export PNG.

✓ Undo works.

✓ Redo works.

✓ Save works.

✓ Open works.

✓ UI matches NoadDVo design language.

✓ Performance remains smooth.

✓ No major bugs.

---

# 41. Out of Scope (Version 1)

The following features are intentionally excluded from the first release:

- CAS (Computer Algebra System)
- Equation solver
- Spreadsheet view
- 3D geometry
- Scripting language
- Collaborative editing
- Cloud accounts
- Real-time multiplayer
- Plugin marketplace
- AI-assisted constructions

These may be considered for future versions after the core geometry and TikZ workflow are stable.

---

# 42. Success Metrics

The project will be considered successful if it achieves:

- Smooth drawing experience comparable to GeoGebra.
- TikZ code that compiles without manual edits in common LaTeX distributions.
- Clean, maintainable TypeScript architecture.
- UI consistent with the NoadDVo design language.
- Ability to produce olympiad-quality geometry figures efficiently.
# Appendix A — Geometry Naming Convention

The application shall automatically assign meaningful names to geometry objects.

## Points

Primary sequence:

A
B
C
D
E
F
...
Z

After Z:

A1
B1
C1
...

Reserved point names:

O
Origin

M
Midpoint

H
Foot of altitude

I
Incenter

G
Centroid

N
Special point

P,Q,R,S,T
Generic points

## Segments

AB

BC

CD

...

No explicit label unless user enables it.

## Lines

l

m

n

p

q

...

## Circles

c₁

c₂

c₃

...

or

Circle(O)

depending on TikZ mode.

## Angles

α

β

γ

δ

θ

Automatically chosen.

---

# Appendix B — Default Style

## Background

#111A22

---

## Grid

Minor Grid

rgba(255,255,255,0.04)

Major Grid

rgba(255,255,255,0.08)

---

## Axis

X-axis

#6FA9D8

Y-axis

#6FA9D8

---

## Point

Radius

5 px

Fill

White

Border

#A9D8FF

---

## Selected Point

Radius

7 px

Glow

Blue

---

## Segment

Stroke

#DDEEFF

Width

2 px

---

## Infinite Line

Stroke

#A9D8FF

Dash

None

---

## Construction Line

Stroke

rgba(180,220,255,.45)

Dash

Dashed

---

## Polygon

Stroke

#DDEEFF

Fill

rgba(169,216,255,.15)

---

## Circle

Stroke

#DDEEFF

Width

2 px

Fill

transparent

---

## Angle

Stroke

#A9D8FF

Radius

24 px

---

## Labels

Font

Inter

Weight

500

Color

White

---

# Appendix C — Object ID Rules

Every geometry object has immutable ID.

Format

obj_xxxxxxxx

Examples

obj_f83b2d

obj_8da1ce

Never reuse IDs.

---

# Appendix D — Internal JSON Format

Example

{
    "version":1,
    "viewport":{},
    "objects":[]
}

Each object

{
    "id":"",
    "type":"",
    "style":{},
    "dependencies":[]
}

The format must be backward compatible.

---

# Appendix E — Dependency Graph

Each geometry object stores

dependencies

and

dependents

Example

Point A

↓

Segment AB

↓

Midpoint M

↓

Circle

If A moves

↓

Segment updates

↓

Midpoint updates

↓

Circle updates

No manual refresh.

---

# Appendix F — Layer Order

Rendering order

Grid

↓

Axes

↓

Filled Regions

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

Selection Overlay

↓

Preview Objects

This order must always be respected.

---

# Appendix G — Selection Priority

If multiple objects overlap

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

Infinite Line

↓

Grid

The nearest object wins.

---

# Appendix H — Keyboard Shortcuts

General

Ctrl + N

New Project

Ctrl + O

Open Project

Ctrl + S

Save

Ctrl + Shift + S

Save As

Ctrl + E

Export

Ctrl + K

Command Palette

Ctrl + Z

Undo

Ctrl + Shift + Z

Redo

Delete

Delete Selection

Esc

Cancel Tool

Space

Temporary Pan

Mouse

Wheel

Zoom

Middle Mouse

Pan

Shift

Constraint Mode

Alt

Disable Snap

---

# Appendix I — Coordinate System

World coordinates

Cartesian.

Origin

(0,0)

Positive X

Right.

Positive Y

Up.

Screen conversion handled by viewport.

---

# Appendix J — Snap Priority

Snap order

Existing Point

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

Closest valid candidate wins.

---

# Appendix K — Error Messages

Examples

Cannot create line.

Need two distinct points.

---

Cannot create circle.

Radius is zero.

---

Construction failed.

Objects are parallel.

---

Invalid file format.

---

Unsupported TikZ feature.

Messages should be human-readable.

---

# Appendix L — Future Roadmap

Version 1.1

• Better polygon editor

• Bezier curves

• SVG optimization

• Measurement tools

Version 1.2

• TikZ parser

• GeoGebra import

• Better export

Version 2.0

• CAS

• Dynamic equations

• Animation

• Macros

Version 3.0

• 3D

• Collaboration

• Cloud Sync

• Plugin API

---

# End of Document