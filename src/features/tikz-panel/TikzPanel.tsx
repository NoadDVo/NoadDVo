import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Edit3, FileCode2, Lock, RefreshCw, WrapText } from "lucide-react";

import { useGeometryStore } from "../../app/store/geometryStore";
import { wrapTikzInStandaloneDocument } from "../../core/export";
import { generateTikz, type TikzMode } from "../../core/tikz";
import { Button, IconButton, Panel } from "../../ui/primitives";

const tikzModes = ["minimal", "academic", "olympiad", "colorful"] satisfies readonly TikzMode[];

export function TikzPanel() {
  const objects = useGeometryStore((state) => state.objects);
  const [mode, setMode] = useState<TikzMode>("academic");
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
  const lineCount = displayedCode.split("\n").length;

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
        <>
          <select
            aria-label="TikZ mode"
            className="h-8 rounded-[10px] border border-white/10 bg-[#101b24] px-2 text-[10px] font-bold uppercase tracking-[0.1em] text-arctic-text outline-none"
            onChange={(event) => setMode(event.target.value as TikzMode)}
            value={mode}
          >
            {tikzModes.map((tikzMode) => (
              <option key={tikzMode} value={tikzMode}>
                {tikzMode}
              </option>
            ))}
          </select>
          <Button
            icon={<Clipboard size={15} strokeWidth={2} />}
            onClick={copyTikz}
            size="sm"
            variant="ghost"
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          {!autoUpdate && (
            <Button
              icon={<RefreshCw size={15} strokeWidth={2} />}
              onClick={regenerateFromGeometry}
              size="sm"
              variant="primary"
            >
              Regenerate
            </Button>
          )}
          <IconButton
            active={wrapDocument}
            label="Wrap Document"
            onClick={() => setWrapDocument((wrapped) => !wrapped)}
            size="sm"
          >
            <WrapText size={16} strokeWidth={2} />
          </IconButton>
          <IconButton
            active={autoUpdate}
            label="Auto Update"
            onClick={() => setAutoUpdate((enabled) => !enabled)}
            size="sm"
          >
            <FileCode2 size={16} strokeWidth={2} />
          </IconButton>
          <IconButton
            active={editable}
            label={editable ? "Editable" : "Readonly"}
            onClick={() => {
              setEditable((enabled) => !enabled);
              setDraftCode(displayedCode);
            }}
            size="sm"
          >
            {editable ? <Edit3 size={16} strokeWidth={2} /> : <Lock size={16} strokeWidth={2} />}
          </IconButton>
        </>
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
            <code>{displayedCode}</code>
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
