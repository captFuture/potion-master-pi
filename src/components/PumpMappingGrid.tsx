import { useState } from 'react';
import { AppSettings, IngredientCategories } from '@/types/cocktail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Droplets, Grid3X3, ArrowLeft } from 'lucide-react';

interface PumpMappingGridProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  ingredientCategories: IngredientCategories;
  getIngredientName: (ingredientId: string) => string;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export function PumpMappingGrid({ 
  isOpen, 
  onClose, 
  settings, 
  ingredientCategories,
  getIngredientName,
  onUpdateSettings 
}: PumpMappingGridProps) {
  const [pumpMapping, setPumpMapping] = useState<Record<number, string>>(() => {
    const mapping: Record<number, string> = {};
    const currentMapping = settings.pumpMapping || {};
    Object.entries(currentMapping).forEach(([ingredient, pumpIndex]) => {
      if (typeof pumpIndex === 'number') {
        mapping[pumpIndex] = ingredient;
      }
    });
    return mapping;
  });

  const allIngredients = [
    ...ingredientCategories.alcoholic_ingredients,
    ...ingredientCategories.non_alcoholic_ingredients
  ];

  const enabledIngredients = allIngredients.filter(ingredient => 
    settings.enabledIngredients[ingredient]
  );

  const availableIngredients = allIngredients.filter(ingredient => 
    !Object.values(pumpMapping).includes(ingredient)
  );

  const handlePumpChange = (pumpIndex: number, ingredient: string | null) => {
    const newMapping = { ...pumpMapping };
    
    if (ingredient === null || ingredient === '') {
      delete newMapping[pumpIndex];
    } else {
      // Remove ingredient from other pumps if already assigned
      Object.keys(newMapping).forEach(key => {
        if (newMapping[parseInt(key)] === ingredient) {
          delete newMapping[parseInt(key)];
        }
      });
      newMapping[pumpIndex] = ingredient;
    }
    
    setPumpMapping(newMapping);
  };

  const handleSave = () => {
    const ingredientToPump: Record<string, number> = {};
    Object.entries(pumpMapping).forEach(([pumpIndex, ingredient]) => {
      ingredientToPump[ingredient] = parseInt(pumpIndex);
    });
    
    onUpdateSettings({ pumpMapping: ingredientToPump });
    onClose();
  };

  const getIngredientCategory = (ingredient: string) => {
    if (ingredientCategories.alcoholic_ingredients.includes(ingredient)) return 'alcoholic';
    if (ingredientCategories.non_alcoholic_ingredients.includes(ingredient)) return 'non-alcoholic';
    return 'external';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'alcoholic': return 'bg-primary/20 text-primary border-primary/30';
      case 'non-alcoholic': return 'bg-secondary/20 text-secondary border-secondary/30';
      default: return 'bg-warning/20 text-warning border-warning/30';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-card border-card-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Grid3X3 className="h-6 w-6 text-primary" />
            Pump Mapping Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Configure which ingredients are connected to each pump position. The machine has 8 pumps arranged in a 4×2 grid.
          </div>

          {/* Physical Layout Grid */}
          <Card className="bg-surface border-card-border">
            <CardHeader>
              <CardTitle className="text-lg">Physical Pump Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {/* Top row - Pumps 1-4 */}
                {[1, 2, 3, 4].map(pumpIndex => (
                  <div key={pumpIndex} className="space-y-2">
                    <div className="text-sm font-medium text-center">Pump {pumpIndex}</div>
                    <Select
                      value={pumpMapping[pumpIndex] || ''}
                      onValueChange={(value) => handlePumpChange(pumpIndex, value === '' ? null : value)}
                    >
                      <SelectTrigger className="h-20 bg-input border-border">
                        <SelectValue placeholder="Empty">
                          {pumpMapping[pumpIndex] && (
                            <div className="flex flex-col items-center gap-1">
                              <Droplets className="h-4 w-4" />
                              <span className="text-xs text-center">
                                {getIngredientName(pumpMapping[pumpIndex])}
                              </span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        <SelectItem value="">Empty</SelectItem>
                        {availableIngredients.concat(pumpMapping[pumpIndex] ? [pumpMapping[pumpIndex]] : [])
                          .filter(ingredient => enabledIngredients.includes(ingredient))
                          .map(ingredient => (
                            <SelectItem key={ingredient} value={ingredient}>
                              <div className="flex items-center gap-2">
                                <Badge className={getCategoryColor(getIngredientCategory(ingredient))}>
                                  {getIngredientCategory(ingredient) === 'alcoholic' ? 'A' : 'N'}
                                </Badge>
                                {getIngredientName(ingredient)}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-4 gap-4">
                {/* Bottom row - Pumps 5-8 */}
                {[5, 6, 7, 8].map(pumpIndex => (
                  <div key={pumpIndex} className="space-y-2">
                    <div className="text-sm font-medium text-center">Pump {pumpIndex}</div>
                    <Select
                      value={pumpMapping[pumpIndex] || ''}
                      onValueChange={(value) => handlePumpChange(pumpIndex, value === '' ? null : value)}
                    >
                      <SelectTrigger className="h-20 bg-input border-border">
                        <SelectValue placeholder="Empty">
                          {pumpMapping[pumpIndex] && (
                            <div className="flex flex-col items-center gap-1">
                              <Droplets className="h-4 w-4" />
                              <span className="text-xs text-center">
                                {getIngredientName(pumpMapping[pumpIndex])}
                              </span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        <SelectItem value="">Empty</SelectItem>
                        {availableIngredients.concat(pumpMapping[pumpIndex] ? [pumpMapping[pumpIndex]] : [])
                          .filter(ingredient => enabledIngredients.includes(ingredient))
                          .map(ingredient => (
                            <SelectItem key={ingredient} value={ingredient}>
                              <div className="flex items-center gap-2">
                                <Badge className={getCategoryColor(getIngredientCategory(ingredient))}>
                                  {getIngredientCategory(ingredient) === 'alcoholic' ? 'A' : 'N'}
                                </Badge>
                                {getIngredientName(ingredient)}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30">A</Badge>
              <span>Alcoholic</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-secondary/20 text-secondary border-secondary/30">N</Badge>
              <span>Non-Alcoholic</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button onClick={onClose} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              Save Pump Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}