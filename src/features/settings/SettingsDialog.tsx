import { X } from "lucide-react";
import type { ReactNode } from "react";

import { useUiStore, type ThemeMode } from "../../app/store/uiStore";
import { useViewportStore } from "../../app/store/viewportStore";
import type { TikzMode } from "../../core/tikz";
import { IconButton } from "../../ui/primitives";

function Field({
  children,
  label,
}: {
  readonly children: ReactNode;
  readonly label: string;
}) {
  return (
    <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-arctic-muted">
      {label}
      {children}
    </label>
  );
}

function CheckboxField({
  checked,
  label,
  onChange,
}: {
  readonly checked: boolean;
  readonly label: string;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[10px] border border-arctic-border/8 bg-arctic-surface/55 px-3 py-2 text-[11px] font-bold text-arctic-text">
      {label}
      <input
        checked={checked}
        className="size-4 accent-arctic-ice"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-8 rounded-[9px] border border-arctic-border/10 bg-arctic-surface/60 px-2.5 text-[11px] font-semibold text-arctic-text outline-none focus:border-arctic-ice/45"
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-8 rounded-[9px] border border-arctic-border/10 bg-arctic-surface px-2.5 text-[11px] font-semibold text-arctic-text outline-none focus:border-arctic-ice/45"
    />
  );
}

function Section({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <section className="rounded-[14px] border border-arctic-border/8 bg-arctic-surface/45 p-3">
      <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-arctic-ice">
        {title}
      </h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

export function SettingsDialog() {
  const open = useUiStore((state) => state.openDialog === "settings");
  const close = useUiStore((state) => state.setOpenDialog);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const tikzMode = useUiStore((state) => state.tikzMode);
  const setTikzMode = useUiStore((state) => state.setTikzMode);
  const viewport = useViewportStore();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm">
      <div className="flex max-h-[86vh] w-[760px] max-w-full flex-col overflow-hidden rounded-[22px] border border-arctic-border/10 bg-arctic-background/96 shadow-[0_24px_80px_rgb(0_0_0/0.42)]">
        <header className="flex items-center justify-between border-b border-arctic-border/8 px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-arctic-muted">
              Workspace
            </p>
            <h2 className="text-sm font-black uppercase tracking-[0.12em] text-arctic-text">
              Settings
            </h2>
          </div>
          <IconButton label="Close settings" onClick={() => close(null)} size="sm">
            <X size={16} />
          </IconButton>
        </header>
        <div className="grid gap-3 overflow-y-auto p-4 md:grid-cols-2">
          <Section title="Appearance">
            <Field label="Theme">
              <SelectInput
                onChange={(event) => setTheme(event.target.value as ThemeMode)}
                value={theme}
              >
                <option value="dark-arctic">Dark Arctic</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </SelectInput>
            </Field>
          </Section>
          <Section title="Canvas">
            <CheckboxField checked={viewport.showAxes} label="Show Axes" onChange={(showAxes) => viewport.updateCanvasSettings({ showAxes })} />
            <CheckboxField checked={viewport.showOrigin} label="Show Origin" onChange={(showOrigin) => viewport.updateCanvasSettings({ showOrigin })} />
            <CheckboxField checked={viewport.infiniteCanvas} label="Infinite Canvas" onChange={(infiniteCanvas) => viewport.updateCanvasSettings({ infiniteCanvas })} />
            <CheckboxField checked={viewport.coordinateDisplay} label="Coordinate Display" onChange={(coordinateDisplay) => viewport.updateCanvasSettings({ coordinateDisplay })} />
            <CheckboxField checked={viewport.measurementPreview} label="Measurement Preview" onChange={(measurementPreview) => viewport.updateCanvasSettings({ measurementPreview })} />
            <Field label="Background">
              <TextInput type="color" value={viewport.canvasBackground} onChange={(event) => viewport.updateCanvasSettings({ canvasBackground: event.target.value })} />
            </Field>
            <Field label="Rendering">
              <SelectInput value={viewport.renderingQuality} onChange={(event) => viewport.updateCanvasSettings({ renderingQuality: event.target.value as typeof viewport.renderingQuality })}>
                <option value="balanced">Balanced</option>
                <option value="crisp">Crisp</option>
                <option value="high">High Quality</option>
              </SelectInput>
            </Field>
          </Section>
          <Section title="Grid">
            <CheckboxField checked={viewport.showGrid} label="Show Grid" onChange={(showGrid) => viewport.updateCanvasSettings({ showGrid })} />
            <CheckboxField checked={viewport.majorGrid} label="Major Grid" onChange={(majorGrid) => viewport.updateCanvasSettings({ majorGrid })} />
            <CheckboxField checked={viewport.minorGrid} label="Minor Grid" onChange={(minorGrid) => viewport.updateCanvasSettings({ minorGrid })} />
            <CheckboxField checked={viewport.adaptiveGrid} label="Adaptive Grid" onChange={(adaptiveGrid) => viewport.updateCanvasSettings({ adaptiveGrid })} />
            <Field label="Grid Size">
              <TextInput min={0.05} step={0.05} type="number" value={viewport.gridSize} onChange={(event) => viewport.updateCanvasSettings({ gridSize: Number(event.target.value) || viewport.gridSize })} />
            </Field>
            <Field label="Grid Color">
              <TextInput type="color" value={viewport.gridColor} onChange={(event) => viewport.updateCanvasSettings({ gridColor: event.target.value })} />
            </Field>
          </Section>
          <Section title="Snap">
            <CheckboxField checked={viewport.snapEnabled} label="Snap Toggle" onChange={(snapEnabled) => viewport.updateCanvasSettings({ snapEnabled })} />
            <Field label="Snap Radius">
              <TextInput min={0} step={1} type="number" value={viewport.snapRadius} onChange={(event) => viewport.updateCanvasSettings({ snapRadius: Number(event.target.value) || 0 })} />
            </Field>
          </Section>
          <Section title="TikZ">
            <Field label="Mode">
              <SelectInput value={tikzMode} onChange={(event) => setTikzMode(event.target.value as TikzMode)}>
                <option value="minimal">Minimal</option>
                <option value="academic">Academic</option>
                <option value="colorful">Colorful</option>
                <option value="olympiad">Olympiad</option>
              </SelectInput>
            </Field>
          </Section>
          <Section title="Export">
            <CheckboxField checked label="Include project metadata" onChange={() => undefined} />
            <CheckboxField checked label="Preserve object styles" onChange={() => undefined} />
          </Section>
          <Section title="Language">
            <Field label="Language">
              <SelectInput defaultValue="en">
                <option value="en">English</option>
                <option value="vi">Vietnamese</option>
              </SelectInput>
            </Field>
          </Section>
          <Section title="Autosave">
            <CheckboxField checked label="Autosave Projects" onChange={() => undefined} />
            <p className="text-[11px] leading-5 text-arctic-muted">
              Autosave is active while the workspace is open.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
