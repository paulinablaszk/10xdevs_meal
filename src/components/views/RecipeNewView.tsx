import { RecipeForm } from '@/components/forms/RecipeForm';

export default function RecipeNewView() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Dodaj nowy przepis</h1>
      <RecipeForm />
    </main>
  );
} 