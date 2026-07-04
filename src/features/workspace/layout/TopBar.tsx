import {
  CircleHelp,
  Download,
  Moon,
  Redo2,
  Save,
  Settings,
  Undo2,
} from "lucide-react";

import { useAppStore } from "../../../app/store/appStore";
import { Button, Divider, IconButton } from "../../../ui/primitives";

export function TopBar() {
  const appName = useAppStore((state) => state.appName);

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-4 border-b border-white/8 bg-[#101b24]/70 px-4 backdrop-blur-panel">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-[12px] border border-arctic-ice/25 bg-arctic-ice/10 text-sm font-black text-arctic-ice shadow-[0_0_24px_rgb(168_216_255/0.14)]">
          N
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-arctic-muted">
            NoadDVo
          </p>
          <h1 className="truncate text-sm font-bold uppercase tracking-[0.12em] text-arctic-text">
            {appName}
          </h1>
        </div>
      </div>

      <Divider orientation="vertical" className="my-4 hidden sm:block" />

      <div className="hidden items-center gap-2 sm:flex">
        <IconButton label="Undo">
          <Undo2 size={18} strokeWidth={2} />
        </IconButton>
        <IconButton label="Redo">
          <Redo2 size={18} strokeWidth={2} />
        </IconButton>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button icon={<Save size={16} strokeWidth={2} />} size="sm" variant="ghost">
          Save
        </Button>
        <Button
          icon={<Download size={16} strokeWidth={2} />}
          size="sm"
          variant="primary"
        >
          Export
        </Button>
        <IconButton label="Theme">
          <Moon size={18} strokeWidth={2} />
        </IconButton>
        <IconButton label="Settings">
          <Settings size={18} strokeWidth={2} />
        </IconButton>
        <IconButton label="Help">
          <CircleHelp size={18} strokeWidth={2} />
        </IconButton>
      </div>
    </header>
  );
}
