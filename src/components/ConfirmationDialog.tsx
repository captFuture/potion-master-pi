import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CocktailRecipe } from '@/types/cocktail';
import { Martini, Clock, AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  cocktail: CocktailRecipe | null;
  getCocktailName: (cocktailId: string) => string;
  getIngredientName: (ingredientId: string) => string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  cocktail,
  getCocktailName,
  getIngredientName,
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  if (!cocktail) return null;

  const totalVolume = Object.values(cocktail.ingredients).reduce((sum, amount) => sum + amount, 0);
  const estimatedTime = Math.ceil(totalVolume / 50); // ~50ml per second

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="max-w-md bg-card border border-card-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <Martini className="h-6 w-6 text-primary" />
            Confirm Your Order
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {getCocktailName(cocktail.id)}
                </h3>
              </div>
              
              <div className="bg-surface p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Ingredients:
                </h4>
                {Object.entries(cocktail.ingredients).map(([ingredient, amount]) => (
                  <div key={ingredient} className="flex justify-between text-sm">
                    <span>{getIngredientName(ingredient)}</span>
                    <span className="font-mono">{amount}ml</span>
                  </div>
                ))}
                
                {cocktail.post_add && (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center gap-2 text-warning text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Manual addition required:</span>
                    </div>
                    <div className="ml-6 font-medium">
                      {getIngredientName(cocktail.post_add)}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Est. {estimatedTime} seconds</span>
                </div>
                <span className="font-mono">Total: {totalVolume}ml</span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-gradient-primary hover:shadow-button">
            Start Preparing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}