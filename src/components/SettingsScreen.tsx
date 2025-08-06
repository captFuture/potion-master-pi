import { AppSettings, Language, IngredientCategories } from '@/types/cocktail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Globe, Beaker, Wine, Coffee, Settings2 } from 'lucide-react';

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
  const handleLanguageChange = (language: Language) => {
    onUpdateSettings({ language });
  };

  const handleIngredientToggle = (ingredient: string, enabled: boolean) => {
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
    icon: React.ReactNode
  ) => (
    <Card className="bg-card border border-card-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
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
              onCheckedChange={(checked) => handleIngredientToggle(ingredient, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );

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

        {/* Ingredient Configuration */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Available Ingredients</h2>
          
          <div className="grid gap-6">
            {renderIngredientCategory(
              "Alcoholic Beverages",
              ingredientCategories.alcoholic_ingredients,
              <Wine className="h-5 w-5 text-primary" />
            )}
            
            {renderIngredientCategory(
              "Non-Alcoholic Ingredients",
              ingredientCategories.non_alcoholic_ingredients,
              <Beaker className="h-5 w-5 text-secondary" />
            )}
            
            {renderIngredientCategory(
              "External Additions",
              ingredientCategories.external_ingredients,
              <Coffee className="h-5 w-5 text-warning" />
            )}
          </div>
        </div>

        <div className="text-center pt-8">
          <Button onClick={onBack} size="lg" className="w-full md:w-auto">
            Save & Return to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}