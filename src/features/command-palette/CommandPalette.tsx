import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { useGeometryStore } from "../../app/store/geometryStore";
import { useUiStore } from "../../app/store/uiStore";
import { useViewportStore } from "../../app/store/viewportStore";
import {
  copySelectionToGeometryClipboard,
  duplicateSelection,
  pasteGeometryClipboard,
} from "../../core/clipboard";
import { exportManager } from "../../core/export";
import { projectManager } from "../../core/project";
import { toolManager } from "../../core/tools/ToolManager";
import { IconButton } from "../../ui/primitives";

type Command = {
  readonly id: string;
  readonly group: string;
  readonly label: string;
  readonly run: () => void;
};

function commandText(command: Command): string {
  return `${command.group} ${command.label}`.toLowerCase();
}

export function CommandPalette() {
  const open = useUiStore((state) => state.commandPaletteOpen);
  const setOpen = useUiStore((state) => state.setCommandPaletteOpen);
  const setTheme = useUiStore((state) => state.setTheme);
  const setDialog = useUiStore((state) => state.setOpenDialog);
  const setTikzMode = useUiStore((state) => state.setTikzMode);
  const [query, setQuery] = useState("");
  const objects = useGeometryStore((state) => state.objects);
  const updateCanvasSettings = useViewportStore((state) => state.updateCanvasSettings);

  const commands = useMemo<readonly Command[]>(
    () => [
      { group: "Project", id: "new", label: "New Project", run: () => projectManager.newProject() },
      { group: "Project", id: "save", label: "Save Project", run: () => projectManager.saveProject() },
      { group: "Clipboard", id: "copy", label: "Copy Selection", run: copySelectionToGeometryClipboard },
      { group: "Clipboard", id: "paste", label: "Paste Geometry", run: pasteGeometryClipboard },
      { group: "Clipboard", id: "duplicate", label: "Duplicate Selection", run: duplicateSelection },
      { group: "Export", id: "export-tikz", label: "Copy TikZ", run: () => void exportManager.copyTikzToClipboard(objects) },
      { group: "Tools", id: "select", label: "Select Tool", run: () => toolManager.activateTool("select") },
      { group: "Tools", id: "point", label: "Point Tool", run: () => toolManager.activateTool("point") },
      { group: "Tools", id: "segment", label: "Segment Tool", run: () => toolManager.activateTool("segment") },
      { group: "Tools", id: "polygon", label: "Polygon Tool", run: () => toolManager.activateTool("polygon") },
      { group: "Tools", id: "fill", label: "Fill Tool", run: () => toolManager.activateTool("fill") },
      { group: "Theme", id: "dark-arctic", label: "Dark Arctic", run: () => setTheme("dark-arctic") },
      { group: "Theme", id: "dark", label: "Dark", run: () => setTheme("dark") },
      { group: "Theme", id: "light", label: "Light", run: () => setTheme("light") },
      { group: "Theme", id: "system", label: "System", run: () => setTheme("system") },
      { group: "Settings", id: "settings", label: "Open Settings", run: () => setDialog("settings") },
      { group: "Settings", id: "grid", label: "Toggle Grid", run: () => updateCanvasSettings({ showGrid: !useViewportStore.getState().showGrid }) },
      { group: "Settings", id: "axes", label: "Toggle Axes", run: () => updateCanvasSettings({ showAxes: !useViewportStore.getState().showAxes }) },
      { group: "TikZ", id: "tikz-academic", label: "Academic Mode", run: () => setTikzMode("academic") },
      { group: "TikZ", id: "tikz-colorful", label: "Colorful Mode", run: () => setTikzMode("colorful") },
      { group: "Help", id: "help", label: "Open Help", run: () => setDialog("help") },
    ],
    [objects, setDialog, setTheme, setTikzMode, updateCanvasSettings],
  );
  const filtered = commands
    .filter((command) => commandText(command).includes(query.trim().toLowerCase()))
    .slice(0, 12);

  if (!open) {
    return null;
  }

  const runCommand = (command: Command) => {
    command.run();
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-5 pt-[12vh] backdrop-blur-sm">
      <div className="w-[680px] max-w-full overflow-hidden rounded-[20px] border border-arctic-border/10 bg-arctic-background/97 shadow-[0_24px_80px_rgb(0_0_0/0.46)]">
        <div className="flex items-center gap-3 border-b border-arctic-border/8 px-3 py-2">
          <Search className="text-arctic-muted" size={18} />
          <input
            autoFocus
            className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-arctic-text outline-none placeholder:text-arctic-muted"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
              }
              if (event.key === "Enter" && filtered[0]) {
                runCommand(filtered[0]);
              }
            }}
            placeholder="Search commands, tools, exports, settings..."
            value={query}
          />
          <IconButton label="Close command palette" onClick={() => setOpen(false)} size="sm">
            <X size={16} />
          </IconButton>
        </div>
        <div className="max-h-[56vh] overflow-y-auto p-2">
          {filtered.map((command) => (
            <button
              className="flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left hover:bg-arctic-surface/70"
              key={command.id}
              onClick={() => runCommand(command)}
              type="button"
            >
              <span className="text-[12px] font-bold text-arctic-text">{command.label}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-arctic-muted">{command.group}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-8 text-center text-[12px] font-semibold text-arctic-muted">
              No commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
