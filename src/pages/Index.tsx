import { useState } from 'react';
import { useCocktailMachine } from '@/hooks/useCocktailMachine';
import { useTheme } from '@/hooks/useTheme';
import { CocktailGrid } from '@/components/CocktailGrid';
import { SettingsScreen } from '@/components/SettingsScreen';
import { ServingProgress } from '@/components/ServingProgress';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { CocktailRecipe } from '@/types/cocktail';
import { Settings, Martini, Sparkles, Wand2 } from 'lucide-react';

type AppScreen = 'menu' | 'settings' | 'serving';

const Index = () => {
  const {
    settings,
    servingState,
    availableCocktails,
    ingredientCategories,
    getCocktailName,
    getIngredientName,
    startServing,
    stopServing,
    updateSettings
  } = useCocktailMachine();
  
  // Apply theme based on selected language
  useTheme(settings.language);

  const [currentScreen, setCurrentScreen] = useState<AppScreen>('menu');
  const [selectedCocktail, setSelectedCocktail] = useState<CocktailRecipe | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleCocktailSelect = (cocktailId: string) => {
    const cocktail = availableCocktails.find(c => c.id === cocktailId);
    if (cocktail) {
      setSelectedCocktail(cocktail);
      setShowConfirmation(true);
    }
  };

  const handleConfirmServing = async () => {
    if (selectedCocktail) {
      setShowConfirmation(false);
      setCurrentScreen('serving');
      await startServing(selectedCocktail.id);
    }
  };

  const handleCancelServing = () => {
    setShowConfirmation(false);
    setSelectedCocktail(null);
  };

  const handleStopServing = () => {
    stopServing();
    setCurrentScreen('menu');
    setSelectedCocktail(null);
  };

  const handleCompleteServing = () => {
    stopServing();
    setCurrentScreen('menu');
    setSelectedCocktail(null);
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const handleCloseSettings = () => {
    setCurrentScreen('menu');
  };

  if (currentScreen === 'serving') {
    return (
      <ServingProgress
        servingState={servingState}
        getCocktailName={getCocktailName}
        getIngredientName={getIngredientName}
        onStop={handleStopServing}
        onComplete={handleCompleteServing}
      />
    );
  }

  if (currentScreen === 'settings') {
    return (
      <SettingsScreen
        settings={settings}
        ingredientCategories={ingredientCategories}
        getIngredientName={getIngredientName}
        onUpdateSettings={updateSettings}
        onBack={handleCloseSettings}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-surface border-b border-card-border p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-gradient-primary rounded-lg ${settings.language === 'hogwarts' ? 'magical-sparkle' : ''}`}>
              {settings.language === 'hogwarts' ? (
                <Wand2 className="h-8 w-8 text-primary-foreground animate-float" />
              ) : (
                <Martini className="h-8 w-8 text-primary-foreground" />
              )}
            </div>
            <div>
              <h1 className={`text-2xl font-bold text-foreground ${settings.language === 'hogwarts' ? 'text-magical' : ''}`}>
                {settings.machineName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {settings.subLine}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleOpenSettings}
            variant="outline" 
            size="lg"
            className="gap-2"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">

        <CocktailGrid
          cocktails={availableCocktails}
          getCocktailName={getCocktailName}
          getIngredientName={getIngredientName}
          language={settings.language}
          onSelectCocktail={handleCocktailSelect}
        />
      </main>

      <ConfirmationDialog
        isOpen={showConfirmation}
        cocktail={selectedCocktail}
        getCocktailName={getCocktailName}
        getIngredientName={getIngredientName}
        onConfirm={handleConfirmServing}
        onCancel={handleCancelServing}
      />
    </div>
  );
};

export default Index;
