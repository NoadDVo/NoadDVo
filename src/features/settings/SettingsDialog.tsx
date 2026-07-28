import { X } from "lucide-react";
import type { ReactNode } from "react";

import { useUiStore, type ThemeMode, type AppTheme, type Language } from "../../app/store/uiStore";
import { useViewportStore } from "../../app/store/viewportStore";
import type { TikzMode } from "../../core/tikz";
import { useTranslation } from "../../lib/useTranslation";
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
  const appTheme = useUiStore((state) => state.appTheme);
  const setAppTheme = useUiStore((state) => state.setAppTheme);
  const language = useUiStore((state) => state.language);
  const setLanguage = useUiStore((state) => state.setLanguage);
  const tikzMode = useUiStore((state) => state.tikzMode);
  const setTikzMode = useUiStore((state) => state.setTikzMode);
  const viewport = useViewportStore();
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm">
      <div className="flex max-h-[86vh] w-[760px] max-w-full flex-col overflow-hidden rounded-[22px] border border-arctic-border/10 bg-arctic-background/96 shadow-[0_24px_80px_rgb(0_0_0/0.42)]">
        <header className="flex items-center justify-between border-b border-arctic-border/8 px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-arctic-muted">
              {t("settings.workspace")}
            </p>
            <h2 className="text-sm font-black uppercase tracking-[0.12em] text-arctic-text">
              {t("settings.title")}
            </h2>
          </div>
          <IconButton label={t("btn.close")} onClick={() => close(null)} size="sm">
            <X size={16} />
          </IconButton>
        </header>
        <div className="grid gap-3 overflow-y-auto p-4 md:grid-cols-2">
          <Section title={t("settings.appearance")}>
            <Field label={t("settings.appTheme")}>
              <SelectInput
                onChange={(event) => setAppTheme(event.target.value as AppTheme)}
                value={appTheme}
              >
                <option value="theme1">{t("theme.neoBrutalism")}</option>
                <option value="theme2">{t("theme.tacticalDark")}</option>
              </SelectInput>
            </Field>
            <Field label={t("settings.theme")}>
              <SelectInput
                onChange={(event) => setTheme(event.target.value as ThemeMode)}
                value={theme}
              >
                <option value="dark-arctic">{t("theme.darkArctic")}</option>
                <option value="dark">{t("theme.dark")}</option>
                <option value="light">{t("theme.light")}</option>
                <option value="system">{t("theme.system")}</option>
              </SelectInput>
            </Field>
          </Section>
          <Section title={t("settings.canvas")}>
            <CheckboxField checked={viewport.showAxes} label={t("settings.showAxes")} onChange={(showAxes) => viewport.updateCanvasSettings({ showAxes })} />
            <CheckboxField checked={viewport.showOrigin} label={t("settings.showOrigin")} onChange={(showOrigin) => viewport.updateCanvasSettings({ showOrigin })} />
            <CheckboxField checked={viewport.infiniteCanvas} label={t("settings.infiniteCanvas")} onChange={(infiniteCanvas) => viewport.updateCanvasSettings({ infiniteCanvas })} />
            <CheckboxField checked={viewport.coordinateDisplay} label={t("settings.coordinateDisplay")} onChange={(coordinateDisplay) => viewport.updateCanvasSettings({ coordinateDisplay })} />
            <CheckboxField checked={viewport.measurementPreview} label={t("settings.measurementPreview")} onChange={(measurementPreview) => viewport.updateCanvasSettings({ measurementPreview })} />
            <Field label={t("settings.background")}>
              <TextInput type="color" value={viewport.canvasBackground} onChange={(event) => viewport.updateCanvasSettings({ canvasBackground: event.target.value })} />
            </Field>
            <Field label={t("settings.rendering")}>
              <SelectInput value={viewport.renderingQuality} onChange={(event) => viewport.updateCanvasSettings({ renderingQuality: event.target.value as typeof viewport.renderingQuality })}>
                <option value="balanced">Balanced</option>
                <option value="crisp">Crisp</option>
                <option value="high">High Quality</option>
              </SelectInput>
            </Field>
          </Section>
          <Section title={t("settings.grid")}>
            <CheckboxField checked={viewport.showGrid} label={t("settings.showGrid")} onChange={(showGrid) => viewport.updateCanvasSettings({ showGrid })} />
            <CheckboxField checked={viewport.majorGrid} label={t("settings.majorGrid")} onChange={(majorGrid) => viewport.updateCanvasSettings({ majorGrid })} />
            <CheckboxField checked={viewport.minorGrid} label={t("settings.minorGrid")} onChange={(minorGrid) => viewport.updateCanvasSettings({ minorGrid })} />
            <CheckboxField checked={viewport.adaptiveGrid} label={t("settings.adaptiveGrid")} onChange={(adaptiveGrid) => viewport.updateCanvasSettings({ adaptiveGrid })} />
            <Field label={t("settings.gridSize")}>
              <TextInput min={0.05} step={0.05} type="number" value={viewport.gridSize} onChange={(event) => viewport.updateCanvasSettings({ gridSize: Number(event.target.value) || viewport.gridSize })} />
            </Field>
            <Field label={t("settings.gridColor")}>
              <TextInput type="color" value={viewport.gridColor} onChange={(event) => viewport.updateCanvasSettings({ gridColor: event.target.value })} />
            </Field>
          </Section>
          <Section title={t("settings.snap")}>
            <CheckboxField checked={viewport.snapEnabled} label={t("settings.snapToggle")} onChange={(snapEnabled) => viewport.updateCanvasSettings({ snapEnabled })} />
            <Field label={t("settings.snapRadius")}>
              <TextInput min={0} step={1} type="number" value={viewport.snapRadius} onChange={(event) => viewport.updateCanvasSettings({ snapRadius: Number(event.target.value) || 0 })} />
            </Field>
          </Section>
          <Section title={t("settings.tikz")}>
            <Field label={t("settings.tikzMode")}>
              <SelectInput value={tikzMode} onChange={(event) => setTikzMode(event.target.value as TikzMode)}>
                <option value="minimal">Minimal</option>
                <option value="academic">Academic</option>
                <option value="colorful">Colorful</option>
                <option value="olympiad">Olympiad</option>
              </SelectInput>
            </Field>
          </Section>
          <Section title={t("settings.export")}>
            <CheckboxField checked label={t("settings.includeMetadata")} onChange={() => undefined} />
            <CheckboxField checked label={t("settings.preserveStyles")} onChange={() => undefined} />
          </Section>
          <Section title={t("settings.language")}>
            <Field label={t("settings.language")}>
              <SelectInput
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
              >
                <option value="en">{t("lang.english")}</option>
                <option value="vi">{t("lang.vietnamese")}</option>
              </SelectInput>
            </Field>
          </Section>
          <Section title={t("settings.autosave")}>
            <CheckboxField checked label={t("settings.autosaveProjects")} onChange={() => undefined} />
            <p className="text-[11px] leading-5 text-arctic-muted">
              {t("settings.autosaveDesc")}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

