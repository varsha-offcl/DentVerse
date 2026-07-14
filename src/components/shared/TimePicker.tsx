import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Every appointment.time in the app is a zero-padded 12-hour string like
// "09:30 AM" — CalendarView/Dashboard sort appointments with a plain
// localeCompare on this exact format, so any picker built on top of it
// must always emit that shape.
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function parseTime(value: string): { hour: number; minute: number; period: "AM" | "PM" } {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: 9, minute: 0, period: "AM" };
  return {
    hour: parseInt(match[1], 10),
    minute: parseInt(match[2], 10),
    period: match[3].toUpperCase() as "AM" | "PM",
  };
}

function formatTime(hour: number, minute: number, period: "AM" | "PM"): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export default function TimePicker({ value, onChange, id }: TimePickerProps) {
  const { hour, minute, period } = parseTime(value);

  return (
    <div id={id} className="flex gap-1.5">
      <Select value={String(hour)} onValueChange={(h) => onChange(formatTime(Number(h), minute, period))}>
        <SelectTrigger className="w-[64px] px-2">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={String(h)}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(minute).padStart(2, "0")} onValueChange={(m) => onChange(formatTime(hour, Number(m), period))}>
        <SelectTrigger className="w-[64px] px-2">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={String(m).padStart(2, "0")}>{String(m).padStart(2, "0")}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={period} onValueChange={(p) => onChange(formatTime(hour, minute, p as "AM" | "PM"))}>
        <SelectTrigger className="w-[72px] px-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
