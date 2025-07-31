import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnitSelect } from "./UnitSelect";
import type { IngredientViewModel } from "./types";
import { Controller, type FieldErrors, type UseFormRegister, type Control } from "react-hook-form";
import { Trash2 } from "lucide-react";
import type { FormData } from "./RecipeForm";

interface IngredientRowProps {
  index: number;
  register: UseFormRegister<FormData>;
  control: Control<FormData>;
  errors?: FieldErrors<IngredientViewModel>;
  onRemove: (index: number) => void;
  canDelete: boolean;
}

export function IngredientRow({
  index,
  register,
  control,
  errors,
  onRemove,
  canDelete
}: IngredientRowProps) {
  return (
    <div className="flex gap-4 items-start mb-4">
      <div className="flex-1">
        <Input
          {...register(`ingredients.${index}.name`)}
          placeholder="Nazwa składnika"
          className={errors?.name ? "border-red-500" : ""}
        />
        {errors?.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="w-24">
        <Input
          {...register(`ingredients.${index}.amount`)}
          placeholder="Ilość"
          type="number"
          min="0"
          step="0.1"
          className={errors?.amount ? "border-red-500" : ""}
        />
        {errors?.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
        )}
      </div>

      <div className="w-32">
        <Controller
          control={control}
          name={`ingredients.${index}.unit`}
          render={({ field }) => (
            <UnitSelect
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors?.unit && (
          <p className="text-red-500 text-sm mt-1">{errors.unit.message}</p>
        )}
      </div>

      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="mt-1"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
} 