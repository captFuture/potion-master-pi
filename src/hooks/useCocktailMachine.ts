import { useState, useEffect, useCallback } from 'react';
import { AppSettings, CocktailRecipe, ServingState, Language } from '@/types/cocktail';
import cocktailsData from '@/data/cocktails.json';
import cocktailNamesData from '@/data/cocktail_name_mapping.json';
import ingredientNamesData from '@/data/ingredient_mapping.json';
import ingredientCategoriesData from '@/data/ingredient_category.json';

// Mock hardware interfaces for demonstration
class MockI2CRelay {
  async activatePump(ingredientIndex: number): Promise<void> {
    console.log(`Activating pump ${ingredientIndex}`);
    // Simulate relay activation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async deactivatePump(ingredientIndex: number): Promise<void> {
    console.log(`Deactivating pump ${ingredientIndex}`);
    // Simulate relay deactivation
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

class MockI2CScale {
  private weight = 0;
  private targetWeight = 0;
  private isPouring = false;

  async getCurrentWeight(): Promise<number> {
    if (this.isPouring && this.weight < this.targetWeight) {
      // Simulate liquid being dispensed at ~50ml/second
      this.weight += Math.random() * 8 + 2;
      if (this.weight > this.targetWeight) {
        this.weight = this.targetWeight;
        this.isPouring = false;
      }
    }
    return Math.round(this.weight);
  }

  startPouring(targetAmount: number): void {
    this.targetWeight = targetAmount;
    this.isPouring = true;
  }

  reset(): void {
    this.weight = 0;
    this.targetWeight = 0;
    this.isPouring = false;
  }
}

const mockRelay = new MockI2CRelay();
const mockScale = new MockI2CScale();

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

  // Start serving a cocktail
  const startServing = useCallback(async (cocktailId: string) => {
    const cocktail = cocktailsData.find(c => c.id === cocktailId);
    if (!cocktail) {
      setServingState(prev => ({ ...prev, error: 'Cocktail not found' }));
      return;
    }

    mockScale.reset();
    
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

    // Serve each ingredient in sequence
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
        await mockRelay.activatePump(pumpIndex);
        mockScale.startPouring(amount);
        
        // Monitor scale until target is reached
        while (true) {
          const currentWeight = await mockScale.getCurrentWeight();
          setServingState(prev => ({
            ...prev,
            currentAmount: currentWeight
          }));
          
          if (currentWeight >= amount) {
            await mockRelay.deactivatePump(pumpIndex);
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        setServingState(prev => ({ 
          ...prev, 
          error: `Error serving ${ingredient}: ${error}` 
        }));
        await mockRelay.deactivatePump(pumpIndex);
        return;
      }
    }

    setServingState(prev => ({
      ...prev,
      isComplete: true,
      currentIngredient: null
    }));
  }, []);

  // Stop serving
  const stopServing = useCallback(() => {
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
    mockScale.reset();
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