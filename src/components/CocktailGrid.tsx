import { CocktailRecipe } from '@/types/cocktail';
import { Button } from '@/components/ui/button';
import { Martini, Sparkles } from 'lucide-react';

interface CocktailGridProps {
  cocktails: CocktailRecipe[];
  getCocktailName: (cocktailId: string) => string;
  getIngredientName: (ingredientId: string) => string;
  onSelectCocktail: (cocktailId: string) => void;
}

export function CocktailGrid({ 
  cocktails, 
  getCocktailName, 
  getIngredientName, 
  onSelectCocktail 
}: CocktailGridProps) {
  if (cocktails.length === 0) {
    return (
      <div className="text-center py-12">
        <Martini className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">
          No cocktails available
        </h3>
        <p className="text-muted-foreground">
          Please enable more ingredients in settings
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cocktails.map((cocktail) => (
        <Button
          key={cocktail.id}
          variant="cocktail"
          size="cocktail"
          onClick={() => onSelectCocktail(cocktail.id)}
          className="flex flex-col items-start text-left relative overflow-hidden group"
        >
          <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <Sparkles className="h-8 w-8" />
          </div>
          
          <div className="w-full">
            <h3 className="text-lg font-bold mb-3 text-foreground">
              {getCocktailName(cocktail.id)}
            </h3>
            
            <div className="space-y-1">
              {Object.entries(cocktail.ingredients).map(([ingredient, amount]) => (
                <div key={ingredient} className="flex justify-between text-sm text-muted-foreground">
                  <span>{getIngredientName(ingredient)}</span>
                  <span>{amount}ml</span>
                </div>
              ))}
              
              {cocktail.post_add && (
                <div className="text-xs text-warning mt-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>+ {getIngredientName(cocktail.post_add)}</span>
                </div>
              )}
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}