import { useEffect } from "react";

import { projectManager } from "../../core/project";
import { Canvas } from "../canvas";
import { GeometryTreePanel } from "../object-tree";
import { RightPanel } from "../properties";
import { TikzPanel } from "../tikz-panel";
import { LeftToolbar } from "../toolbar";
import { StatusBar, TopBar } from "./layout";

export function AppShell() {
  useEffect(() => {
    projectManager.startAutosave();
  }, []);

  return (
    <main className="h-screen overflow-hidden bg-arctic-background text-arctic-text">
      <div className="relative flex h-full flex-col bg-[radial-gradient(circle_at_50%_-10%,rgb(168_216_255/0.13),transparent_34%),linear-gradient(135deg,rgb(17_26_34),rgb(9_17_24)_65%,rgb(13_25_34))]">
        <TopBar />
        <div className="grid min-h-0 flex-1 grid-cols-[64px_minmax(0,1fr)_320px] gap-2.5 px-3 pb-2.5 max-lg:grid-cols-[64px_minmax(0,1fr)] max-lg:pr-3">
          <LeftToolbar />
          <div className="grid min-h-0 grid-rows-[minmax(260px,0.56fr)_minmax(238px,0.44fr)] gap-2.5">
            <Canvas />
            <TikzPanel />
          </div>
          <aside className="grid min-h-0 grid-rows-[minmax(190px,0.38fr)_minmax(260px,0.62fr)] gap-2.5 max-lg:hidden">
            <GeometryTreePanel />
            <RightPanel />
          </aside>
        </div>
        <StatusBar />
      </div>
    </main>
  );
}
