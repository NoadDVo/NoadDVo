import { clsx } from "clsx";

type DividerProps = {
  readonly orientation?: "horizontal" | "vertical";
  readonly className?: string;
};

export function Divider({
  orientation = "horizontal",
  className,
}: DividerProps) {
  return (
    <div
      className={clsx(
        "bg-arctic-border/8",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      role="separator"
    />
  );
}
