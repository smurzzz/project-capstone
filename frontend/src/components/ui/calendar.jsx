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
      className={cn("rounded-3xl border border-gray-100 bg-white p-4 shadow-sm", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-3",
        month: "flex flex-col gap-5",
        caption: "flex justify-center relative items-center w-full px-10",
        caption_label: "text-sm font-semibold tracking-wide text-gray-900",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 rounded-full border border-gray-100 bg-white p-0 text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-900",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "w-9 rounded-md text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-gray-400",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-full [&:has(>.day-range-start)]:rounded-full first:[&:has([aria-selected])]:rounded-full last:[&:has([aria-selected])]:rounded-full"
            : "[&:has([aria-selected])]:rounded-full",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 rounded-full p-0 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-950 aria-selected:opacity-100",
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
