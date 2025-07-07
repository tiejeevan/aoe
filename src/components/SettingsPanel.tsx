'use client';

import type { RefObject } from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { PaletteSuggestion } from './PaletteSuggestion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface SettingsPanelProps {
  currentColor: string;
  setColor: (color: string) => void;
  canvasRef: RefObject<HTMLDivElement>;
}

const whiteShades = [
  { name: 'Pure White', value: '#FFFFFF' },
  { name: 'Primary Off-white', value: '#FAFAFA' },
  { name: 'Background Off-white', value: '#F0F0F0' },
  { name: 'Ghost White', value: '#F8F8FF' },
  { name: 'Alice Blue', value: '#F0F8FF' },
  { name: 'Honeydew', value: '#F0FFF0' },
];

export function SettingsPanel({ currentColor, setColor, canvasRef }: SettingsPanelProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    const element = canvasRef.current;
    if (!element) {
      toast({
        title: 'Error',
        description: 'Canvas element not found.',
        variant: 'destructive',
      });
      return;
    }

    const { width, height } = element.getBoundingClientRect();
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width * window.devicePixelRatio;
    offscreenCanvas.height = height * window.devicePixelRatio;
    const ctx = offscreenCanvas.getContext('2d');

    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.fillStyle = currentColor;
      ctx.fillRect(0, 0, width, height);

      const dataUrl = offscreenCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'white-canvas.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success!',
        description: 'Your canvas has started downloading.',
      });
    } else {
       toast({
        title: 'Error',
        description: 'Could not create canvas for download.',
        variant: 'destructive',
      });
    }
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Canvas Controls</CardTitle>
            <CardDescription>Adjust the look and feel of your canvas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Shade of White</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {whiteShades.map((shade) => (
                  <button
                    key={shade.value}
                    onClick={() => setColor(shade.value)}
                    className={cn(
                      'p-2 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      currentColor.toUpperCase() === shade.value.toUpperCase()
                        ? 'border-primary-foreground'
                        : 'border-transparent hover:border-muted-foreground/50'
                    )}
                    aria-label={`Set canvas to ${shade.name}`}
                  >
                    <div
                      className="w-full h-12 rounded-md"
                      style={{ backgroundColor: shade.value }}
                    />
                    <p className="text-xs text-center mt-1 text-muted-foreground">{shade.name}</p>
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-2">Export</h3>
              <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2" />
                Download as PNG
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <PaletteSuggestion currentColor={currentColor} />
      </div>
    </ScrollArea>
  );
}
