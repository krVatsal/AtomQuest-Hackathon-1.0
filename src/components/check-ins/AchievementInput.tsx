"use client";

import { Input } from "@/components/ui/input";
import type { UoMType } from "@/lib/scoring";

interface AchievementInputProps {
  uom: UoMType;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

export function AchievementInput({
  uom,
  value,
  onChange,
  disabled = false,
}: AchievementInputProps) {
  switch (uom) {
    case "TIMELINE":
      return (
        <Input
          type="date"
          className="h-7 w-36 text-sm"
          disabled={disabled}
          value={value ? new Date(value).toISOString().split("T")[0] : ""}
          onChange={(e) => {
            const d = e.target.value ? new Date(e.target.value).getTime() : null;
            onChange(d);
          }}
        />
      );

    case "ZERO":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            disabled={disabled}
            checked={value === 0}
            onChange={(e) => onChange(e.target.checked ? 0 : 1)}
          />
          <span className="text-muted-foreground">Achieved zero incidents</span>
        </label>
      );

    case "NUMERIC_MIN":
    case "NUMERIC_MAX":
    default:
      return (
        <Input
          type="number"
          step="any"
          placeholder="e.g. 85"
          className="h-7 w-24 text-sm"
          disabled={disabled}
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? null : parseFloat(v));
          }}
        />
      );
  }
}
