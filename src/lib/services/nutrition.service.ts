import type { IngredientDTO } from "@/types";
import { openRouter } from "./openrouter.service";
import type { JSONSchemaSpec } from "@/types";
import { supabaseClient } from "@/db/supabase.client";

interface NutritionValues {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

const NUTRITION_SCHEMA: JSONSchemaSpec = {
  type: "json_schema",
  json_schema: {
    name: "nutrition_values",
    strict: true,
    schema: {
      type: "object",
      properties: {
        kcal: { type: "number", minimum: 0 },
        protein_g: { type: "number", minimum: 0 },
        fat_g: { type: "number", minimum: 0 },
        carbs_g: { type: "number", minimum: 0 },
      },
      required: ["kcal", "protein_g", "fat_g", "carbs_g"],
    },
  },
};

export class NutritionService {
  async calculateNutrition(
    ingredients: IngredientDTO[],
    recipeId: string
  ): Promise<NutritionValues> {
    // Formatujemy składniki do czytelnej listy dla AI
    const ingredientsList = ingredients.map((i) => `- ${i.name}: ${i.amount} ${i.unit}`).join("\n");

    const prompt = `Jesteś precyzyjnym ekspertem od dietetyki specjalizującym się w obliczaniu wartości odżywczych potraw.

ZADANIE:
Oblicz dokładne wartości odżywcze dla podanej listy składników, uwzględniając ich ilości i jednostki.

ZASADY OBLICZEŃ:
1. Używaj standardowej bazy wartości odżywczych dla surowych składników
2. Dla każdego składnika przelicz wartości na 100g/100ml jako punkt odniesienia
3. Uwzględnij przeliczniki dla nietypowych jednostek, np:
   - łyżka = 15ml/g
   - łyżeczka = 5ml/g
   - szklanka = 250ml
   - sztuka (zależy od produktu, np. średnie jajko = 50g)

WYMAGANY FORMAT ODPOWIEDZI (tylko JSON):
{
  "kcal": number,      // Całkowita kaloryczność
  "protein_g": number, // Białko w gramach
  "fat_g": number,     // Tłuszcze w gramach
  "carbs_g": number    // Węglowodany w gramach
}

WAŻNE:
- Wszystkie wartości muszą być liczbami >= 0
- Zaokrąglaj wartości do 1 miejsca po przecinku
- Nie dodawaj komentarzy ani wyjaśnień
- Zwróć tylko obiekt JSON`;

    try {
      // Tworzymy wpis w ai_runs ze statusem pending
      const { data: aiRun, error: insertError } = await supabaseClient
        .from("ai_runs")
        .insert({
          recipe_id: recipeId,
          status: "pending",
          prompt: `${prompt}\n\nSkładniki:\n${ingredientsList}`,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Błąd podczas tworzenia ai_run:", insertError);
        throw insertError;
      }

      // Wywołujemy AI
      const response = await openRouter.sendChat({
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: `Oblicz wartości odżywcze dla następujących składników:\n${ingredientsList}`,
          },
        ],
        responseFormat: NUTRITION_SCHEMA,
      });

      const nutritionValues = JSON.parse(response.content);

      // Aktualizujemy wpis w ai_runs ze statusem success
      const { error: updateError } = await supabaseClient
        .from("ai_runs")
        .update({
          status: "success",
          response: nutritionValues,
          confidence: 0.9, // TODO: Implementacja rzeczywistego wyliczania pewności
        })
        .eq("id", aiRun.id);

      if (updateError) {
        console.error("Błąd podczas aktualizacji ai_run:", updateError);
      }

      return nutritionValues;
    } catch (error) {
      // W przypadku błędu aktualizujemy wpis w ai_runs ze statusem error
      if (error instanceof Error) {
        await supabaseClient
          .from("ai_runs")
          .update({
            status: "error",
            error_message: error.message,
          })
          .eq("recipe_id", recipeId);
      }
      throw error;
    }
  }
}

// Eksport domyślnej instancji
export const nutritionService = new NutritionService();
