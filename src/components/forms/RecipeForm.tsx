import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, useFieldArray } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { RecipeFormViewModel, IngredientViewModel } from "./types";
import type { RecipeCreateCommand, UnitType } from "@/types";
import { IngredientRow } from "./IngredientRow";
import { StepsTextarea } from "./StepsTextarea";
import { toast } from "sonner";
import { FullScreenSpinner } from "@/components/ui/full-screen-spinner";
import { AlertAIError } from "@/components/AlertAIError";
import { useState } from "react";

const recipeFormSchema = z.object({
  name: z.string().min(3, "Nazwa musi mieć co najmniej 3 znaki"),
  ingredients: z.array(z.object({
    name: z.string().min(1, "Nazwa składnika jest wymagana"),
    amount: z.string().min(1, "Ilość jest wymagana").refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Ilość musi być liczbą większą od 0"
    ),
    unit: z.enum(["g", "ml", "sztuka", "łyżka", "szklanka", "dag", "kg", "l", "łyżeczka", "pęczek", "garść", "plaster", "szczypta", "ząbek"] as [UnitType, ...UnitType[]])
  })).min(1, "Przepis musi zawierać co najmniej jeden składnik"),
  steps: z.string().min(1, "Kroki przygotowania są wymagane")
});

export type FormData = z.infer<typeof recipeFormSchema>;

export function RecipeForm() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: "",
      ingredients: [{ name: "", amount: "", unit: "g" }],
      steps: ""
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients"
  });

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    try {
      setAiError(null);
      
      const command: RecipeCreateCommand = {
        name: formData.name,
        description: null,
        ingredients: formData.ingredients.map(ing => ({
          name: ing.name,
          amount: Number(ing.amount),
          unit: ing.unit
        })),
        steps: formData.steps.split("\n").filter(step => step.trim() !== "")
      };

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(command)
      });

      if (!response.ok) {
        const data = await response.json();
        
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        
        if (response.status === 429) {
          toast.error("Przekroczono limit przepisów na użytkownika.");
          return;
        }

        // Obsługa błędów AI
        if (data.error === 'AI Error') {
          setAiError(data.message);
          return;
        }

        throw new Error(data.message || "Błąd serwera");
      }

      const data = await response.json();
      
      if (!data || !data.id) {
        throw new Error("Nieprawidłowa odpowiedź z serwera");
      }

      setIsRedirecting(true);
      
      // Przekierowanie z opóźnieniem, aby pokazać spinner
      setTimeout(() => {
        window.location.href = `/recipes/${data.id}`;
      }, 500);
    } catch (error) {
      console.error(error);
      toast.error("Wystąpił błąd. Spróbuj ponownie później.");
    }
  };

  return (
    <>
      {isRedirecting && <FullScreenSpinner />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {aiError && (
          <AlertAIError message={aiError} />
        )}

        <div className="space-y-4">
          <div>
            <Input
              {...register("name")}
              placeholder="Nazwa przepisu"
              className="text-xl"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Składniki</h3>
            {fields.map((field, index) => (
              <IngredientRow
                key={field.id}
                index={index}
                register={register}
                control={control}
                errors={errors.ingredients?.[index]}
                onRemove={() => remove(index)}
                canDelete={fields.length > 1}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ name: "", amount: "", unit: "g" })}
              className="mt-2 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 w-auto flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Dodaj składnik
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Kroki przygotowania</h3>
            <StepsTextarea
              {...register("steps")}
            />
            {errors.steps && (
              <p className="text-red-500 text-sm mt-1">{errors.steps.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-auto bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Obliczanie wartości odżywczych...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Zapisz przepis
            </>
          )}
        </Button>
      </form>
    </>
  );
} 