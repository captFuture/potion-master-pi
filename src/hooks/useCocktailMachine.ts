import { useState, useCallback } from 'react';
import { AppSettings, CocktailRecipe, ServingState, Language } from '@/types/cocktail';
import cocktailsData from '@/data/cocktails.json';
import cocktailNamesData from '@/data/cocktail_name_mapping.json';
import ingredientNamesData from '@/data/ingredient_mapping.json';
import ingredientCategoriesData from '@/data/ingredient_category.json';

import { hardwareAPI } from '@/services/hardwareAPI';

// Default pump mapping (can be overridden by settings)
const defaultPumpMapping: Record<string, number> = {
  'vodka': 1,
  'white_rum': 2,
  'white_wine': 3,
  'orange_liqueur': 4,
  'lemon_juice': 5,
  'elderflower_syrup': 6,
  'passion_fruit_juice': 7,
  'soda': 8
};

const SETTINGS_STORAGE_KEY = 'cocktail-machine-settings';

// Load settings from localStorage or use defaults
const loadStoredSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsedSettings = JSON.parse(stored);
      // Merge with defaults to ensure all required fields exist
      return {
        language: 'en',
        machineName: 'Cocktail Machine',
        subLine: 'Professional Mixology System',
        enabledIngredients: {
          'vodka': true,
          'white_rum': true,
          'white_wine': true,
          'orange_liqueur': true,
          'lemon_juice': true,
          'elderflower_syrup': true,
          'passion_fruit_juice': true,
          'soda': true,
          'gin': false,
          'aperol': false,
          'prosecco': false,
          'orange_juice': false,
          'tonic_water': false,
          'coca_cola': false
        },
        pumpMapping: defaultPumpMapping,
        screensaverTimeout: 60,
        ...parsedSettings
      };
    }
  } catch (error) {
    console.warn('Failed to load stored settings:', error);
  }
  
  // Return defaults if no stored settings or error
  return {
    language: 'en',
    machineName: 'Cocktail Machine',
    subLine: 'Professional Mixology System',
    enabledIngredients: {
      'vodka': true,
      'white_rum': true,
      'white_wine': true,
      'orange_liqueur': true,
      'lemon_juice': true,
      'elderflower_syrup': true,
      'passion_fruit_juice': true,
      'soda': true,
      'gin': false,
      'aperol': false,
      'prosecco': false,
      'orange_juice': false,
      'tonic_water': false,
      'coca_cola': false
    },
    pumpMapping: defaultPumpMapping,
    screensaverTimeout: 60
  };
};

export function useCocktailMachine() {
  const [settings, setSettings] = useState<AppSettings>(loadStoredSettings);

  const [servingState, setServingState] = useState<ServingState>({
    cocktailId: null,
    currentIngredient: null,
    targetAmount: 0,
    currentAmount: 0,
    isServing: false,
    isComplete: false,
    error: null,
    postAddIngredient: null
  });

  // Get available cocktails based on enabled ingredients
  const getAvailableCocktails = useCallback((): CocktailRecipe[] => {
    return cocktailsData.filter(cocktail => {
      return Object.keys(cocktail.ingredients).every(ingredient => 
        settings.enabledIngredients[ingredient] === true
      );
    });
  }, [settings.enabledIngredients]);

  // Get translated name for cocktail
  const getCocktailName = useCallback((cocktailId: string): string => {
    const mapping = cocktailNamesData[cocktailId as keyof typeof cocktailNamesData];
    return mapping ? mapping[settings.language] : cocktailId;
  }, [settings.language]);

  // Get translated name for ingredient
  const getIngredientName = useCallback((ingredientId: string): string => {
    const mapping = ingredientNamesData[ingredientId as keyof typeof ingredientNamesData];
    return mapping ? mapping[settings.language] : ingredientId;
  }, [settings.language]);

  // Start serving a cocktail using real hardware
  const startServing = useCallback(async (cocktailId: string) => {
    const cocktail = cocktailsData.find(c => c.id === cocktailId);
    if (!cocktail) {
      setServingState(prev => ({ ...prev, error: 'Cocktail not found' }));
      return;
    }

    // Reset UI state
    setServingState({
      cocktailId,
      currentIngredient: null,
      targetAmount: 0,
      currentAmount: 0,
      isServing: true,
      isComplete: false,
      error: null,
      postAddIngredient: cocktail.post_add || null
    });

    // 1) Tare the scale before starting
    try {
      await hardwareAPI.tareScale();
    } catch (e) {
      setServingState(prev => ({ ...prev, error: 'Tare failed' }));
      return;
    }

    let pouredSoFar = 0; // cumulative target

    // 2) Serve each ingredient in sequence
    const ingredients = Object.entries(cocktail.ingredients);
    for (const [ingredient, amount] of ingredients) {
      const pumpMapping = settings.pumpMapping || defaultPumpMapping;
      const pumpIndex = pumpMapping[ingredient];
      if (pumpIndex === undefined) {
        setServingState(prev => ({ 
          ...prev, 
          error: `No pump configured for ingredient: ${ingredient}` 
        }));
        return;
      }

      setServingState(prev => ({
        ...prev,
        currentIngredient: ingredient,
        targetAmount: amount,
        currentAmount: 0
      }));

      try {
        // 3) Start pump (long duration, we will stop explicitly)
        await hardwareAPI.startPump(pumpIndex);

        // 4) Monitor scale until target reached for this ingredient
        // Target is cumulative: pouredSoFar + amount
        const targetCumulative = pouredSoFar + amount;
        while (true) {
          const weight = await hardwareAPI.getWeight();
          const currentForIngredient = Math.max(0, Math.round(weight - pouredSoFar));
          setServingState(prev => ({ ...prev, currentAmount: currentForIngredient }));

          if (weight >= targetCumulative) {
            break;
          }

          await new Promise(res => setTimeout(res, 150));
        }
      } catch (error) {
        setServingState(prev => ({ 
          ...prev, 
          error: `Error serving ${ingredient}: ${error}` 
        }));
        try { await hardwareAPI.stopPump(pumpIndex); } catch {}
        return;
      } finally {
        // 5) Stop pump
        try { await hardwareAPI.stopPump(pumpIndex); } catch {}
      }

      pouredSoFar += amount;
      // Small settle delay
      await new Promise(res => setTimeout(res, 200));
    }

    // 6) Mark as complete
    setServingState(prev => ({
      ...prev,
      isComplete: true,
      currentIngredient: null
    }));
  }, [settings.pumpMapping]);

  // Stop serving: stop any active pump and reset state
  const stopServing = useCallback(async () => {
    try {
      // Best-effort: stop all pumps 1..8 to ensure safety
      const stopAll = Array.from({ length: 8 }, (_, i) => i + 1).map(p => hardwareAPI.stopPump(p));
      await Promise.allSettled(stopAll);
    } finally {
      setServingState({
        cocktailId: null,
        currentIngredient: null,
        targetAmount: 0,
        currentAmount: 0,
        isServing: false,
        isComplete: false,
        error: null,
        postAddIngredient: null
      });
    }
  }, []);

  // Update settings with persistence
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, ...newSettings };
      
      // Save to localStorage
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
      } catch (error) {
        console.warn('Failed to save settings to localStorage:', error);
      }
      
      return updatedSettings;
    });
  }, []);

  return {
    settings,
    servingState,
    availableCocktails: getAvailableCocktails(),
    ingredientCategories: ingredientCategoriesData,
    getCocktailName,
    getIngredientName,
    startServing,
    stopServing,
    updateSettings
  };
}