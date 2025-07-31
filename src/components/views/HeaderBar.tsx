import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { X } from 'lucide-react';
import type { HeaderBarProps } from './types';

export const HeaderBar = ({ recipeCount, onSearch }: HeaderBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isAddDisabled = recipeCount >= 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch(''); // To spowoduje załadowanie wszystkich przepisów
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <form onSubmit={handleSubmit} className="flex w-full sm:w-auto gap-2">
        <Input
          type="search"
          placeholder="Szukaj przepisów..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80"
        />
        <Button type="submit">
          Szukaj
        </Button>
        {searchTerm && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClear}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Wyczyść
          </Button>
        )}
      </form>

      <Button 
        asChild
        variant="default"
        disabled={isAddDisabled}
        className="w-full sm:w-auto"
      >
        <a 
          href="/recipes/new"
          title={isAddDisabled ? "Osiągnięto limit 100 przepisów" : undefined}
        >
          Dodaj przepis
        </a>
      </Button>
    </div>
  );
}; 