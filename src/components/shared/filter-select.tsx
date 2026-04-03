"use client";

import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder = "All",
  className,
}: FilterSelectProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("w-full sm:w-40", className)}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}
