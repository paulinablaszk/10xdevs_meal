import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UnitType } from "@/types";
import { Constants } from "@/db/database.types";

interface UnitSelectProps {
  value: UnitType;
  onChange: (value: UnitType) => void;
}

export function UnitSelect({ value, onChange }: UnitSelectProps) {
  const units = [...Constants.public.Enums.unit_type] as [UnitType, ...UnitType[]];

  if (!units.includes(value)) {
    console.warn("UnitSelect: Otrzymana wartość nie znajduje się na liście dostępnych jednostek!");
  }

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        onChange(val as UnitType);
      }}
    >
      <SelectTrigger className="w-full" data-testid="ingredient-unit">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {units.map((unit) => (
          <SelectItem key={unit} value={unit}>
            {unit}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
