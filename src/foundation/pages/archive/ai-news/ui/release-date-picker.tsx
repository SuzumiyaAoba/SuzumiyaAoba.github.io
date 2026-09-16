"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { enUS } from "react-day-picker/locale/en-US";
import { ja } from "react-day-picker/locale/ja";
import type { Locale } from "@/shared/lib/routing";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { dateTimestamp } from "../model/release-calendar";

export function ReleaseDatePicker({
  month,
  selectedDate,
  today,
  locale,
  onSelectDate,
  onOpen,
}: {
  month: string;
  selectedDate: string;
  today: string;
  locale: Locale;
  onSelectDate: (date: string) => void;
  onOpen: () => void;
}) {
  const en = locale === "en";
  const [open, setOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(
    () => new Date(dateTimestamp(`${month}-01`))
  );
  const todayYear = Number(today.slice(0, 4));
  const visibleYear = Number(month.slice(0, 4));
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onOpen();
          setPickerMonth(new Date(dateTimestamp(`${month}-01`)));
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="flat"
          size="xl"
          aria-label={en ? "Jump to month" : "月へ移動"}
          className="w-0 min-w-0 flex-1 justify-between sm:w-40 sm:flex-none"
        >
          <span className="truncate tabular-nums">
            {monthFormatter.format(dateTimestamp(`${month}-01`))}
          </span>
          <CalendarDays
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        variant="bare"
        aria-label={en ? "Choose a date to navigate to" : "移動する日付を選択"}
        className="w-auto max-w-[calc(100vw-24px)]"
      >
        {/* 開く操作に応じて、ダイアログ内の選択日へフォーカスを移す。 */}
        <div className="font-noto">
          <Calendar
            mode="single"
            required
            locale={en ? enUS : ja}
            timeZone="UTC"
            today={new Date(dateTimestamp(today))}
            selected={new Date(dateTimestamp(selectedDate))}
            month={pickerMonth}
            onMonthChange={setPickerMonth}
            captionLayout="dropdown"
            startMonth={
              new Date(Date.UTC(Math.min(todayYear - 100, visibleYear), 0, 1))
            }
            endMonth={
              new Date(Date.UTC(Math.max(todayYear + 100, visibleYear), 11, 1))
            }
            onSelect={(date) => {
              onSelectDate(date.toISOString().slice(0, 10));
              setOpen(false);
            }}
            formatters={{
              formatMonthDropdown: (date) =>
                new Intl.DateTimeFormat(locale, {
                  month: "short",
                  timeZone: "UTC",
                }).format(date),
            }}
            className="[--cell-size:2.25rem]"
            autoFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
