import { hardwareAPI } from './hardwareAPI';
import { CocktailRecipe } from '@/types/cocktail';
import cocktailsData from '@/data/cocktails.json';
import pumpMapping from '@/data/pump_mapping.json';

export interface ServingProgress {
  cocktailId: string;
  currentIngredient: string | null;
  targetAmount: number;
  currentAmount: number;
  isServing: boolean;
  isComplete: boolean;
  error: string | null;
}

export class CocktailService {
  private currentServing: ServingProgress | null = null;
  private progressCallback?: (progress: ServingProgress) => void;

  async startServing(cocktailId: string, onProgress?: (progress: ServingProgress) => void): Promise<void> {
    const cocktail = cocktailsData.find(c => c.id === cocktailId) as CocktailRecipe;
    if (!cocktail) {
      throw new Error('Cocktail not found');
    }

    this.progressCallback = onProgress;
    this.currentServing = {
      cocktailId,
      currentIngredient: null,
      targetAmount: 0,
      currentAmount: 0,
      isServing: true,
      isComplete: false,
      error: null
    };

    this.updateProgress();

    try {
      // Tare scale before starting
      await hardwareAPI.tareScale();

      // Serve each ingredient
      for (const [ingredient, amount] of Object.entries(cocktail.ingredients)) {
        const pumpNumber = pumpMapping[ingredient as keyof typeof pumpMapping];
        if (!pumpNumber) {
          throw new Error(`No pump configured for ingredient: ${ingredient}`);
        }

        this.currentServing.currentIngredient = ingredient;
        this.currentServing.targetAmount = amount;
        this.currentServing.currentAmount = 0;
        this.updateProgress();

        await this.serveIngredient(pumpNumber, amount);
      }

      this.currentServing.isComplete = true;
      this.currentServing.currentIngredient = null;
      this.updateProgress();

    } catch (error) {
      this.currentServing.error = error instanceof Error ? error.message : 'Unknown error';
      this.updateProgress();
      throw error;
    }
  }

  private async serveIngredient(pumpNumber: number, targetAmount: number): Promise<void> {
    return new Promise((resolve, reject) => {
      let currentWeight = 0;
      const startWeight = 0; // Already tared

      // Start pump
      hardwareAPI.activatePump(pumpNumber, targetAmount * 100) // Rough timing estimate
        .catch(reject);

      // Monitor weight
      const weightMonitor = setInterval(async () => {
        try {
          currentWeight = await hardwareAPI.getWeight();
          const actualAmount = Math.max(0, currentWeight - startWeight);

          if (this.currentServing) {
            this.currentServing.currentAmount = actualAmount;
            this.updateProgress();
          }

          // Check if target reached
          if (actualAmount >= targetAmount) {
            clearInterval(weightMonitor);
            resolve();
          }
        } catch (error) {
          clearInterval(weightMonitor);
          reject(error);
        }
      }, 200);

      // Safety timeout
      setTimeout(() => {
        clearInterval(weightMonitor);
        if (currentWeight < targetAmount) {
          reject(new Error(`Timeout: Only ${currentWeight}ml of ${targetAmount}ml served`));
        }
      }, targetAmount * 200); // 200ms per ml max
    });
  }

  private updateProgress(): void {
    if (this.currentServing && this.progressCallback) {
      this.progressCallback({ ...this.currentServing });
    }
  }

  stopServing(): void {
    this.currentServing = null;
  }

  getCurrentServing(): ServingProgress | null {
    return this.currentServing ? { ...this.currentServing } : null;
  }
}

export const cocktailService = new CocktailService();