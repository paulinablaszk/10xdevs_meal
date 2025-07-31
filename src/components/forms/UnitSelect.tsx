import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UnitType } from "@/types";

interface UnitSelectProps {
  value: UnitType;
  onChange: (value: UnitType) => void;
}

export function UnitSelect({ value, onChange }: UnitSelectProps) {
  const units: UnitType[] = ["g", "ml", "sztuka", "łyżka", "szklanka", "dag", "kg", "l", "łyżeczka", "pęczek", "garść", "plaster", "szczypta", "ząbek"];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Wybierz jednostkę" />
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