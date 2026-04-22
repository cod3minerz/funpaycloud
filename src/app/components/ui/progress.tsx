"use client";

import * as React from "react";

import { cn } from "./utils";

function Progress({
  className,
  value,
  max,
  ...props
}: React.ComponentProps<"progress">) {
  const safeMax = typeof max === "number" && max > 0 ? max : 100;
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  const safeValue = Number.isFinite(numericValue)
    ? Math.min(safeMax, Math.max(0, numericValue))
    : 0;

  return (
    <progress
      data-slot="progress"
      className={cn(
        "ui-progress bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      value={safeValue}
      max={safeMax}
      {...props}
    />
  );
}

export { Progress };
