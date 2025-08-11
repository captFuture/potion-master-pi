import { ServingState } from '@/types/cocktail';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Coffee, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';

interface ServingProgressProps {
  servingState: ServingState;
  getCocktailName: (cocktailId: string) => string;
  getIngredientName: (ingredientId: string) => string;
  onStop: () => void;
  onComplete: () => void;
}

export function ServingProgress({ 
  servingState, 
  getCocktailName, 
  getIngredientName,
  onStop,
  onComplete
}: ServingProgressProps) {
  const { t } = useI18n();
  const [showPostAdd, setShowPostAdd] = useState(false);

  useEffect(() => {
    if (servingState.isComplete && servingState.postAddIngredient) {
      setShowPostAdd(true);
    }
  }, [servingState.isComplete, servingState.postAddIngredient]);

  const progress = servingState.targetAmount > 0 
    ? (servingState.currentAmount / servingState.targetAmount) * 100 
    : 0;

  if (servingState.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertCircle className="mx-auto h-16 w-16 text-error" />
          <h2 className="text-2xl font-bold text-error">{t('serving_error_title')}</h2>
          <p className="text-muted-foreground">{servingState.error}</p>
          <Button onClick={onStop} variant="outline" size="lg">
            {t('back_to_menu')}
          </Button>
        </div>
      </div>
    );
  }

  if (showPostAdd && servingState.postAddIngredient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <Coffee className="mx-auto h-16 w-16 text-warning animate-bounce" />
          <h2 className="text-2xl font-bold">{t('almost_ready_title')}</h2>
          <div className="bg-card p-6 rounded-lg border border-card-border">
            <p className="text-lg mb-4">{t('please_add_manually')}</p>
            <p className="text-2xl font-bold text-primary">
              {getIngredientName(servingState.postAddIngredient)}
            </p>
          </div>
          <Button onClick={onComplete} variant="success" size="lg" className="w-full">
            <CheckCircle2 className="mr-2 h-5 w-5" />
            {t('complete_return')}
          </Button>
        </div>
      </div>
    );
  }

  if (servingState.isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle2 className="mx-auto h-16 w-16 text-success animate-pulse" />
          <h2 className="text-2xl font-bold text-success">{t('ready_to_serve_title')}</h2>
          <p className="text-xl">
            {servingState.cocktailId && getCocktailName(servingState.cocktailId)}
          </p>
          <Button onClick={onComplete} variant="success" size="lg" className="w-full">
            {t('back_to_menu')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('preparing_title')}</h2>
          <p className="text-xl text-primary">
            {servingState.cocktailId && getCocktailName(servingState.cocktailId)}
          </p>
        </div>

        {servingState.currentIngredient && (
          <div className="bg-card p-6 rounded-lg border border-card-border space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('currently_serving')}</h3>
              <p className="text-xl text-primary font-bold">
                {getIngredientName(servingState.currentIngredient)}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('progress_label')}</span>
                <span>{servingState.currentAmount}ml / {servingState.targetAmount}ml</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </div>
        )}

        <div className="text-center">
          <Button 
            onClick={onStop} 
            variant="destructive" 
            size="lg"
            className="w-full"
          >
            <X className="mr-2 h-5 w-5" />
            {t('stop_cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}