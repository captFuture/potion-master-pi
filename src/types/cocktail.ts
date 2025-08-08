export interface CocktailRecipe {
  id: string;
  ingredients: Record<string, number>;
  post_add?: string;
}

export interface CocktailNameMapping {
  [cocktailId: string]: {
    de: string;
    en: string;
    hogwarts: string;
  };
}

export interface IngredientMapping {
  [ingredientId: string]: {
    de: string;
    en: string;
    hogwarts: string;
  };
}

export interface IngredientCategories {
  alcoholic_ingredients: string[];
  non_alcoholic_ingredients: string[];
  external_ingredients: string[];
}

export type Language = 'de' | 'en' | 'hogwarts';

export interface AppSettings {
  language: Language;
  enabledIngredients: Record<string, boolean>;
  machineName: string;
  subLine: string;
  pumpMapping?: Record<string, number>;
}

export interface ServingState {
  cocktailId: string | null;
  currentIngredient: string | null;
  targetAmount: number;
  currentAmount: number;
  isServing: boolean;
  isComplete: boolean;
  error: string | null;
  postAddIngredient: string | null;
}