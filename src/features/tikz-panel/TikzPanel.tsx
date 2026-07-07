import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Clipboard, Edit3, FileCode2, Lock, RefreshCw, Upload, WrapText, X } from "lucide-react";

import { useGeometryStore } from "../../app/store/geometryStore";
import { useUiStore } from "../../app/store/uiStore";
import { wrapTikzInStandaloneDocument } from "../../core/export";
import {
  LIVE_TIKZ_SYNC_DEBOUNCE_MS,
  createTikzApplyPreview,
  type LiveSyncStamp,
  type SyncDiagnostic,
  type SyncPreviewOperation,
  type TikzApplyPreview,
} from "../../core/sync";
import { generateTikz, type TikzMode } from "../../core/tikz";
import { Button, Panel } from "../../ui/primitives";
import { runLiveTikzPanelSync, type LiveTikzPanelSyncStatus } from "./liveTikzPanelSync";
import {
  getTikzPanelDisplayedCode,
  getTikzPanelStatusText,
  shouldFollowGeneratedTikz,
} from "./tikzPanelState";

const tikzModes = ["minimal", "academic", "olympiad", "colorful"] satisfies readonly TikzMode[];

export function TikzPanel() {
  const objects = useGeometryStore((state) => state.objects);
  const setObjects = useGeometryStore((state) => state.setObjects);
  const selectedObjectIds = useGeometryStore((state) => state.selectedObjectIds);
  const mode = useUiStore((state) => state.tikzMode);
  const setMode = useUiStore((state) => state.setTikzMode);
  const [wrapDocument, setWrapDocument] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [editable, setEditable] = useState(false);
  const tikz = useMemo(() => generateTikz(objects, mode), [mode, objects]);
  const generatedCode = wrapDocument
    ? wrapTikzInStandaloneDocument(tikz.code)
    : tikz.code;
  const [draftCode, setDraftCode] = useState(generatedCode);
  const [copied, setCopied] = useState(false);
  const [syncDiagnostics, setSyncDiagnostics] = useState<readonly SyncDiagnostic[]>([]);
  const [syncPreview, setSyncPreview] = useState<TikzApplyPreview | null>(null);
  const [destructiveConfirmed, setDestructiveConfirmed] = useState(false);
  const [partialConfirmed, setPartialConfirmed] = useState(false);
  const [liveSyncEnabled, setLiveSyncEnabled] = useState(false);
  const [liveSyncStatus, setLiveSyncStatus] = useState<LiveTikzPanelSyncStatus | "idle">("idle");
  const [manualEditsPending, setManualEditsPending] = useState(false);
  const lastLiveTikzStampRef = useRef<LiveSyncStamp | null>(null);
  const followsGeneratedTikz = shouldFollowGeneratedTikz({
    autoUpdate,
    editable,
    manualEditsPending,
  });
  const displayedCode = getTikzPanelDisplayedCode({
    autoUpdate,
    draftCode,
    editable,
    generatedCode,
    manualEditsPending,
  });
  const displayedLines = displayedCode.split("\n");
  const lineCount = displayedLines.length;
  const selectedObject = selectedObjectIds[0] ? objects[selectedObjectIds[0]] : null;
  const selectedTokens = [
    selectedObject?.id,
    selectedObject?.name,
  ].filter((token): token is string => Boolean(token?.trim()));

  useEffect(() => {
    if (followsGeneratedTikz) {
      setDraftCode(generatedCode);
    }
  }, [followsGeneratedTikz, generatedCode]);

  useEffect(() => {
    if (!editable || autoUpdate || syncPreview || !liveSyncEnabled) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      const result = runLiveTikzPanelSync({
        commitObjects: (nextObjects, changedObjectIds) =>
          useGeometryStore.getState().setObjects(
            nextObjects,
            "Live TikZ sync",
            changedObjectIds,
          ),
        currentObjects: useGeometryStore.getState().objects,
        lastStamp: lastLiveTikzStampRef.current,
        source: draftCode,
      });

      setLiveSyncStatus(result.status);
      setSyncDiagnostics(result.preview.diagnostics);

      if (result.status === "applied") {
        lastLiveTikzStampRef.current = result.stamp;
        setAutoUpdate(true);
        setManualEditsPending(false);
      }

      if (result.status === "unchanged") {
        setManualEditsPending(false);
      }
    }, LIVE_TIKZ_SYNC_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [autoUpdate, draftCode, editable, liveSyncEnabled, syncPreview]);

  const copyTikz = async () => {
    await navigator.clipboard.writeText(displayedCode);
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, 1200);
  };

  const regenerateFromGeometry = () => {
    setDraftCode(generatedCode);
    setAutoUpdate(true);
    setManualEditsPending(false);
    setSyncDiagnostics([]);
    setSyncPreview(null);
    setLiveSyncStatus("idle");
  };

  const reviewApplyToGeometry = () => {
    const preview = createTikzApplyPreview({
      currentObjects: objects,
      source: displayedCode,
    });

    setSyncPreview(preview);
    setSyncDiagnostics(preview.diagnostics);
    setDestructiveConfirmed(false);
    setPartialConfirmed(false);
  };

  const applyReviewedPreview = () => {
    if (!syncPreview?.canApply) {
      return;
    }

    if (syncPreview.requiresDestructiveConfirmation && !destructiveConfirmed) {
      return;
    }

    if (syncPreview.requiresPartialConfirmation && !partialConfirmed) {
      return;
    }

    if (
      setObjects(
        syncPreview.applyResult.objectRecord,
        "Apply TikZ to geometry",
        syncPreview.applyResult.changedObjectIds,
      )
    ) {
      setSyncPreview(null);
      setAutoUpdate(true);
      setManualEditsPending(false);
      setDraftCode(generatedCode);
    }
  };

  return (
    <Panel
      actions={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <label className="flex h-8 items-center gap-1.5 rounded-[10px] border border-arctic-border/10 bg-arctic-surface/70 px-2">
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-arctic-muted">
              Mode
            </span>
            <select
              aria-label="TikZ mode"
              className="bg-transparent text-[10px] font-bold uppercase tracking-[0.1em] text-arctic-text outline-none"
              onChange={(event) => setMode(event.target.value as TikzMode)}
              value={mode}
            >
              {tikzModes.map((tikzMode) => (
                <option key={tikzMode} value={tikzMode}>
                  {tikzMode}
                </option>
              ))}
            </select>
          </label>
          <Button
            active={wrapDocument}
            icon={<WrapText size={15} strokeWidth={2} />}
            onClick={() => setWrapDocument((wrapped) => !wrapped)}
            size="sm"
            variant="ghost"
          >
            Wrap
          </Button>
          <Button
            active={editable}
            icon={editable ? <Edit3 size={15} strokeWidth={2} /> : <Lock size={15} strokeWidth={2} />}
            onClick={() => {
              setEditable((enabled) => {
                const nextEnabled = !enabled;

                if (nextEnabled) {
                  setDraftCode(displayedCode);
                }

                return nextEnabled;
              });
            }}
            size="sm"
            variant="ghost"
          >
            {editable ? "Editable" : "Readonly"}
          </Button>
          <Button
            active={autoUpdate}
            icon={<FileCode2 size={15} strokeWidth={2} />}
            onClick={() => {
              setAutoUpdate((enabled) => {
                const nextEnabled = !enabled;

                if (nextEnabled) {
                  setDraftCode(generatedCode);
                  setManualEditsPending(false);
                  setSyncPreview(null);
                  setSyncDiagnostics([]);
                  setLiveSyncStatus("idle");
                }

                return nextEnabled;
              });
            }}
            size="sm"
            variant="ghost"
          >
            Auto
          </Button>
          <Button
            active={liveSyncEnabled}
            icon={<Check size={15} strokeWidth={2} />}
            onClick={() => setLiveSyncEnabled((enabled) => !enabled)}
            size="sm"
            variant="ghost"
          >
            Live
          </Button>
          <Button
            icon={<RefreshCw size={15} strokeWidth={2} />}
            onClick={regenerateFromGeometry}
            size="sm"
            variant={autoUpdate ? "ghost" : "primary"}
          >
            Regenerate
          </Button>
          <Button
            icon={<Upload size={15} strokeWidth={2} />}
            onClick={reviewApplyToGeometry}
            size="sm"
            variant={editable || !autoUpdate ? "primary" : "ghost"}
          >
            Review
          </Button>
          <Button
            icon={<Clipboard size={15} strokeWidth={2} />}
            onClick={copyTikz}
            size="sm"
            variant="ghost"
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      }
      className="min-h-0 overflow-hidden"
      eyebrow={editable ? "Editable Mode - Experimental" : "Readonly Mode - Generated TikZ"}
      title="TikZ"
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_32px] overflow-hidden">
        <div className="border-b border-arctic-border/8 px-4 py-2 text-[11px] font-semibold text-arctic-muted">
            {syncDiagnostics.length > 0
              ? syncDiagnostics.slice(0, 2).map((diagnostic) => diagnostic.message).join(" ")
            : editable && manualEditsPending
              ? "Manual edits pending. Live sync will apply safe edits; use Review for guarded changes or Regenerate to restore geometry output."
            : editable
              ? "Editing TikZ directly is experimental. Apply changes when ready."
              : "Generated from geometry. This is the source of truth."}
        </div>
        {editable ? (
          <textarea
            className="min-h-0 resize-none overflow-auto bg-transparent px-4 py-3 font-mono text-[12px] leading-relaxed text-arctic-text/88 outline-none"
            onChange={(event) => {
              setAutoUpdate(false);
              setManualEditsPending(true);
              setDraftCode(event.target.value);
              setSyncPreview(null);
              setLiveSyncStatus("idle");
            }}
            spellCheck={false}
            value={displayedCode}
          />
        ) : (
          <pre className="min-h-0 overflow-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-arctic-text/88">
            <code>
              {displayedLines.map((line, index) => {
                const highlighted = selectedTokens.some((token) =>
                  line.includes(token),
                );

                return (
                  <span
                    className={highlighted ? "block rounded bg-arctic-ice/12 text-arctic-text" : "block"}
                    key={`${index}-${line}`}
                  >
                    {line || " "}
                  </span>
                );
              })}
            </code>
          </pre>
        )}
        <footer className="flex items-center justify-between border-t border-arctic-border/8 px-4 font-mono text-[11px] text-arctic-muted">
          <span>Lines {lineCount} / Chars {displayedCode.length}</span>
          <span className="inline-flex items-center gap-2 text-arctic-ice">
            <Check size={14} strokeWidth={2} />
            {getTikzPanelStatusText({
              autoUpdate,
              liveSyncEnabled,
              liveSyncStatus,
              manualEditsPending,
            })}
          </span>
        </footer>
      </div>
      {syncPreview && (
        <SyncPreviewDialog
          destructiveConfirmed={destructiveConfirmed}
          onApply={applyReviewedPreview}
          onCancel={() => setSyncPreview(null)}
          onDestructiveConfirmedChange={setDestructiveConfirmed}
          onPartialConfirmedChange={setPartialConfirmed}
          partialConfirmed={partialConfirmed}
          preview={syncPreview}
        />
      )}
    </Panel>
  );
}

function operationLabel(operation: SyncPreviewOperation): string {
  const type = operation.objectType ?? "TikZ";
  const name = operation.objectName ? ` ${operation.objectName}` : "";

  return `${type}${name}`.trim();
}

function OperationGroup({
  operations,
  title,
}: {
  readonly operations: readonly SyncPreviewOperation[];
  readonly title: string;
}) {
  if (operations.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-arctic-border/8 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-arctic-ice">
          {title}
        </h3>
        <span className="font-mono text-[10px] text-arctic-muted">{operations.length}</span>
      </div>
      <div className="grid gap-2">
        {operations.map((operation, index) => (
          <div
            className="rounded-[12px] border border-arctic-border/8 bg-arctic-surface/45 px-3 py-2"
            key={`${operation.operation}-${operation.objectId ?? operation.reason}-${index}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-arctic-text">
                  {operationLabel(operation)}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-arctic-muted">
                  {operation.reason}
                </p>
              </div>
              <span className="shrink-0 rounded-[7px] border border-arctic-border/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-arctic-muted">
                {operation.severity}
              </span>
            </div>
            {(operation.beforeValue || operation.afterValue) && (
              <div className="mt-2 grid gap-1 font-mono text-[10px] text-arctic-muted">
                {operation.beforeValue && <p>Before: {operation.beforeValue}</p>}
                {operation.afterValue && <p>After: {operation.afterValue}</p>}
              </div>
            )}
            {operation.diagnostics.map((diagnostic) => (
              <p className="mt-1 text-[10px] font-semibold text-arctic-muted" key={diagnostic.code}>
                {diagnostic.message}
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function SyncPreviewDialog({
  destructiveConfirmed,
  onApply,
  onCancel,
  onDestructiveConfirmedChange,
  onPartialConfirmedChange,
  partialConfirmed,
  preview,
}: {
  readonly destructiveConfirmed: boolean;
  readonly onApply: () => void;
  readonly onCancel: () => void;
  readonly onDestructiveConfirmedChange: (confirmed: boolean) => void;
  readonly onPartialConfirmedChange: (confirmed: boolean) => void;
  readonly partialConfirmed: boolean;
  readonly preview: TikzApplyPreview;
}) {
  const applyBlocked =
    !preview.canApply ||
    (preview.requiresDestructiveConfirmation && !destructiveConfirmed) ||
    (preview.requiresPartialConfirmation && !partialConfirmed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm">
      <div className="flex max-h-[86vh] w-[760px] max-w-full flex-col overflow-hidden rounded-[22px] border border-arctic-border/10 bg-arctic-background/96 shadow-[0_24px_80px_rgb(0_0_0/0.42)]">
        <header className="flex items-center justify-between border-b border-arctic-border/8 px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-arctic-muted">
              TikZ Synchronization
            </p>
            <h2 className="text-sm font-black uppercase tracking-[0.12em] text-arctic-text">
              Review Changes
            </h2>
          </div>
          <button
            aria-label="Cancel sync preview"
            className="inline-flex size-9 items-center justify-center rounded-[12px] border border-arctic-border/8 bg-arctic-surface/65 text-arctic-muted hover:text-arctic-text"
            onClick={onCancel}
            type="button"
          >
            <X size={16} />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto">
          {!preview.canApply && (
            <div className="flex items-center gap-2 border-b border-arctic-border/8 px-4 py-3 text-[11px] font-bold text-[rgb(var(--color-danger))]">
              <AlertTriangle size={16} />
              Apply is blocked until TikZ parse errors are fixed.
            </div>
          )}
          <OperationGroup operations={preview.groups.conflicts} title="Conflicts" />
          <OperationGroup operations={preview.groups.warnings} title="Warnings" />
          <OperationGroup operations={preview.groups.creates} title="Creates" />
          <OperationGroup operations={preview.groups.updates} title="Updates" />
          <OperationGroup operations={preview.groups.deletes} title="Deletes" />
          <OperationGroup operations={preview.groups.preserved} title="Preserved" />
        </div>
        <footer className="grid gap-3 border-t border-arctic-border/8 px-4 py-3">
          {preview.requiresDestructiveConfirmation && (
            <label className="flex items-center justify-between gap-3 rounded-[10px] border border-arctic-border/8 bg-arctic-surface/45 px-3 py-2 text-[11px] font-bold text-arctic-text">
              Confirm deletion of geometry not present in TikZ
              <input
                checked={destructiveConfirmed}
                className="size-4 accent-arctic-ice"
                onChange={(event) => onDestructiveConfirmedChange(event.target.checked)}
                type="checkbox"
              />
            </label>
          )}
          {preview.requiresPartialConfirmation && (
            <label className="flex items-center justify-between gap-3 rounded-[10px] border border-arctic-border/8 bg-arctic-surface/45 px-3 py-2 text-[11px] font-bold text-arctic-text">
              Apply recovered geometry from a partial TikZ parse
              <input
                checked={partialConfirmed}
                className="size-4 accent-arctic-ice"
                onChange={(event) => onPartialConfirmedChange(event.target.checked)}
                type="checkbox"
              />
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={onCancel} size="sm" variant="ghost">
              Cancel
            </Button>
            <Button disabled={applyBlocked} onClick={onApply} size="sm" variant="primary">
              Apply to Geometry
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
