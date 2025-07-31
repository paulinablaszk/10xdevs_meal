import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IngredientDTO } from "@/types";

interface IngredientsListProps {
  ingredients: IngredientDTO[];
}

export function IngredientsList({ ingredients }: IngredientsListProps) {
  if (!ingredients.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Składniki</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Brak danych o składnikach</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Składniki</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {ingredients.map((ingredient, index) => (
            <li 
              key={`${ingredient.name}-${index}`}
              className="flex items-center justify-between py-1 border-b last:border-0 border-gray-100"
            >
              <span className="font-medium">{ingredient.name}</span>
              <span className="text-gray-600">
                {ingredient.amount} {ingredient.unit}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 