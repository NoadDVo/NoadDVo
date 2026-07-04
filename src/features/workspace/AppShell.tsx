import { Canvas } from "../canvas";
import { RightPanel } from "../properties";
import { TikzPanel } from "../tikz-panel";
import { LeftToolbar } from "../toolbar";
import { StatusBar, TopBar } from "./layout";

export function AppShell() {
  return (
    <main className="h-screen overflow-hidden bg-arctic-background text-arctic-text">
      <div className="relative flex h-full flex-col bg-[radial-gradient(circle_at_50%_-10%,rgb(168_216_255/0.13),transparent_34%),linear-gradient(135deg,rgb(17_26_34),rgb(9_17_24)_65%,rgb(13_25_34))]">
        <TopBar />
        <div className="grid min-h-0 flex-1 grid-cols-[72px_minmax(0,1fr)_320px] gap-4 px-4 pb-4 max-lg:grid-cols-[72px_minmax(0,1fr)] max-lg:pr-4">
          <LeftToolbar />
          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_220px] gap-4">
            <Canvas />
            <TikzPanel />
          </div>
          <RightPanel />
        </div>
        <StatusBar />
      </div>
    </main>
  );
}
