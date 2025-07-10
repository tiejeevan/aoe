
'use client';

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import { Stage, Layer } from 'react-konva';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as Babel from '@babel/standalone';

const HumanWithHair = `
import React from 'react';
import { Stage, Layer, Circle, Rect, Line, Group } from 'react-konva';

const HumanWithHair = () => {
  return (
    <Stage width={400} height={400}>
      <Layer>
        {/* Body */}
        <Line
          points={[200, 150, 200, 250]} // torso
          stroke="black"
          strokeWidth={4}
        />

        {/* Arms */}
        <Line
          points={[150, 180, 200, 170, 250, 180]} // arms outstretched
          stroke="black"
          strokeWidth={4}
        />

        {/* Legs */}
        <Line
          points={[200, 250, 170, 320]} // left leg
          stroke="black"
          strokeWidth={4}
        />
        <Line
          points={[200, 250, 230, 320]} // right leg
          stroke="black"
          strokeWidth={4}
        />

        {/* Head */}
        <Circle
          x={200}
          y={120}
          radius={30}
          fill="#ffcc99"
          stroke="black"
          strokeWidth={2}
        />

        {/* Hair */}
        <Group>
          <Line
            points={[170, 100, 230, 100, 220, 110, 180, 110]}
            fill="brown"
            closed
          />
          <Line
            points={[175, 95, 225, 95, 220, 100, 180, 100]}
            fill="darkbrown"
            closed
          />
        </Group>
      </Layer>
    </Stage>
  );
};

export default HumanWithHair;
`;

const AdminTestMapPage = () => {
    const [jsxCode, setJsxCode] = useState(HumanWithHair.trim());
    const [component, setComponent] = useState<React.ComponentType | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const transformedCode = Babel.transform(jsxCode, {
                presets: ['react'],
                plugins: ['transform-modules-commonjs']
            }).code;

            if (!transformedCode) {
                setError("Babel transformation resulted in empty code.");
                return;
            }

            const exports: { default?: React.ComponentType } = {};
            const require = (name: string) => {
                if (name === 'react') return React;
                if (name === 'react-konva') return require('react-konva');
                throw new Error(`Cannot find module '${name}'`);
            };

            // eslint-disable-next-line no-new-func
            const func = new Function('exports', 'require', transformedCode);
            func(exports, require);
            
            if (exports.default && typeof exports.default === 'function') {
                setComponent(() => exports.default!);
                setError(null);
            } else {
                setError("The code does not have a default export of a component.");
            }

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred during compilation.");
            }
            setComponent(null);
        }
    }, [jsxCode]);
    

    const stageSize = 400;

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light p-4 sm:p-8">
            <div className="w-full max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-serif text-parchment-light">Building Designer</h1>
                    <Link href="/test-map" className="sci-fi-button">Back to Test Map</Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Panel: Inputs */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <Label htmlFor="jsx-code" className="text-lg font-serif text-brand-gold">Paste Component JSX</Label>
                            <Textarea 
                                id="jsx-code" 
                                value={jsxCode} 
                                onChange={(e) => setJsxCode(e.target.value)}
                                className="sci-fi-input mt-1 font-mono !text-xs h-[60vh]"
                            />
                        </div>
                    </div>
                    
                    {/* Right Panel: Preview and Actions */}
                    <div className="flex flex-col gap-4">
                         <div>
                            <Label className="text-lg font-serif text-brand-gold">Live Preview</Label>
                            <div className="w-full aspect-square bg-black/30 rounded-lg border-2 border-stone-light mt-1 flex items-center justify-center">
                               {error ? (
                                    <div className="p-4 text-brand-red">
                                        <h3 className="font-bold">Compilation Error:</h3>
                                        <pre className="text-xs whitespace-pre-wrap">{error}</pre>
                                    </div>
                                ) : (
                                    component && React.createElement(component)
                                )}
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTestMapPage;
