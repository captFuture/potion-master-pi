import { useState } from 'react';
import { AppSettings, Language, IngredientCategories } from '@/types/cocktail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Globe, Beaker, Wine, Coffee, Settings2, Grid3X3, AlertTriangle } from 'lucide-react';
import { PumpMappingGrid } from '@/components/PumpMappingGrid';

interface SettingsScreenProps {
  settings: AppSettings;
  ingredientCategories: IngredientCategories;
  getIngredientName: (ingredientId: string) => string;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onBack: () => void;
}

const languageOptions: { value: Language; label: string; flag: string }[] = [
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'hogwarts', label: 'Hogwarts', flag: '🪄' },
];

export function SettingsScreen({ 
  settings, 
  ingredientCategories,
  getIngredientName,
  onUpdateSettings, 
  onBack 
}: SettingsScreenProps) {
  const [showPumpMapping, setShowPumpMapping] = useState(false);

  const handleLanguageChange = (language: Language) => {
    onUpdateSettings({ language });
  };

  const handleIngredientToggle = (ingredient: string, enabled: boolean, category: string) => {
    const categoryIngredients = ingredientCategories[category as keyof IngredientCategories];
    const currentEnabledCount = categoryIngredients.filter(ing => settings.enabledIngredients[ing]).length;
    
    // If trying to enable and already at limit of 4, prevent it
    if (enabled && currentEnabledCount >= 4) {
      return;
    }
    
    onUpdateSettings({
      enabledIngredients: {
        ...settings.enabledIngredients,
        [ingredient]: enabled
      }
    });
  };

  const renderIngredientCategory = (
    title: string, 
    ingredients: string[], 
    icon: React.ReactNode,
    categoryKey: string
  ) => {
    const enabledCount = ingredients.filter(ing => settings.enabledIngredients[ing]).length;
    const isAtLimit = enabledCount >= 4;
    
    return (
    <Card className="bg-card border border-card-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isAtLimit ? "destructive" : "secondary"}>
              {enabledCount}/4
            </Badge>
            {isAtLimit && <AlertTriangle className="h-4 w-4 text-warning" />}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ingredients.map((ingredient) => (
          <div key={ingredient} className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {getIngredientName(ingredient)}
            </span>
            <Switch
              checked={settings.enabledIngredients[ingredient] || false}
              onCheckedChange={(checked) => handleIngredientToggle(ingredient, checked, categoryKey)}
              disabled={!settings.enabledIngredients[ingredient] && isAtLimit}
            />
          </div>
        ))}
      </CardContent>
    </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={onBack} variant="outline" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        {/* Machine Configuration */}
        <Card className="bg-card border border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Machine Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="machineName">Machine Name</Label>
                <Input
                  id="machineName"
                  value={settings.machineName}
                  onChange={(e) => onUpdateSettings({ machineName: e.target.value })}
                  placeholder="Enter machine name"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subLine">Sub-line</Label>
                <Input
                  id="subLine"
                  value={settings.subLine}
                  onChange={(e) => onUpdateSettings({ subLine: e.target.value })}
                  placeholder="Enter sub-line"
                  className="bg-input border-border"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Selection */}
        <Card className="bg-card border border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language / Sprache / Zaubersprache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {languageOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={settings.language === option.value ? "default" : "outline"}
                  onClick={() => handleLanguageChange(option.value)}
                  className="h-16 text-lg"
                >
                  <span className="text-2xl mr-2">{option.flag}</span>
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Pump Configuration */}
        <Card className="bg-card border border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-primary" />
              Pump Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure which ingredients are connected to each physical pump position in the machine.
            </p>
            <Button
              onClick={() => setShowPumpMapping(true)}
              variant="outline"
              className="w-full"
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Configure Pump Layout
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Ingredient Configuration */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Available Ingredients</h2>
            <div className="text-sm text-muted-foreground">
              Maximum 4 ingredients per category
            </div>
          </div>
          
          <div className="grid gap-6">
            {renderIngredientCategory(
              "Alcoholic Beverages",
              ingredientCategories.alcoholic_ingredients,
              <Wine className="h-5 w-5 text-primary" />,
              "alcoholic_ingredients"
            )}
            
            {renderIngredientCategory(
              "Non-Alcoholic Ingredients",
              ingredientCategories.non_alcoholic_ingredients,
              <Beaker className="h-5 w-5 text-secondary" />,
              "non_alcoholic_ingredients"
            )}
            
            {renderIngredientCategory(
              "External Additions",
              ingredientCategories.external_ingredients,
              <Coffee className="h-5 w-5 text-warning" />,
              "external_ingredients"
            )}
          </div>
        </div>

        <div className="text-center pt-8">
          <Button onClick={onBack} size="lg" className="w-full md:w-auto">
            Save & Return to Menu
          </Button>
        </div>
      </div>

      <PumpMappingGrid
        isOpen={showPumpMapping}
        onClose={() => setShowPumpMapping(false)}
        settings={settings}
        ingredientCategories={ingredientCategories}
        getIngredientName={getIngredientName}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  );
}