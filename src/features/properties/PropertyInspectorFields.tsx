import * as React from "react";
import type {
  CircleObject,
  DashStyle,
  GeometryObject,
  LabelPosition,
  PointObject,
  PatternType,
} from "../../core/geometry";
import { getCircleGeometry } from "../../core/geometry";
import { clsx } from "clsx";
import { useUiStore } from "../../app/store/uiStore";

export const dashOptions = ["solid", "dashed", "dotted"] satisfies readonly DashStyle[];
export const patternOptions = ["none", "dots", "stars", "triangles", "squares", "hatch", "crosshatch"] satisfies readonly PatternType[];
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
    <label className="grid gap-1">
      <span className={clsx(
        "text-[10px] font-bold uppercase tracking-wider",
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
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <input
      ref={inputRef}
      {...props}
      onChange={(e) => {
        if (props.type === "number" && inputRef.current) {
          const val = inputRef.current.value;
          // Loại bỏ số 0 ở đầu nếu ngay sau nó là 1 chữ số khác (ví dụ: "002" -> "2", "-002" -> "-2", "00.5" -> "0.5")
          const fixed = val.replace(/^(-?)0+(?=\d)/, "$1");
          if (fixed !== val) {
            inputRef.current.value = fixed;
          }
        }
        if (props.onChange) props.onChange(e);
      }}
      className={clsx(
        "h-7 w-full px-1.5 font-mono text-[11px] outline-none transition-colors disabled:opacity-50",
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
        "h-7 w-full px-1.5 text-[11px] font-bold outline-none transition-colors disabled:opacity-50",
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
      "flex h-7 items-center justify-between px-1 cursor-pointer transition-colors",
      appTheme === "theme1" ? "rounded-none border-[3px] border-transparent hover:border-black hover:bg-[#F4D04C]" : "",
      appTheme === "theme2" ? "rounded-md border border-transparent hover:bg-zinc-800/50" : ""
    )}>
      <span className={clsx(
        "text-[10px] font-bold uppercase tracking-wider",
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
      "flex flex-col gap-0.5 px-2 py-1",
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
        "text-[10px] font-bold uppercase tracking-wider inline-block px-1.5 py-0.5 mb-0.5",
        appTheme === "theme1" ? "text-black bg-[#F4D04C] border-[3px] border-black" : "",
        appTheme === "theme2" ? "text-zinc-300 bg-zinc-800/50 rounded-sm" : ""
      )}>
        {title}
      </h3>
      <div className="mt-1.5 space-y-1.5">{children}</div>
    </section>
  );
}

export function ExpandableDetails({
  summary,
  children,
}: {
  readonly summary: string;
  readonly children: React.ReactNode;
}) {
  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <details className="group [&_summary::-webkit-details-marker]:hidden">
      <summary className={clsx(
        "cursor-pointer text-[10px] font-bold uppercase tracking-wider select-none flex items-center gap-1 w-fit py-0.5",
        appTheme === "theme1" ? "text-black hover:bg-black/5" : "text-zinc-500 hover:text-zinc-300"
      )}>
        <span className="transition-transform group-open:rotate-90">▶</span>
        {summary}
      </summary>
      <div className="mt-1.5 space-y-1.5">
        {children}
      </div>
    </details>
  );
}

const COMMON_COLORS = [
  "transparent",
  "#000000",
  "#52525b",
  "#d4d4d8",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899"
];

function ColorPalette({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {COMMON_COLORS.map((color) => {
        const isSelected = value === color || (value === "transparent" && color === "transparent");
        return (
          <button
            key={color}
            onClick={() => onChange(color)}
            title={color}
            type="button"
            className={clsx(
              "w-4 h-4 flex items-center justify-center transition-transform hover:scale-125",
              appTheme === "theme1" ? "border border-black" : "border border-zinc-700 rounded-[3px]",
              isSelected && (appTheme === "theme1" ? "outline outline-[1.5px] outline-black outline-offset-[1.5px]" : "ring-[1.5px] ring-zinc-400 ring-offset-1 ring-offset-zinc-900")
            )}
            style={{ 
              backgroundColor: color === "transparent" ? "#fff" : color,
              backgroundImage: color === "transparent" ? "conic-gradient(#e5e5e5 90deg, #fff 90deg 180deg, #e5e5e5 180deg 270deg, #fff 270deg)" : "none",
              backgroundPosition: color === "transparent" ? "0 0" : "auto",
              backgroundSize: color === "transparent" ? "6px 6px" : "auto",
            }}
          />
        );
      })}
    </div>
  );
}

export function ColorPickerButton({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const appTheme = useUiStore((state) => state.appTheme);
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex flex-col">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "h-6 w-full cursor-pointer hover:opacity-80 active:scale-95 transition-all",
          appTheme === "theme1" ? "border-2 border-black" : "border border-zinc-600 rounded-[4px]",
        )}
        style={{ 
          backgroundColor: value === "transparent" ? "#fff" : value,
          backgroundImage: value === "transparent" ? "conic-gradient(#e5e5e5 90deg, #fff 90deg 180deg, #e5e5e5 180deg 270deg, #fff 270deg)" : "none",
          backgroundPosition: value === "transparent" ? "0 0" : "auto",
          backgroundSize: value === "transparent" ? "6px 6px" : "auto",
        }}
      />
      {isOpen && (
         <div className="mt-1 pb-1">
           <ColorPalette 
             value={value} 
             onChange={(c) => { 
               onChange(c); 
               setIsOpen(false); 
             }} 
           />
         </div>
      )}
    </div>
  );
}
