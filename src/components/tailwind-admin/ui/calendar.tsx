"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/tailwind-admin/utils"
import { Button, buttonVariants } from "@/components/tailwind-admin/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "buttons" as React.ComponentProps<typeof DayPicker>["captionLayout"],
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const calendarComponents = {
    IconLeft: ({ className, ...iconProps }: React.ComponentProps<"svg">) => (
      <ChevronLeftIcon className={cn("size-4", className)} {...iconProps} />
    ),
    IconRight: ({ className, ...iconProps }: React.ComponentProps<"svg">) => (
      <ChevronRightIcon className={cn("size-4", className)} {...iconProps} />
    ),
    Chevron: ({
      className,
      orientation,
      ...iconProps
    }: React.ComponentProps<"svg"> & { orientation?: "left" | "right" | "down" }) => {
      if (orientation === "left") {
        return <ChevronLeftIcon className={cn("size-4", className)} {...iconProps} />
      }
      if (orientation === "right") {
        return <ChevronRightIcon className={cn("size-4", className)} {...iconProps} />
      }
      return <ChevronDownIcon className={cn("size-4", className)} {...iconProps} />
    },
    ...components,
  } as unknown as React.ComponentProps<typeof DayPicker>["components"]

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background p-3",
        "rtl:**:[.rdp-nav_button_next>svg]:rotate-180",
        "rtl:**:[.rdp-nav_button_previous>svg]:rotate-180",
        className
      )}
      captionLayout={captionLayout}
      formatters={formatters}
      classNames={{
        months: "flex flex-col gap-4 md:flex-row",
        month: "flex flex-col gap-4",
        caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        nav_button: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 bg-transparent p-0 opacity-60 hover:opacity-100"
        ),
        nav_button_previous: "left-1",
        nav_button_next: "right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "text-muted-foreground w-9 rounded-md text-[0.8rem] font-normal",
        row: "mt-2 flex w-full",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "text-muted-foreground opacity-50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_start:
          "day-range-start bg-primary text-primary-foreground rounded-l-md",
        day_range_end:
          "day-range-end bg-primary text-primary-foreground rounded-r-md",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={calendarComponents}
      {...props}
    />
  )
}

function CalendarDayButton(props: React.ComponentProps<"button">) {
  return <Button variant="ghost" size="icon" {...props} />
}

export { Calendar, CalendarDayButton }
