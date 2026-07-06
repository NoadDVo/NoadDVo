import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Edit3, FileCode2, Lock, RefreshCw, WrapText } from "lucide-react";

import { useGeometryStore } from "../../app/store/geometryStore";
import { useUiStore } from "../../app/store/uiStore";
import { wrapTikzInStandaloneDocument } from "../../core/export";
import { generateTikz, type TikzMode } from "../../core/tikz";
import { Button, Panel } from "../../ui/primitives";

const tikzModes = ["minimal", "academic", "olympiad", "colorful"] satisfies readonly TikzMode[];

export function TikzPanel() {
  const objects = useGeometryStore((state) => state.objects);
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
  const displayedCode = autoUpdate ? generatedCode : draftCode;
  const displayedLines = displayedCode.split("\n");
  const lineCount = displayedLines.length;
  const selectedObject = selectedObjectIds[0] ? objects[selectedObjectIds[0]] : null;
  const selectedTokens = [
    selectedObject?.id,
    selectedObject?.name,
  ].filter((token): token is string => Boolean(token?.trim()));

  useEffect(() => {
    if (autoUpdate) {
      setDraftCode(generatedCode);
    }
  }, [autoUpdate, generatedCode]);

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
  };

  return (
    <Panel
      actions={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <label className="flex h-8 items-center gap-1.5 rounded-[10px] border border-white/10 bg-[#101b24] px-2">
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
              setEditable((enabled) => !enabled);
              setDraftCode(displayedCode);
            }}
            size="sm"
            variant="ghost"
          >
            {editable ? "Editable" : "Readonly"}
          </Button>
          <Button
            active={autoUpdate}
            icon={<FileCode2 size={15} strokeWidth={2} />}
            onClick={() => setAutoUpdate((enabled) => !enabled)}
            size="sm"
            variant="ghost"
          >
            Auto
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
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_30px]">
        <div className="border-b border-white/8 px-4 py-2 text-[11px] font-semibold text-arctic-muted">
          {editable
            ? "Editing TikZ directly is experimental. Full sync coming later."
            : "Generated from geometry. This is the source of truth."}
        </div>
        {editable ? (
          <textarea
            className="min-h-0 resize-none overflow-auto bg-transparent px-4 py-3 font-mono text-[12px] leading-relaxed text-arctic-text/88 outline-none"
            onChange={(event) => {
              setAutoUpdate(false);
              setDraftCode(event.target.value);
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
        <footer className="flex items-center justify-between border-t border-white/8 px-4 font-mono text-[11px] text-arctic-muted">
          <span>Lines {lineCount} / Chars {displayedCode.length}</span>
          <span className="inline-flex items-center gap-2 text-arctic-ice">
            <Check size={14} strokeWidth={2} />
            {autoUpdate ? "Auto update on" : "Auto update paused"}
          </span>
        </footer>
      </div>
    </Panel>
  );
}
