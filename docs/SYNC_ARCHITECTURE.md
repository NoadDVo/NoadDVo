# Sync Architecture

Status: Epic 6B.5 preview and apply foundation

The synchronization layer lives under `src/core/sync/`. It is intentionally independent from React, SVG, DOM, Zustand stores, and UI components.

## Purpose

The sync layer defines the contract between Geometry Objects and TikZ. It does not perform realtime synchronization yet. It produces candidate results, plans, diagnostics, intermediate object references, an explicit apply result for user-accepted TikZ edits, and a reviewable operation preview for confirmation before mutation.

## Current Scope

- Geometry to TikZ orchestration through the existing TikZ generator.
- TikZ to Geometry orchestration through the existing TikZ parser.
- Common intermediate scene objects for future identity mapping.
- Normalized diagnostics from generator warnings, generator errors, parser issues, and geometry validation errors.
- Read-only sync plans that describe what would happen.
- Explicit TikZ apply diffing through `TikzApplySync.ts`, preserving object identity where names/dependencies match.
- Synchronization preview modeling through `TikzApplyPreview.ts`, grouping creates, updates, deletes, preserved objects, warnings, and conflicts.

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
- `TikzApplyPreview.ts`: converts apply operations into user-facing preview operations with before/after summaries, diagnostic severity, confirmation requirements, warning grouping, and conflict grouping.
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
- Apply preview is modal and explicit; no realtime update loop exists.
- Partial parses preserve unmatched existing geometry and require confirmation before committing recovered changes.
- Conflict resolution is still user-confirm/cancel, not a merge editor.
- Arbitrary TikZ macros, scopes, advanced paths, and library-specific constructs remain unsupported.
- Lines and rays remain limited by parser recovery coverage.

## Epic 6C Recommendations

- Track generated TikZ provenance so realtime sync can distinguish user edits from generator refreshes.
- Add conflict resolution for simultaneous canvas and TikZ edits.
- Add field-level merge controls for conflicts rather than only confirm/cancel.
- Add incremental diffing keyed by stable sync identity.
- Keep realtime synchronization disabled until conflict handling and identity preservation are designed.
