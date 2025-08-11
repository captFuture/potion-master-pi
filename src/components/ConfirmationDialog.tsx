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
import { useI18n } from '@/hooks/useI18n';
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
  const { t } = useI18n();
  if (!cocktail) return null;

  const totalVolume = Object.values(cocktail.ingredients).reduce((sum, amount) => sum + amount, 0);
  const estimatedTime = Math.ceil(totalVolume / 50); // ~50ml per second

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="max-w-md bg-card border border-card-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <Martini className="h-6 w-6 text-primary" />
            {t('confirm_title')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {getCocktailName(cocktail.id)}
                </h3>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-md border border-warning/30 text-warning">
                <AlertTriangle className="h-4 w-4" />
                <span>{t('glass_instruction')}</span>
              </div>
              <div className="bg-surface p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {t('ingredients_label')}
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
                      <span>{t('manual_add_label')}</span>
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
                  <span>{t('estimated_time', { seconds: estimatedTime })}</span>
                </div>
                <span className="font-mono">{t('total_volume', { total: totalVolume })}</span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-gradient-primary hover:shadow-button">
            {t('start_preparing')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}