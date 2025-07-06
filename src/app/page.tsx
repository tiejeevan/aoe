'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SettingsPanel } from '@/components/SettingsPanel';
import { cn } from '@/lib/utils';

export default function Home() {
  const [canvasColor, setCanvasColor] = useState('#FAFAFA');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen">
      <main
        ref={canvasRef}
        className="min-h-screen w-full transition-colors duration-500 ease-in-out"
        style={{ backgroundColor: canvasColor }}
        aria-label="White Canvas"
      />

      <div
        className={cn(
          'fixed bottom-8 right-8 z-50 transition-opacity duration-1000',
          isMounted ? 'opacity-100' : 'opacity-0'
        )}
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="rounded-full shadow-2xl h-16 w-16 hover:scale-110 transition-transform"
              aria-label="Open settings"
            >
              <Settings className="h-7 w-7" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:w-[540px] p-0">
            <SettingsPanel
              currentColor={canvasColor}
              setColor={setCanvasColor}
              canvasRef={canvasRef}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
