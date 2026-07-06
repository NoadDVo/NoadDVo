# Sync Architecture

Status: Epic 6B apply foundation

The synchronization layer lives under `src/core/sync/`. It is intentionally independent from React, SVG, DOM, Zustand stores, and UI components.

## Purpose

The sync layer defines the contract between Geometry Objects and TikZ. It does not perform realtime synchronization yet. It produces candidate results, plans, diagnostics, intermediate object references, and an explicit apply result for user-accepted TikZ edits.

## Current Scope

- Geometry to TikZ orchestration through the existing TikZ generator.
- TikZ to Geometry orchestration through the existing TikZ parser.
- Common intermediate scene objects for future identity mapping.
- Normalized diagnostics from generator warnings, generator errors, parser issues, and geometry validation errors.
- Read-only sync plans that describe what would happen.
- Explicit TikZ apply diffing through `TikzApplySync.ts`, preserving object identity where names/dependencies match.

## Non-Goals For Epic 6A

- No realtime synchronization.
- No incremental updates.
- No conflict resolution.
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
  -> UI commits via geometryStore.setObjects(...)
```

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

## Epic 6C Recommendations

- Add conflict diagnostics for renamed points, deleted dependencies, reordered paths, and unsupported TikZ edits.
- Add preview/confirmation UI for create/update/delete operations before applying them.
- Track generated TikZ provenance so realtime sync can distinguish user edits from generator refreshes.
- Add conflict resolution for simultaneous canvas and TikZ edits.
- Keep realtime synchronization disabled until conflict handling and identity preservation are designed.
