import type {
  CircleObject,
  DashStyle,
  GeometryObject,
  LabelPosition,
  PointObject,
} from "../../core/geometry";
import { getCircleGeometry } from "../../core/geometry";

export const dashOptions = ["solid", "dashed", "dotted"] satisfies readonly DashStyle[];
export const labelPositions = [
  "above",
  "below",
  "left",
  "right",
  "above-left",
  "above-right",
  "below-left",
  "below-right",
] satisfies readonly LabelPosition[];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatNumber(value: number): string {
  const rounded = Number(value.toFixed(4));

  return Object.is(rounded, -0) ? "0" : String(rounded);
}

export function getPoint(
  objects: Record<string, GeometryObject>,
  pointId: string,
): PointObject | null {
  const object = objects[pointId];

  return object?.type === "point" ? object : null;
}

export function getCircleRadius(
  object: CircleObject,
  objects: Record<string, GeometryObject>,
): number | null {
  return getCircleGeometry(object, objects)?.radius ?? null;
}

export function Field({
  children,
  label,
}: {
  readonly children: React.ReactNode;
  readonly label: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-arctic-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-8 w-full rounded-[9px] border border-arctic-border/10 bg-arctic-surface/60 px-2.5 font-mono text-[11px] text-arctic-text outline-none transition focus:border-arctic-ice/45 disabled:opacity-45"
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-8 w-full rounded-[9px] border border-arctic-border/10 bg-arctic-surface px-2.5 text-[11px] font-semibold text-arctic-text outline-none transition focus:border-arctic-ice/45 disabled:opacity-45"
    />
  );
}

export function ToggleRow({
  checked,
  disabled,
  label,
  onChange,
}: {
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-8 items-center justify-between rounded-[10px] border border-arctic-border/8 bg-arctic-surface/55 px-2.5">
      <span className="text-[11px] font-semibold text-arctic-muted">{label}</span>
      <input
        checked={checked}
        className="size-4 accent-arctic-ice"
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

export function Readout({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-[10px] border border-arctic-border/8 bg-arctic-surface/55 px-2.5 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-arctic-muted">
        {label}
      </p>
      <p className="mt-0.5 break-all font-mono text-[11px] text-arctic-text">{value}</p>
    </div>
  );
}

export function Section({
  children,
  title,
}: {
  readonly children: React.ReactNode;
  readonly title: string;
}) {
  return (
    <section>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-arctic-text">
        {title}
      </h3>
      <div className="mt-3 space-y-2.5">{children}</div>
    </section>
  );
}
