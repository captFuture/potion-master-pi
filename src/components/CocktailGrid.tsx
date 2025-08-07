import { useState } from 'react';
import { CocktailRecipe } from '@/types/cocktail';
import { Button } from '@/components/ui/button';
import { Martini, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(0);
  
  // Calculate items per page for 1024x768 screen
  const itemsPerPage = 6; // 2 rows × 3 columns for optimal touch interaction
  const totalPages = Math.ceil(cocktails.length / itemsPerPage);
  
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCocktails = cocktails.slice(startIndex, endIndex);
  
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };
  
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
    <div className="relative">
      {/* Navigation Arrows */}
      {totalPages > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-16 w-16 rounded-full shadow-lg"
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-16 w-16 rounded-full shadow-lg"
            onClick={goToNextPage}
            disabled={currentPage === totalPages - 1}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}
      
      {/* Cocktail Grid */}
      <div className="grid grid-cols-3 gap-6 px-20">
        {currentCocktails.map((cocktail) => (
          <Button
            key={cocktail.id}
            variant={isHogwarts ? "magical" : "cocktail"}
            size="cocktail"
            onClick={() => onSelectCocktail(cocktail.id)}
            className={`flex flex-col items-start justify-end text-left relative overflow-hidden group ${
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
      
      {/* Page Indicator */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }, (_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentPage 
                  ? 'bg-primary' 
                  : 'bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}