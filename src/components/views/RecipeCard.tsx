import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import type { RecipeCardProps } from "./types";

const NutritionValue = ({ label, value }: { label: string; value: number | null }) => {
  const displayValue = value === null ? "–" : value;
  const unit = label === "Kalorie" ? " kcal" : "g";

  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value === null ? "–" : `${displayValue}${unit}`}</span>
    </div>
  );
};

export const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const { id, name, kcal, proteinG, fatG, carbsG, aiStatus } = recipe;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <a href={`/recipes/${id}`} className="block">
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-xl">{name}</CardTitle>
            {aiStatus === "error" && <Badge variant="destructive">Błąd</Badge>}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <NutritionValue label="Kalorie" value={kcal} />
            <NutritionValue label="Białko" value={proteinG} />
            <NutritionValue label="Tłuszcze" value={fatG} />
            <NutritionValue label="Węglowodany" value={carbsG} />
          </div>
        </CardContent>
      </a>
    </Card>
  );
};
