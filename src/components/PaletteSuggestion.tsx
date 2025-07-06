'use client';

import { useState } from 'react';
import { Paintbrush, LoaderCircle, Clipboard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { suggestPaletteAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PaletteSuggestionProps {
  currentColor: string;
}

interface PaletteOutput {
    palette: string[];
}

export function PaletteSuggestion({ currentColor }: PaletteSuggestionProps) {
  const [palette, setPalette] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSuggestPalette = async () => {
    setIsLoading(true);
    setError(null);
    setPalette(null);

    const result = await suggestPaletteAction({ whiteShade: currentColor });

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setPalette(result.data.palette);
    }

    setIsLoading(false);
  };

  const handleCopy = (color: string) => {
    navigator.clipboard.writeText(color);
    toast({
      title: 'Copied!',
      description: (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{backgroundColor: color}} />
          {color} copied to clipboard.
        </div>
      )
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Palette Suggestion</CardTitle>
        <CardDescription>
          Let AI suggest a complementary color palette based on your chosen shade of white.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleSuggestPalette} disabled={isLoading} className="w-full">
          {isLoading ? (
            <LoaderCircle className="mr-2 animate-spin" />
          ) : (
            <Paintbrush className="mr-2" />
          )}
          {isLoading ? 'Generating...' : 'Suggest Palette'}
        </Button>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {palette && (
          <div className="mt-6">
            <h4 className="font-medium text-sm mb-2">Suggested Palette:</h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {palette.map((color) => (
                <div key={color} className="flex flex-col items-center">
                  <div className="relative group w-full pt-[100%]">
                    <div
                      className="absolute inset-0 rounded-md border"
                      style={{ backgroundColor: color }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(color)}
                        className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
                        aria-label={`Copy color ${color}`}
                      >
                        <Clipboard className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-center font-mono text-muted-foreground">{color}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
