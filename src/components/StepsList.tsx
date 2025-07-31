import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StepsListProps {
  steps: string[];
}

export function StepsList({ steps }: StepsListProps) {
  if (!steps.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Sposób przygotowania</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Brak kroków przygotowania</p>
        </CardContent>
      </Card>
    );
  }

  if (steps.length > 20) {
    console.warn('StepsList: Liczba kroków przekracza maksymalną wartość (20)');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Sposób przygotowania</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal list-inside space-y-4">
          {steps.slice(0, 20).map((step, index) => (
            <li 
              key={index}
              className="pl-2 leading-relaxed"
            >
              {step}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
} 