import { CocktailRecipe } from '@/types/cocktail';
import { Button } from '@/components/ui/button';
import { Martini, Sparkles } from 'lucide-react';

interface CocktailGridProps {
  cocktails: CocktailRecipe[];
  getCocktailName: (cocktailId: string) => string;
  getIngredientName: (ingredientId: string) => string;
  language: string;
  onSelectCocktail: (cocktailId: string) => void;
}

export function CocktailGrid({ 
  cocktails, 
  getCocktailName, 
  getIngredientName, 
  language,
  onSelectCocktail 
}: CocktailGridProps) {
  const isHogwarts = language === 'hogwarts';
  
  if (cocktails.length === 0) {
    return (
      <div className="text-center py-12">
        <Martini className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">
          {isHogwarts ? 'No magical elixirs available' : 'No cocktails available'}
        </h3>
        <p className="text-muted-foreground">
          {isHogwarts ? 'Please enable more ingredients in the potions laboratory' : 'Please enable more ingredients in settings'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cocktails.map((cocktail) => (
        <Button
          key={cocktail.id}
          variant={isHogwarts ? "magical" : "cocktail"}
          size="cocktail"
          onClick={() => onSelectCocktail(cocktail.id)}
          className={`flex flex-col items-start text-left relative overflow-hidden group ${
            isHogwarts ? 'animate-float' : ''
          }`}
        >
          <div className={`absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity ${
            isHogwarts ? 'text-warning' : ''
          }`}>
            <Sparkles className="h-8 w-8" />
          </div>
          
          <div className="w-full">
            <h3 className={`text-lg font-bold mb-3 text-foreground ${
              isHogwarts ? 'text-magical' : ''
            }`}>
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
                <div className={`text-xs mt-2 flex items-center gap-1 ${
                  isHogwarts ? 'text-warning' : 'text-warning'
                }`}>
                  <Sparkles className="h-3 w-3" />
                  <span>{isHogwarts ? '+ Manual enchantment: ' : '+ '}{getIngredientName(cocktail.post_add)}</span>
                </div>
              )}
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}