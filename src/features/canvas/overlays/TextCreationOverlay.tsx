import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { useGeometryStore } from "../../../app/store/geometryStore";
import {
  getTextPlacementOptionsForTarget,
  normalizeTextMode,
  textModes,
  type TextAttachmentPlacement,
  type TextMode,
} from "../../../core/geometry";
import { worldToScreen, type Viewport } from "../../../core/geometry/viewport";
import { createTextObject, inferTextMode, normalizeTextContent } from "../../../core/tools/TextTool";
import { textCreationSession } from "../../../core/tools/TextCreationSession";
import { Button } from "../../../ui/primitives";

type TextCreationOverlayProps = {
  readonly viewport: Viewport;
};

export function TextCreationOverlay({ viewport }: TextCreationOverlayProps) {
  const pending = useSyncExternalStore(
    textCreationSession.subscribe,
    textCreationSession.getSnapshot,
    textCreationSession.getSnapshot,
  );
  const addObject = useGeometryStore((state) => state.addObject);
  const objects = useGeometryStore((state) => state.objects);
  const selectObject = useGeometryStore((state) => state.selectObject);
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<TextMode>("plain");
  const [placement, setPlacement] = useState<TextAttachmentPlacement>("above");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const target = pending?.targetObjectId ? objects[pending.targetObjectId] ?? null : null;
  const placementOptions = getTextPlacementOptionsForTarget(target);
  const validContent = content.trim().length > 0;
  const position = useMemo(
    () => pending ? worldToScreen(pending.point, viewport) : null,
    [pending, viewport],
  );

  useEffect(() => {
    if (!pending) {
      return;
    }

    setContent("");
    setMode("plain");
    setPlacement(pending.placement ?? placementOptions[0] ?? "above");
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [pending?.id]);

  if (!pending || !position) {
    return null;
  }

  const confirm = () => {
    if (!validContent) {
      return;
    }

    const text = createTextObject({
      content: normalizeTextContent(content),
      mode,
      objects: useGeometryStore.getState().objects,
      point: pending.point,
      ...(target
        ? {
            placement,
            targetObjectId: target.id,
          }
        : {}),
    });

    if (addObject(text)) {
      selectObject(text.id);
      textCreationSession.complete();
    }
  };

  const cancel = () => {
    textCreationSession.cancel();
  };

  return (
    <form
      className="absolute z-30 w-[280px] rounded-[14px] border border-arctic-border/12 bg-arctic-background/96 p-3 shadow-[0_18px_48px_rgb(0_0_0/0.34)] backdrop-blur-panel"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          cancel();
        }
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.preventDefault();
        confirm();
      }}
      style={{
        left: Math.min(Math.max(position.x + 12, 12), Math.max(12, viewport.width - 292)),
        top: Math.min(Math.max(position.y - 12, 12), Math.max(12, viewport.height - 132)),
      }}
    >
      <label className="grid gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-arctic-muted">
          {target ? `Annotation - ${target.name ?? target.id}` : "Free Text"}
        </span>
        <input
          className="h-10 rounded-[10px] border border-arctic-border/12 bg-arctic-surface px-3 text-sm font-semibold text-arctic-text placeholder:text-arctic-muted/60 outline-none focus:border-arctic-ice/50"
          onChange={(event) => {
            const nextContent = event.target.value;

            setContent(nextContent);
            setMode(inferTextMode(nextContent));
          }}
          placeholder="Text"
          ref={inputRef}
          value={content}
        />
      </label>
      <div className={target ? "mt-2 grid grid-cols-2 gap-2" : "mt-2"}>
        <select
          aria-label="Text mode"
          className="h-8 rounded-[9px] border border-arctic-border/10 bg-arctic-surface/70 px-2 text-[11px] font-bold text-arctic-text outline-none"
          onChange={(event) => setMode(normalizeTextMode(event.target.value))}
          value={mode}
        >
          {textModes.map((textMode) => (
            <option key={textMode} value={textMode}>
              {textMode}
            </option>
          ))}
        </select>
        {target && (
          <select
            aria-label="Text placement"
            className="h-8 rounded-[9px] border border-arctic-border/10 bg-arctic-surface/70 px-2 text-[11px] font-bold text-arctic-text outline-none"
            onChange={(event) => setPlacement(event.target.value as TextAttachmentPlacement)}
            value={placement}
          >
            {placementOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button onClick={cancel} size="sm" type="button" variant="ghost">
          Cancel
        </Button>
        <Button disabled={!validContent} size="sm" type="submit" variant="primary">
          Add
        </Button>
      </div>
    </form>
  );
}
