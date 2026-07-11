import type {
  CircleObject,
  DashStyle,
  GeometryObject,
  LabelPosition,
  PointObject,
} from "../../core/geometry";
import { getCircleGeometry } from "../../core/geometry";
import { clsx } from "clsx";
import { useUiStore } from "../../app/store/uiStore";

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
  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <label className="grid gap-1.5">
      <span className={clsx(
        "text-[11px] font-bold uppercase tracking-wider",
        appTheme === "theme1" ? "text-black" : "",
        appTheme === "theme2" ? "text-zinc-400" : ""
      )}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <input
      {...props}
      className={clsx(
        "h-8 w-full px-2 font-mono text-[11px] outline-none transition-colors disabled:opacity-50",
        appTheme === "theme1" ? "rounded-none border-[3px] border-black bg-[#F4EFE6] text-black focus:bg-[#F4D04C]" : "",
        appTheme === "theme2" ? "rounded-md border border-zinc-700 bg-[#0D0E12] text-zinc-200 focus:border-zinc-500" : ""
      )}
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <select
      {...props}
      className={clsx(
        "h-8 w-full px-2 text-[11px] font-bold outline-none transition-colors disabled:opacity-50",
        appTheme === "theme1" ? "rounded-none border-[3px] border-black bg-[#F4EFE6] text-black focus:bg-[#F4D04C]" : "",
        appTheme === "theme2" ? "rounded-md border border-zinc-700 bg-[#0D0E12] text-zinc-200 focus:border-zinc-500" : ""
      )}
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
  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <label className={clsx(
      "flex h-8 items-center justify-between px-1.5 cursor-pointer transition-colors",
      appTheme === "theme1" ? "rounded-none border-[3px] border-transparent hover:border-black hover:bg-[#F4D04C]" : "",
      appTheme === "theme2" ? "rounded-md border border-transparent hover:bg-zinc-800/50" : ""
    )}>
      <span className={clsx(
        "text-[11px] font-bold uppercase tracking-wider",
        appTheme === "theme1" ? "text-black" : "",
        appTheme === "theme2" ? "text-zinc-400" : ""
      )}>{label}</span>
      <input
        checked={checked}
        className={clsx(
          "size-3.5 outline-none",
          appTheme === "theme1" ? "rounded-none accent-black focus:ring-2 focus:ring-black" : "",
          appTheme === "theme2" ? "rounded-[4px] accent-zinc-500 focus:ring-2 focus:ring-zinc-500" : ""
        )}
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
  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <div className={clsx(
      "flex flex-col gap-0.5 px-2 py-1.5",
      appTheme === "theme1" ? "rounded-none border-[3px] border-black bg-[#F4EFE6]" : "",
      appTheme === "theme2" ? "rounded-md border border-zinc-800/60 bg-[#0D0E12]" : ""
    )}>
      <p className={clsx(
        "text-[10px] font-bold uppercase tracking-wider",
        appTheme === "theme1" ? "text-black" : "",
        appTheme === "theme2" ? "text-zinc-500" : ""
      )}>
        {label}
      </p>
      <p className={clsx(
        "break-all font-mono text-[11px] font-bold",
        appTheme === "theme1" ? "text-black" : "",
        appTheme === "theme2" ? "text-zinc-200" : ""
      )}>{value}</p>
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
  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <section>
      <h3 className={clsx(
        "text-[11px] font-bold uppercase tracking-wider inline-block px-1.5 py-0.5 mb-1",
        appTheme === "theme1" ? "text-black bg-[#F4D04C] border-[3px] border-black" : "",
        appTheme === "theme2" ? "text-zinc-300 bg-zinc-800/50 rounded-sm" : ""
      )}>
        {title}
      </h3>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
