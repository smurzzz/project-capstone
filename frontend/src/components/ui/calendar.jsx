"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("mx-auto w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4", className)}
      classNames={{
        months: "flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center",
        month: "flex w-full max-w-[20rem] flex-col gap-4",
        caption: "flex justify-center relative items-center w-full px-10",
        caption_label: "text-sm font-semibold tracking-wide text-gray-900",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 rounded-full border border-gray-100 bg-white p-0 text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-900",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full table-fixed border-collapse",
        head_row: "grid grid-cols-7",
        head_cell:
          "h-8 min-w-0 rounded-md text-center text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-gray-400",
        row: "grid w-full grid-cols-7 gap-1",
        cell: cn(
          "relative flex min-w-0 justify-center p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-full [&:has(>.day-range-start)]:rounded-full first:[&:has([aria-selected])]:rounded-full last:[&:has([aria-selected])]:rounded-full"
            : "[&:has([aria-selected])]:rounded-full",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 rounded-full p-0 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-950 aria-selected:opacity-100 sm:size-10",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-gray-950 aria-selected:text-white",
        day_range_end:
          "day-range-end aria-selected:bg-gray-950 aria-selected:text-white",
        day_selected:
          "bg-gray-950 text-white shadow-sm hover:bg-gray-950 hover:text-white focus:bg-gray-950 focus:text-white",
        day_today: "bg-gray-100 text-gray-950",
        day_outside:
          "day-outside text-gray-300 aria-selected:text-gray-300",
        day_disabled: "text-gray-300 opacity-50 line-through",
        day_range_middle:
          "aria-selected:bg-gray-100 aria-selected:text-gray-950",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
