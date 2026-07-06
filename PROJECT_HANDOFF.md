# Project Handoff: NoadDVo Geometry Studio

Last reviewed: 2026-07-06  
Repository root: `D:\Code\MyProject`

Latest engineering update: Geometry Engine coverage was expanded for `arc` and `region` objects, three-point circle support was completed, the remaining documented construction tools were added, the TikZ MVP generation/parser systems were completed for supported geometry, and the Fill Tool was enabled for closed polygonal regions.

## 1. Project Overview

NoadDVo Geometry Studio is a browser-based interactive geometry editor focused on producing clean, publication-ready TikZ/LaTeX output. The product direction is similar to a lightweight GeoGebra-style construction workspace, but the core value proposition is for LaTeX users, teachers, students, researchers, and math content creators who need precise diagrams and readable TikZ code.

The application currently opens directly into the workspace. The main workflow is:

1. Draw or construct geometry on an SVG canvas.
2. Select objects and edit geometry, labels, and appearance in the inspector.
3. See TikZ code update in real time.
4. Copy or export project/TikZ/TEX/SVG/JSON assets.

The codebase is structured around a deliberate separation between UI, interaction tools, geometry/math logic, rendering, TikZ generation, export/import, project persistence, and state stores.

## 2. Tech Stack

- Runtime/UI: React 19, React DOM 19
- Language: TypeScript 5.7
- Build tool: Vite 6
- Styling: Tailwind CSS 3, PostCSS, custom CSS design tokens
- State management: Zustand 5
- Rendering: SVG in React
- Icons: lucide-react
- Utilities: clsx, lodash-es, uuid
- Tests: TypeScript-compiled custom unit test runner under `src/tests`
- Package manager: npm with `package-lock.json`

Key scripts:

- `npm.cmd run dev`: Vite development server
- `npm.cmd run build`: TypeScript build plus Vite production build
- `npm.cmd run typecheck`: TypeScript project build
- `npm.cmd run test:unit`: compiles tests, copies runtime files into `.tmp/unit-tests`, then runs the custom test runner

Verification on 2026-07-06:

- `npm.cmd run typecheck`: passed
- `npm.cmd run test:unit`: passed
- `npm.cmd run build`: passed
- Direct `npm run ...` in PowerShell failed because `npm.ps1` is blocked by the local execution policy; `npm.cmd` works.

## 3. Folder Architecture

Top-level folders:

- `docs/`: product, architecture, geometry engine, UI, and TikZ specifications.
- `src/app/`: app entry composition, routes, providers, and Zustand stores.
- `src/core/`: domain logic that should remain mostly UI-independent.
- `src/features/`: user-facing feature areas and panels.
- `src/ui/`: reusable primitives, overlay plumbing, icons, and feedback exports.
- `src/design/`: Tailwind entrypoint plus design token/theme CSS.
- `src/lib/`: small shared utilities.
- `src/tests/`: custom unit/integration-style tests.
- `scripts/`: test preparation helper.
- `dist/`: generated production build output.
- `node_modules/`: installed dependencies.

Important `src/core` modules:

- `geometry/`: core types, math, validation, dependency updates, constructions, viewport, snapping, measurements.
- `tools/`: active drawing/interaction tools and tool lifecycle.
- `renderer/`: SVG renderers per geometry type and renderer registry.
- `tikz/`: TikZ scene building, options, formatters, color/name registries, exporters, tokenizer, parser, AST builder, and geometry recovery.
- `project/`: `.ndv` project metadata, serialization, loading, autosave, recent projects.
- `export/`: TikZ/TEX/SVG/JSON/project export helpers.
- `history/`: snapshot-based history manager and undo/redo commands.
- `selection/`: hit testing and selection helpers.
- `context/`: context menu registry, manager, and actions.
- `keyboard/`: shortcut registry and event routing infrastructure.

Important `src/features` modules:

- `workspace/`: main application shell, top bar, status bar, project/export/help/theme groups.
- `canvas/`: SVG canvas, grid/axis, gesture layer, selection/preview/hover overlays.
- `toolbar/`: left geometry tool palette.
- `properties/`: right-side property inspector panels.
- `tikz-panel/`: live TikZ editor/viewer panel.
- `object-tree/`: object tree and dependency summary panel.
- `context-menu/`: context menu overlay UI.
- `landing/`, `settings/`, `command-palette/`: currently minimal placeholders/exports.

## 4. Major Features Already Completed

- Workspace shell with top bar, left toolbar, canvas, object tree, property inspector, TikZ panel, and status bar.
- SVG canvas with grid, axes, zoom controls, reset view, fit view, pan/zoom gesture support, hover information, selection overlay, and tool previews.
- Core geometry model for points, segments, lines, rays, vectors, circles, arcs, polygons, regions, angles, text annotations, and measurement objects.
- Tool framework with select, move, point, segment, line, ray, vector, circle, polygon, angle, text, measurement, midpoint, intersection, parallel line, perpendicular line, perpendicular bisector, angle bisector, median, altitude, circumcircle, and incircle tools registered in `ToolManager`.
- Fill Tool enabled in the toolbar; clicking inside a closed polygon creates or selects a dependent `region` fill object.
- Dependency metadata normalization and propagation for derived points and dependent objects.
- Construction support for midpoint, intersection, parallel-line-through-point, perpendicular-line-through-point, perpendicular bisector, angle bisector, median, altitude, circumcircle, and incircle workflows.
- Hit testing for points, labels, text, measurements, segments, polygons, regions, circles, arcs, lines, rays, and angles.
- Measurement calculation for segment length, polygon perimeter/area, circle radius/diameter/circumference/area, arc length, region area, and angle value.
- Snapshot-based undo/redo with transactions for multi-step tool actions.
- Property inspector panels for general properties, geometry fields, appearance, labels, and advanced metadata.
- Object tree panel with search/filtering, rename, visibility/lock controls, selection sync, hover sync, and dependency summary.
- Realtime TikZ generation with modes: minimal, academic, olympiad, colorful; snippet, raw-command, and standalone document output modes; deterministic object ordering; comments/section formatting; sanitized point names; color registries; and warning reporting for skipped invalid objects.
- TikZ exporters for points, segments, lines, rays, vectors, circles, arcs, polygons, regions, angles, text, and measurements, including fills, opacity, labels, readable sections, and measurement labels.
- TikZ parser for supported standard TikZ: tokenization, command AST construction, syntax diagnostics, coordinate/name preservation, and geometry recovery for coordinates, segments, vectors, closed draw paths, filled regions, circles, arcs, text nodes, point labels, and angle pics.
- TikZ panel with copy, wrap-as-standalone document, mode selection, auto-update toggle, regenerate, readonly/editable toggle, and selected-object line highlighting.
- Export manager for TikZ snippets, standalone TEX, JSON/NDV project text, and SVG element export.
- Project manager with new/open/save/save-as, import from file, recent projects, autosave, autosave recovery, and sample scenes.
- Context menu infrastructure with canvas/object/project actions and overlay rendering.
- Reusable UI primitives: `Button`, `IconButton`, `Panel`, `Tooltip`, `Divider`, and overlay portal.
- Unit tests covering geometry, measurements, history, selection, text creation, vector renderer, TikZ generation, TikZ parsing, measurement TikZ, and project serialization/loading.

## 5. Features Partially Implemented

- Theme switching: UI controls exist but some theme buttons are disabled/coming soon.
- Help: help group exists but is disabled/coming soon.
- Command palette: folder exists, but no substantial implementation was observed.
- Settings: folder exists, but no substantial implementation was observed.
- TikZ direct editing: panel supports editable text, but automatic sync back to geometry is not wired into the UI yet.
- TikZ parser/import: parser exists for the supported geometry subset, but full TeX/TikZ language coverage and user-facing import/sync workflows are not complete.
- PNG/PDF export: included in product spec but not implemented in `ExportManager`.
- GeoGebra/SVG import: listed as future in docs; not implemented.
- Explicit arc creation tools are not exposed yet; arc objects are engine-supported and can round-trip through project data, render, measure, hit-test, and export when present.
- Construction tools now cover the documented MVP set. Remaining construction work is mostly UX polish, richer previews, and any future non-MVP constructions.
- Responsive/tablet/mobile behavior: workspace has some responsive hiding, but full tablet drawer/mobile read-only experience is not complete.
- Keyboard/shortcut architecture exists, but not all documented shortcuts appear fully wired.
- Localization/i18n is only skeletal; many UI strings are still hardcoded.

## 6. Current User Story Being Worked On

Inferred from the staged git diff, the current active story is:

**Complete the Fill Tool / Region feature while preserving the existing Geometry Engine and TikZ architecture.**

Evidence:

- `src/core/tools/FillTool.ts` creates dependent region objects from closed polygons and avoids duplicate fills for the same boundary.
- `ToolManager` registers `fill`, and `LeftToolbar` enables the Fill button.
- Region hit testing now prioritizes explicit region fills above polygon interiors.
- `src/tests/interactions/fillTool.test.ts` covers fill detection, region defaults, dependency validation, duplicate lookup, and pointer creation behavior.

Current git state:

- The repository still contains staged UI/object-tree/overlay work from the previous active story.
- The Geometry Engine, construction-tool, TikZ generator/parser, Fill Tool, tests, and handoff updates from the latest work are unstaged/untracked unless the user stages them.
- These changes are not committed yet.

## 7. Remaining TODOs

Product-level TODOs:

- Wire supported TikZ-to-geometry parsing into an explicit import/sync workflow, or keep UI promises marked experimental until ready.
- Add PNG/PDF export if still required for v1.
- Finish settings, command palette, help, and theme switching.
- Add responsive tablet/mobile behavior beyond hiding desktop panels.
- Implement localization dictionary usage if multilingual support remains a requirement.
- Build a more complete construction catalog.
- Add visual regression or browser interaction tests for canvas/UI behavior.
- Add accessibility pass for keyboard navigation, focus management, ARIA labels, and menu/dialog semantics.

Engineering TODOs:

- Decide whether staged object-tree/overlay work is ready to commit or needs more QA.
- Add coverage for the newly staged object tree/dependency UI.
- Add tests for `OverlayPortal`, project menu overlay behavior, and context menu positioning.
- Add a user-facing creation workflow for engine-supported arc objects if required for release.
- Consolidate project export file extensions and MIME behavior.
- Add a manual LaTeX compile smoke test for representative generated TikZ snippets/documents.
- Expand parser coverage for additional TikZ path operations only when there is a clear geometry mapping.
- Review all docs for outdated folder names versus current `src/core` and `src/features` architecture.
- Replace hardcoded UI strings with i18n once that system is ready.
- Consider moving more pointer/interaction state out of React components if canvas complexity grows.

## 8. Known Bugs

No failing automated tests were found during this review.

Known or likely behavior gaps:

- Arc objects are engine-supported but do not yet have a dedicated toolbar creation tool.
- `ExportManager.exportTikz` downloads a TikZ snippet with a `.tex` filename even though the format key is `tikz`; this may confuse users expecting either `.tikz`/`.tex` consistency.
- Direct TikZ editing does not automatically update geometry and can diverge from the scene when auto-update is disabled.
- TikZ parser intentionally supports a geometry-focused subset of standard TikZ, not arbitrary TeX macros or every TikZ library command.
- Browser clipboard calls in the TikZ panel and export manager can fail outside secure contexts or without user permission; no fallback UI is apparent.
- `window.alert`/`window.prompt` are used for project load/save-as errors and naming, which is functional but inconsistent with the premium UI direction.
- Some documented features are visible as disabled controls, which may feel unfinished if shown in a release build.
- Docs contain mojibake/encoding corruption in several Vietnamese and symbol-heavy sections.

## 9. Technical Debt

- Documentation drift: `docs/ARCHITECTURE.md` describes older folders such as `components/`, `canvas/`, `geometry/`, `renderer/`, etc. while the current source uses `core/`, `features/`, `ui/`, and `app/`.
- Snapshot history is simple and working, but may become memory-heavy as scenes grow.
- Store boundaries are mostly good, but `ProjectManager` directly reaches into Zustand stores and browser APIs; this is pragmatic but harder to test than pure service functions.
- Some services use browser globals directly (`window`, `document`, `navigator.clipboard`, `Blob`, `URL`), which limits non-browser reuse.
- The renderer registry returns React nodes, so rendering is not fully independent of React even though geometry/TikZ are mostly pure.
- There are many hardcoded class names and design values in components despite the design-token goal.
- `src/core/geometry/objects/index.ts` is empty, suggesting either an unfinished object factory layer or a stale barrel.
- Context menu and keyboard systems exist, but not every command/action is complete.
- New UI areas need tests, especially object tree and overlay portal behavior.
- Test runner is custom and lightweight. It is fast, but lacks richer DOM/browser assertions unless expanded.

## 10. Important Design Decisions

- Geometry is the source of truth. UI and renderers read geometry state rather than inventing geometry data.
- Core geometry and TikZ systems are kept independent from React and DOM where practical.
- SVG is the rendering target for precision, inspectability, and conceptual closeness to TikZ.
- Zustand stores are split by domain instead of one monolithic global store.
- Tools are class/object-like modules registered through a central `ToolManager`.
- Geometry objects are immutable by convention; store updates replace objects.
- Dependencies are represented by object IDs and normalized before commit.
- Dependent derived points are recomputed through a propagation engine after parent updates.
- Undo/redo currently uses snapshots, with transaction support for multi-step tool interactions.
- TikZ generation uses object-specific exporters plus registries for names and colors.
- Rendering uses a renderer registry per geometry type, avoiding one giant render switch.
- The product visual language is "Dark Arctic": premium, calm, technical, canvas-first.
- Project files use a `.ndv` JSON-backed document format with versioned metadata.

## 11. State Management

Primary state is managed with Zustand.

`useGeometryStore` is the main scene store. It contains:

- `objects`
- `selectedObjectIds`
- `hoveredObjectId`
- `activeTool`
- `lastError`
- undo/redo flags
- object actions
- selection actions
- tool actions
- import/load-example actions
- history actions

`useViewportStore` contains:

- `viewport`
- grid/snap/axis visibility settings
- pointer world coordinate
- pan and spacebar state
- zoom/pan/reset/resize actions

`useUiStore` contains:

- theme
- active sidebar
- open dialog
- command palette open flag
- hovered tool ID
- keyboard mode hint
- active TikZ mode

Other state services:

- `historyManager`: module-level history stack used by geometry store actions.
- `projectManager`: class instance holding project metadata, autosave state, recent projects, and project manager subscribers.
- `autosaveManager` and `recentProjects`: persistence helpers used by project manager.

State flow examples:

- Pointer event -> `GestureLayer` -> `ToolManager` -> active tool -> geometry store action -> dependency propagation/history -> React renderers/TikZ panel update.
- Project open -> `ProjectManager` -> `ProjectLoader` -> `geometry.setObjects` + `viewport.setViewportState` + `ui.setTheme/setTikzMode`.
- TikZ panel -> reads `objects` and `tikzMode` -> calls `generateTikz` in a memoized calculation.

## 12. Main Components and Responsibilities

- `App`: minimal root that renders `AppShell`.
- `AppShell`: application layout, starts autosave, places top bar, toolbar, canvas, TikZ panel, object tree, inspector, and status bar.
- `TopBar`: top workspace navigation and groups for project, undo/redo, export, theme, help.
- `ProjectMenu`: project actions, recent projects, sample scenes, import/export menu.
- `ExportMenu`: export/copy actions for supported formats.
- `LeftToolbar`: grouped geometry tools and disabled future controls.
- `Canvas`: main SVG canvas container, resize observer, grid/axis/geometry/selection/preview layers, hover layer, zoom controls, empty prompt, context menu.
- `GestureLayer`: pointer/wheel event interpretation and routing to viewport/tool systems.
- `GeometryLayer`: orders objects and asks `RendererRegistry` to render each visible object.
- `SelectionLayer`: draws selection affordances.
- `PreviewLayer`: renders active tool previews.
- `HoverInfoLayer`: displays contextual hover/object information.
- `ContextMenuOverlay`: renders registered context menu actions.
- `GeometryTreePanel`: searchable/filterable object tree, rename flow, selection/hover sync, dependency summary.
- `ObjectTreeItem`: per-object row with controls.
- `DependencySummary`: dependency/dependent summary for selected object.
- `RightPanel`: property inspector shell for the first selected object.
- `GeneralPanel`: name/visibility/lock/general object data.
- `GeometryPanel`: object-type-specific geometry fields.
- `AppearancePanel`: stroke/fill/dash/opacity/point appearance.
- `LabelPanel`: label visibility, placement, sizing/content controls.
- `AdvancedPanel`: metadata/dependency/advanced readouts.
- `TikzPanel`: live TikZ display/editor with mode/wrap/copy/regenerate controls.
- `Panel`, `Button`, `IconButton`, `Tooltip`, `Divider`: reusable UI primitives.
- `AnchoredOverlay`/`OverlayPortal`: portal-based floating overlay positioning.

## 13. File-by-File Summary of Important Source Files

App and stores:

- `src/main.tsx`: React DOM entrypoint; mounts `App` and imports Tailwind/design CSS.
- `src/app/App.tsx`: renders the workspace shell.
- `src/app/store/geometryStore.ts`: composes geometry, selection, tool, import, object, and history store slices.
- `src/app/store/geometryStoreTypes.ts`: main geometry store types and action signatures.
- `src/app/store/objectStore.ts`: add/update/delete object actions, validation, dependency propagation, and history recording.
- `src/app/store/historyStore.ts`: undo/redo and transaction actions backed by `historyManager`.
- `src/app/store/importStore.ts`: set/clear/load-example project object workflows.
- `src/app/store/selectionStore.ts`: selection and hover actions.
- `src/app/store/toolStore.ts`: active tool action.
- `src/app/store/viewportStore.ts`: viewport, panning, zooming, grid/snap/axis state.
- `src/app/store/uiStore.ts`: theme, dialogs, command palette flag, keyboard hints, TikZ mode.
- `src/app/store/exampleScenes.ts`: built-in sample scenes.
- `src/app/store/geometryStoreUtils.ts`: history snapshots and object preparation helpers.

Geometry:

- `src/core/geometry/types.ts`: core geometry object union, styles, tools, scene, errors, and validation types.
- `src/core/geometry/math.ts`: pure geometry math helpers including distance, midpoint, vector operations, polygon area, and angle helpers.
- `src/core/geometry/measurements.ts`: measurement calculation, formatting, anchor positioning, and supported measurement checks.
- `src/core/geometry/textAnnotation.ts`: text positioning and font helpers.
- `src/core/geometry/vectorStyle.ts`: vector arrow/style helpers.
- `src/core/geometry/validation.ts`: object validation and scene validation entrypoints.
- `src/core/geometry/viewport/viewport.ts`: viewport conversion, pan, zoom, resize helpers.
- `src/core/geometry/viewport/clipping.ts`: line/ray clipping helpers for viewport/export bounds.
- `src/core/geometry/snap/gridSnap.ts`: grid snapping helper.
- `src/core/geometry/constructions/ConstructionAlgorithms.ts`: intersection, midpoint, circle intersections, and constructed point recomputation.
- `src/core/geometry/dependency/DependencyGraph.ts`: dependency graph creation, validation, dependents lookup, and topological traversal.
- `src/core/geometry/dependency/GeometryUpdateEngine.ts`: dependency normalization and propagation after object changes.

Tools and interactions:

- `src/core/tools/Tool.ts`: shared tool interface.
- `src/core/tools/BaseTool.ts`: base behavior for tools.
- `src/core/tools/ToolManager.ts`: registers tools and dispatches activation, pointer, keyboard, cancel, and preview calls.
- `src/core/tools/ToolContext.ts`: bridges tool code to current stores and viewport state.
- `src/core/tools/ToolHistorySession.ts`: transaction helper for multi-step tool operations.
- `src/core/tools/TwoPointToolHelpers.ts`: shared endpoint selection/creation logic for two-point tools.
- `src/core/tools/PointTool.ts`: point creation and naming.
- `src/core/tools/SegmentTool.ts`, `LineTool.ts`, `RayTool.ts`, `VectorTool.ts`: two-point geometry creation tools.
- `src/core/tools/CircleTool.ts`: circle creation tool.
- `src/core/tools/PolygonTool.ts`: multi-point polygon creation workflow.
- `src/core/tools/AngleTool.ts`: angle creation workflow.
- `src/core/tools/TextTool.ts`: text annotation creation.
- `src/core/tools/MeasurementTool.ts`: measurement creation for supported object types.
- `src/core/tools/MidpointTool.ts`, `IntersectionTool.ts`, `ParallelLineTool.ts`, `PerpendicularLineTool.ts`: construction tools.
- `src/core/tools/SelectTool.ts`: selection behavior.
- `src/core/tools/MoveTool.ts`: object movement behavior.

Rendering and selection:

- `src/core/renderer/RendererRegistry.ts`: renderer registry and default renderer registration.
- `src/core/renderer/PointRenderer.tsx`: point and point-label SVG rendering.
- `src/core/renderer/SegmentRenderer.tsx`: segment SVG rendering.
- `src/core/renderer/LineRenderer.tsx`: infinite line rendering.
- `src/core/renderer/RayRenderer.tsx`: ray rendering.
- `src/core/renderer/VectorRenderer.tsx`: vector arrow rendering.
- `src/core/renderer/CircleRenderer.tsx`: center-radius and center-point circle rendering.
- `src/core/renderer/PolygonRenderer.tsx`: polygon rendering.
- `src/core/renderer/AngleRenderer.tsx`: angle marker rendering.
- `src/core/renderer/TextRenderer.tsx`: text annotation rendering.
- `src/core/renderer/MeasurementRenderer.tsx`: measurement label rendering.
- `src/core/selection/HitTest.ts`: screen/world hit testing with object priority.
- `src/core/selection/SelectionEngine.ts`: selection logic helpers.
- `src/core/selection/BoundingBox.ts`: bounding box helpers.

TikZ:

- `src/core/tikz/TikzGenerator.ts`: main `generateTikz` pipeline, option resolution, exporter registry dispatch, warning capture, and generation result metadata.
- `src/core/tikz/TikzScene.ts`: builds deterministic TikZ scene sections from geometry objects, respecting hidden-object export options.
- `src/core/tikz/TikzFormatter.ts`: formats snippet/raw/document output, section comments, numbers, style options, opacity, and standalone wrappers.
- `src/core/tikz/TikzOptions.ts`: TikZ modes, output mode options, document/comment/library switches, and default option mapping.
- `src/core/tikz/TikzNameRegistry.ts`: stable/sanitized point names with duplicate handling.
- `src/core/tikz/TikzColorRegistry.ts`: deterministic color definitions.
- `src/core/tikz/TikzTypes.ts`: TikZ generation/export types, output types, warnings, and errors.
- `src/core/tikz/parser/TikzTokenizer.ts`: lexical tokenizer for supported TikZ/LaTeX command syntax.
- `src/core/tikz/parser/TikzAstParser.ts`: command AST builder and delimiter/semicolon syntax validation.
- `src/core/tikz/parser/TikzGeometryBuilder.ts`: geometry recovery from supported AST commands.
- `src/core/tikz/parser/TikzParser.ts`: public parser orchestration function.
- `src/core/tikz/parser/TikzParseTypes.ts`: parser token, AST, issue, and result types.
- `src/core/tikz/exporters/*.ts`: object-specific TikZ exporters for supported geometry, including fills, labels, measurements, and invalid-object warnings.

Project, history, export:

- `src/core/project/ProjectManager.ts`: project lifecycle, autosave, save/open/recent project orchestration.
- `src/core/project/ProjectSerializer.ts`: project document creation and JSON serialization.
- `src/core/project/ProjectLoader.ts`: project JSON parsing and validation.
- `src/core/project/ProjectMetadata.ts`: project document/runtime metadata types and helpers.
- `src/core/project/AutosaveManager.ts`: autosave persistence.
- `src/core/project/RecentProjects.ts`: recent project persistence.
- `src/core/export/ExportManager.ts`: clipboard/download exports.
- `src/core/export/ExportTex.ts`: standalone TEX wrapper.
- `src/core/export/ExportSvg.ts`: SVG export serialization.
- `src/core/export/ExportJson.ts`: project JSON export snapshot formatting.
- `src/core/export/ImportJson.ts`: JSON import helper.
- `src/core/history/HistoryManager.ts`: snapshot history stack and transactions.
- `src/core/history/UndoCommand.ts`, `RedoCommand.ts`: undo/redo command helpers.
- `src/core/history/HistoryStack.ts`: stack implementation.
- `src/core/history/HistoryAction.ts`: history action types.

UI features:

- `src/features/workspace/AppShell.tsx`: main layout and autosave startup.
- `src/features/workspace/layout/TopBar.tsx`: top bar composition.
- `src/features/workspace/layout/ProjectMenu.tsx`: project menu overlay, recent projects, import/export/examples.
- `src/features/workspace/layout/ExportMenu.tsx`: export actions.
- `src/features/workspace/layout/UndoRedoGroup.tsx`: undo/redo controls.
- `src/features/workspace/layout/ThemeGroup.tsx`: theme controls, partially disabled.
- `src/features/workspace/layout/HelpGroup.tsx`: help button, currently disabled.
- `src/features/workspace/layout/StatusBar.tsx`: workspace status readout.
- `src/features/workspace/layout/ProjectDialogs.tsx`: project confirmation/recovery dialogs.
- `src/features/canvas/Canvas.tsx`: canvas container and core canvas UI.
- `src/features/canvas/interactions/GestureLayer.ts`: canvas pointer/wheel/gesture handlers.
- `src/features/canvas/grid/GridLayer.tsx`: SVG grid.
- `src/features/canvas/grid/gridMath.ts`: adaptive grid calculations.
- `src/features/canvas/svg/AxisLayer.tsx`: axis rendering.
- `src/features/canvas/renderers/GeometryLayer.tsx`: ordered geometry rendering layer.
- `src/features/canvas/overlays/SelectionLayer.tsx`: selection overlay.
- `src/features/canvas/overlays/PreviewLayer.tsx`: active tool preview overlay.
- `src/features/canvas/overlays/HoverInfoLayer.tsx`: hover details overlay.
- `src/features/toolbar/LeftToolbar.tsx`: grouped tool palette.
- `src/features/properties/RightPanel.tsx`: property inspector shell.
- `src/features/properties/*.tsx`: per-section inspector controls.
- `src/features/tikz-panel/TikzPanel.tsx`: generated TikZ panel/editor.
- `src/features/object-tree/*.tsx`: object tree, rows, dependency summary, and filtering utilities.
- `src/features/context-menu/ContextMenuOverlay.tsx`: context menu renderer.

Shared UI/design/tests:

- `src/ui/primitives/Button.tsx`: shared button primitive.
- `src/ui/primitives/IconButton.tsx`: icon-only button primitive.
- `src/ui/primitives/Panel.tsx`: reusable panel chrome.
- `src/ui/primitives/Tooltip.tsx`: tooltip primitive.
- `src/ui/overlay/OverlayPortal.tsx`: portal and anchored overlay implementation.
- `src/design/tokens.css`: design tokens.
- `src/design/theme.css`: theme CSS.
- `src/design/tailwind.css`: Tailwind entry CSS.
- `src/tests/runUnitTests.ts`: custom test suite runner.
- `src/tests/**`: focused tests for geometry, history, interactions, rendering, TikZ, and project behavior.

## 14. Suggested Next Milestones

1. Finish and commit the object-tree/sidebar story.
   - Add tests for object tree utilities and rename/selection/dependency behavior.
   - Manually QA staged overlay/menu changes in the browser.

2. Stabilize v1 geometry coverage.
   - Add user-facing creation tools for engine-supported arc and region objects if required for release.
   - Add missing construction tools only if they are required for the next release.
   - Expand invalid-geometry tests around dependency deletion and construction failure.

3. Close the export/import promise gap.
   - Fix TikZ snippet extension naming.
   - Decide v1 scope for PNG/PDF.
   - Wire the supported parser into explicit import/sync UI only after designing identity/history conflict handling.
   - Add a manual LaTeX compile smoke test for generated standalone documents.

4. Polish workspace UX.
   - Replace `alert`/`prompt` project flows with app-native dialogs.
   - Complete settings/help/theme flows or hide disabled controls from release builds.
   - Add accessible keyboard/focus behavior for menus and overlays.

5. Add browser-level UI testing.
   - Cover canvas creation flows, object selection, property edits, context menu, project menu, and TikZ copy/export behavior.

6. Bring docs in sync with source.
   - Update architecture folder structure.
   - Clean encoding issues in existing docs.
   - Convert future/spec-only items into a maintained roadmap.

7. Prepare release hardening.
   - Run production build regularly.
   - Add a visual QA checklist for canvas/grid/axis/pan/zoom/object rendering.
   - Keep manual LaTeX compile checks for representative generated TikZ in the release checklist.
