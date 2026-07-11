# Sync Architecture

Status: Epic 6D semantic synchronization foundation

The synchronization layer lives under `src/core/sync/`. It is intentionally independent from React, SVG, DOM, Zustand stores, and UI components.

## Purpose

The sync layer defines the contract between Geometry Objects and TikZ. It now supports conservative live synchronization for safe edits, while preserving the explicit Preview/Apply workflow for ambiguous, destructive, partial, or unsupported changes.

## Current Scope

- Geometry to TikZ orchestration through the existing TikZ generator.
- TikZ to Geometry orchestration through the existing TikZ parser.
- Common intermediate scene objects for future identity mapping.
- Normalized diagnostics from generator warnings, generator errors, parser issues, and geometry validation errors.
- Read-only sync plans that describe what would happen.
- Explicit TikZ apply diffing through `TikzApplySync.ts`, preserving object identity where names/dependencies match.
- Synchronization preview modeling through `TikzApplyPreview.ts`, grouping creates, updates, deletes, preserved objects, warnings, and conflicts.
- Live sync orchestration through `LiveSyncEngine.ts`, including provenance stamps, content hashes, loop prevention helpers, debounce constants, and safe-auto-apply decisions.
- Generator/parser semantic parity for application-generated TikZ covering the MVP geometry set.

## Non-Goals For Epic 6A

- No incremental updates.
- No automatic conflict resolution.
- No direct mutation of geometry stores from core sync modules.
- No direct history entries from core sync modules; UI callers commit accepted apply results through existing geometry store actions.
- No object tree or inspector updates.

## Module Responsibilities

- `SyncTypes.ts`: shared sync contracts, directions, statuses, diagnostics, plans, context, intermediate scene types, and result types.
- `SyncContext.ts`: creates sync contexts and builds the common intermediate scene representation from Geometry Objects.
- `SyncDiagnostics.ts`: converts TikZ and geometry diagnostics into a common sync diagnostic format and derives sync status.
- `GeometryToTikzSync.ts`: wraps `generateTikz`, records the generation plan, and returns TikZ output plus intermediate geometry references.
- `TikzToGeometrySync.ts`: wraps `parseTikz`, validates recovered objects, and returns candidate Geometry Objects without applying them.
- `TikzApplySync.ts`: consumes TikZ-to-Geometry candidates, maps them onto existing object identities, produces create/update/delete/preserve operations, and returns the next scene plus diagnostics without mutating stores.
- `TikzApplyPreview.ts`: converts apply operations into user-facing preview operations with before/after summaries, diagnostic severity, confirmation requirements, warning grouping, and conflict grouping.
- `LiveSyncEngine.ts`: creates live sync results, provenance stamps, stable content hashes, debounce policy, loop prevention checks, and safe-auto-apply gating for TikZ editor changes.
- `SyncEngine.ts`: facade for future callers so UI or project code does not depend on low-level sync modules.

## Data Flow

Geometry to TikZ:

```txt
GeometryObjectRecord
  -> syncGeometryToTikz
  -> generateTikz
  -> SyncIntermediateScene
  -> SyncDiagnostics
  -> GeometryToTikzSyncResult
```

TikZ to Geometry:

```txt
TikZ source
  -> syncTikzToGeometry
  -> parseTikz
  -> normalizeDependencyMetadata
  -> validateGeometryObjects
  -> SyncIntermediateScene
  -> SyncDiagnostics
  -> TikzToGeometrySyncResult
```

Apply TikZ to Geometry:

```txt
TikZ source + current GeometryObjectRecord
  -> syncTikzToGeometry
  -> identity mapping by coordinate names and dependency signatures
  -> create/update/delete/preserve operation list
  -> validate next GeometryObjectRecord
  -> TikzApplyResult
  -> TikzApplyPreview
  -> user confirmation
  -> UI commits via geometryStore.setObjects(...)
```

Live Geometry to TikZ:

```txt
Geometry Store update
  -> React memoized generateTikz(...)
  -> generated code replaces editor draft while Auto is enabled
  -> no TikZ-to-Geometry apply is triggered for identical generated content
```

Live TikZ to Geometry:

```txt
User types in editable TikZ panel
  -> draft text updates immediately
  -> 400 ms debounce
  -> createLiveTikzToGeometry(...)
  -> createTikzApplyPreview(...)
  -> auto-apply only if safe
  -> otherwise diagnostics update and Preview/Apply remains available
```

## Live Synchronization Rules

Automatic TikZ-to-Geometry synchronization is allowed only when:

- parsing succeeds
- validation succeeds
- preview status is `ready`
- no conflicts are present
- no warnings are present
- no deletes are planned
- no partial parse confirmation is required
- no destructive confirmation is required

If any of those conditions fail, the editor preserves the user's text, updates diagnostics, and requires the existing Review Changes workflow.

## Loop Prevention

`LiveSyncEngine.ts` creates `LiveSyncStamp` values containing:

- direction
- provenance origin
- content hash
- timestamp

The TikZ panel stores the last live TikZ-to-Geometry stamp. If the next debounced parse has the same direction, origin, and hash, it is ignored as the same synchronization cycle.

## Provenance Tracking

Current provenance sources are:

- `canvas`
- `inspector`
- `object-tree`
- `tikz-editor`
- `apply-preview`
- `import`
- `system`

The live TikZ editor path stamps changes as `tikz-editor`. Geometry-to-TikZ generation can be stamped by callers as `canvas`, `inspector`, `object-tree`, `import`, or `system` as the application grows more explicit source tracking.

## Debounce Strategy

TikZ editor parsing is debounced by `LIVE_TIKZ_SYNC_DEBOUNCE_MS`, currently `400`.

Typing updates the textarea immediately. Parsing and safe apply happen after the debounce window. Intermediate invalid fragments update diagnostics only after debounce and never block typing.

## Incremental Synchronization

The live engine preserves object identity using the Epic 6B apply mapping:

- points by TikZ coordinate name
- segments/vectors/polygons/regions/circles/angles by named dependencies
- existing IDs where mappings are unique

For store compatibility, the UI still commits accepted live changes through `geometryStore.setObjects(...)`, producing one undoable history entry per safe debounced apply. This preserves selection filtering, object tree updates, inspector updates, undo/redo, project serialization compatibility, and export compatibility. Field-level patch commits remain a future optimization.

## Generator/Parser Semantic Parity

Epic 6D treats the TikZ generator as the reference grammar. TikZ emitted by the application must parse back into equivalent Geometry Objects whenever semantic information is present in generated code.

Round-trip recovery now covers:

- points from `\coordinate`
- point labels from generated `\node[...] at (A) {$A$}`
- segments from named `\draw (A) -- (B)`
- vectors from generated arrow draw options
- infinite lines from generated clipped literal line paths matched against named defining points
- rays from generated clipped literal ray paths matched against named start/through points
- center-radius circles from named center circle syntax
- three-point circles from generated literal center/radius syntax matched against named points on the circle
- polygons from closed named draw paths
- regions/fills from closed generated `\fill`, `\filldraw`, or filled polygon paths
- arcs from generated arc syntax, reusing existing named center/start/end points when coordinates match
- angles from generated TikZ `\pic` angle/right-angle syntax
- text nodes from generated text labels
- measurements from generated measurement nodes matched by formatted measurement value against supported targets

The parser intentionally ignores generated point marker commands such as `\fill (A) circle (1.5pt);` so they do not become geometry circles.

## Round-Trip Coverage

The `tikz-round-trip` unit suite exercises:

| Geometry Type | Generated TikZ Round-Trip |
|---|---|
| Point | Supported |
| Segment | Supported |
| Infinite Line | Supported for app-generated clipped paths |
| Ray | Supported for app-generated clipped paths |
| Vector | Supported |
| Circle, center-radius | Supported |
| Circle, three-points | Supported when generated named points lie on emitted circle |
| Polygon | Supported |
| Region / Fill | Supported |
| Angle | Supported |
| Arc | Supported for app-generated arc syntax |
| Text | Supported |
| Labels | Supported for point labels |
| Measurements | Supported when generated value uniquely matches a supported recovered target |
| Construction Objects | Partially supported as their emitted geometry; construction definitions are not fully reconstructed unless the emitted semantic geometry is enough |

Round-trip success rate for the tested application-generated MVP geometry set: 13/13 suites pass.

## Preview Operation Model

`TikzApplyPreview` contains:

- `operations`: flat list of preview operations.
- `groups.creates`: objects that will be created.
- `groups.updates`: existing objects that will be changed.
- `groups.deletes`: supported existing objects that are absent from the accepted TikZ source.
- `groups.preserved`: objects intentionally left untouched, including unsupported existing object types.
- `groups.warnings`: recoverable parser/apply diagnostics.
- `groups.conflicts`: ambiguous identity, dependency replacement, or parse-error conditions that need attention.
- `canApply`: false when parse or validation errors are present.
- `requiresDestructiveConfirmation`: true when deletes are planned.
- `requiresPartialConfirmation`: true when TikZ parsing partially succeeded.

Each preview operation includes:

- operation type
- affected object id, name, and type when known
- before summary
- after summary
- diagnostic messages
- severity
- confirmation requirement

## Conflict Handling Rules

The preview layer detects and displays:

- duplicate point names that make identity mapping ambiguous
- ambiguous non-point object identity mapping
- unsupported TikZ commands from parser diagnostics
- destructive deletes
- derived/construction point replacement by free coordinates
- dependency-loss risks surfaced by apply diagnostics
- partial parse status
- parse and validation errors

Errors block apply. Warnings and conflicts can be reviewed, but destructive deletes and partial parses require explicit confirmation in the TikZ panel before applying.

## Safe Apply Workflow

The TikZ panel now follows this flow:

```txt
User edits TikZ
  -> Review
  -> createTikzApplyPreview(...)
  -> preview modal shows grouped operations
  -> Cancel leaves geometry unchanged
  -> Apply commits preview.applyResult.objectRecord through geometryStore.setObjects(...)
  -> one history entry is created
```

Core sync modules remain pure and do not mutate Zustand, history, DOM, React state, project serialization, or the object tree directly.

## Compatibility Notes

- Geometry Engine: recovered objects are normalized and validated before being returned.
- History and undo/redo: apply results are still pure; `TikzPanel` commits them with `geometryStore.setObjects(...)`, producing one undoable scene replacement.
- Object Tree and Inspector: they update through the normal geometry store after accepted apply results.
- Project serialization: the sync layer returns ordinary Geometry Objects and TikZ text, so existing project serialization remains the persistence boundary.
- TikZ architecture: parser and generator remain separate; sync orchestrates them without merging responsibilities.

## Epic 6B Apply Behavior

- `\coordinate (A) ...` maps to an existing point named `A` when unique.
- Segments, vectors, circles, polygons, regions, arcs, and angles map by resolved point-name dependency signatures.
- Candidate styles are applied when TikZ carries non-default style data; otherwise existing styles are preserved.
- Parse failures preserve the existing scene and return diagnostics.
- Recoverable unsupported TikZ warnings produce partial results. If no supported geometry is recovered, the existing scene is preserved.
- Existing object types that are not apply-supported are preserved with diagnostics.

## Remaining Limitations

- Preview summaries are concise text summaries, not structural field-by-field diffs.
- Live sync is conservative and safe-only; ambiguous or destructive edits still require preview confirmation.
- Partial parses preserve unmatched existing geometry and require confirmation before committing recovered changes.
- Conflict resolution is still user-confirm/cancel, not a merge editor.
- Arbitrary TikZ macros, scopes, advanced paths, and library-specific constructs remain unsupported.
- Lines and rays remain limited by parser recovery coverage.
- Live commits currently use whole-scene `setObjects(...)` with preserved IDs rather than field-level store patches.
- Geometry-to-TikZ regeneration is still full-output generation through the existing generator, although React memoization avoids unnecessary recomputation between unchanged object records.
- Measurement recovery is value-based and can be ambiguous for scenes with repeated equal measurements.
- Construction definitions are not fully reconstructed from TikZ unless represented by ordinary emitted geometry.
- External TikZ that resembles generated clipped line/ray paths may be inferred as line/ray if it matches named points.

## Epic 6E Recommendations

- Add explicit provenance metadata to geometry store actions so canvas, inspector, object-tree, import, and system changes are first-class sources.
- Add field-level geometry patch commits for live sync instead of full `setObjects(...)` replacement.
- Add richer conflict resolution for simultaneous canvas and TikZ edits.
- Add field-level merge controls for conflicts rather than only confirm/cancel.
- Add incremental diffing keyed by stable sync identity.
- Expand parser support for lines, rays, scopes, named styles, and common TikZ path forms.
