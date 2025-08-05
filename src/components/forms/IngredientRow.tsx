import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnitSelect } from "./UnitSelect";
import type { IngredientViewModel } from "./types";
import { Controller, type FieldErrors, type UseFormRegister, type Control } from "react-hook-form";
import { Trash2 } from "lucide-react";
import type { FormData } from "./RecipeForm";
import { cn } from "@/lib/utils";

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
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-[2]">
        <Input
          {...register(`ingredients.${index}.name`)}
          placeholder="Nazwa składnika"
          className={cn(
            errors?.name ? "border-red-500" : "",
            "w-full"
          )}
        />
        {errors?.name && (
          <p className="text-red-500 text-sm mt-1 absolute">{errors.name.message}</p>
        )}
      </div>

      <div className="w-24">
        <Input
          {...register(`ingredients.${index}.amount`)}
          placeholder="Ilość"
          type="number"
          min="0"
          step="0.1"
          className={cn(
            errors?.amount ? "border-red-500" : "",
            "w-full"
          )}
        />
        {errors?.amount && (
          <p className="text-red-500 text-sm mt-1 absolute">{errors.amount.message}</p>
        )}
      </div>

      <div className="w-32">
        <Controller
          control={control}
          name={`ingredients.${index}.unit`}
          render={({ field }) => {
            console.log('IngredientRow Controller render:', {
              fieldValue: field.value,
              fieldName: field.name,
              index
            });
            return (
              <UnitSelect
                value={field.value}
                onChange={field.onChange}
              />
            );
          }}
        />
        {errors?.unit && (
          <p className="text-red-500 text-sm mt-1 absolute">{errors.unit.message}</p>
        )}
      </div>

      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
} 