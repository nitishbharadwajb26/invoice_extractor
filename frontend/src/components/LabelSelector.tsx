"use client";

import { Label } from "@/types";

interface LabelSelectorProps {
  labels: Label[];
  selectedLabel: string | null;
  onSelect: (labelId: string) => void;
  loading?: boolean;
}

export function LabelSelector({
  labels,
  selectedLabel,
  onSelect,
  loading = false,
}: LabelSelectorProps) {
  return (
    <select
      value={selectedLabel || ""}
      onChange={(e) => onSelect(e.target.value)}
      disabled={loading}
      className="border rounded-md px-3 py-2 bg-white min-w-[200px] disabled:opacity-50"
    >
      <option value="">Select a label...</option>
      {labels.map((label) => (
        <option key={label.id} value={label.id}>
          {label.name}
        </option>
      ))}
    </select>
  );
}
