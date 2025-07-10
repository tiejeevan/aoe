
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Dynamically import the renderer to avoid SSR issues with Konva
const KonvaRenderer = React.lazy(() => import('../../../components/test/KonvaRenderer'));

const defaultScene = {
  attrs: {},
  className: "Stage",
  children: [
    {
      attrs: {},
      className: "Layer",
      children: [
        {
          attrs: {
            x: 150,
            y: 100,
            width: 100,
            height: 100,
            fill: "#d79921",
            stroke: "black",
            strokeWidth: 4,
            shadowBlur: 10
          },
          className: "Rect",
        },
        {
          attrs: {
            x: 150,
            y: 100,
            text: "Hello",
            fontSize: 30,
            fontFamily: "Calibri",
            fill: "black"
          },
          className: "Text"
        }
      ]
    }
  ]
};

const AdminTestMapPage = () => {
    const [isClient, setIsClient] = useState(false);
    const [jsonInput, setJsonInput] = useState(JSON.stringify(defaultScene, null, 2));
    const [scene, setScene] = useState<Konva.NodeConfig | null>(defaultScene);
    const [buildingName, setBuildingName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [log, setLog] = useState<string[]>([]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newJson = e.target.value;
        setJsonInput(newJson);
        try {
            const parsed = JSON.parse(newJson);
            setScene(parsed);
            setError(null);
        } catch (err) {
            setError("Invalid JSON format.");
            setScene(null);
        }
    };

    const handleSaveBuilding = () => {
        if (!buildingName.trim()) {
            setError("Building name cannot be empty.");
            return;
        }
        if (!scene) {
            setError("Cannot save, JSON is invalid.");
            return;
        }

        // In a real app, this would save to a database or state management solution.
        // For now, we'll just log it to demonstrate the concept.
        console.log("Saving building:", {
            name: buildingName,
            konvaJson: jsonInput,
        });

        const newLogMessage = `Saved building "${buildingName}" successfully. (Check console for data)`;
        setLog(prev => [newLogMessage, ...prev.slice(0, 9)]);
        setError(null);
    };

    const stageSize = 300;

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light p-4 sm:p-8">
            <div className="w-full max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-serif text-parchment-light">Test Map Admin</h1>
                    <Link href="/test-map" className="sci-fi-button">Back to Test Map</Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Panel: Inputs */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <Label htmlFor="building-name" className="text-lg font-serif text-brand-gold">Building Name</Label>
                            <Input 
                                id="building-name" 
                                type="text" 
                                value={buildingName} 
                                onChange={(e) => setBuildingName(e.target.value)} 
                                placeholder="e.g., Grand Library" 
                                className="sci-fi-input mt-1"
                            />
                        </div>
                         <div>
                            <Label htmlFor="konva-json" className="text-lg font-serif text-brand-gold">Konva JSON Definition</Label>
                            <Textarea 
                                id="konva-json" 
                                value={jsonInput} 
                                onChange={handleJsonChange} 
                                className="sci-fi-input mt-1 font-mono text-xs h-96"
                                placeholder="Paste Konva JSON here..."
                            />
                         </div>
                    </div>
                    
                    {/* Right Panel: Preview and Actions */}
                    <div className="flex flex-col gap-4">
                         <div>
                            <Label className="text-lg font-serif text-brand-gold">Live Preview</Label>
                            <div className="w-full aspect-square bg-black/30 rounded-lg border-2 border-stone-light mt-1 flex items-center justify-center">
                               {isClient && (
                                    <Suspense fallback={<div className="text-parchment-dark">Loading Preview...</div>}>
                                        <Stage width={stageSize} height={stageSize}>
                                            {scene && <KonvaRenderer node={scene} />}
                                        </Stage>
                                    </Suspense>
                               )}
                            </div>
                         </div>
                         {error && (
                             <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                         )}
                         <Button onClick={handleSaveBuilding} className="sci-fi-button !text-lg w-full">Save Building Design</Button>

                         <div className="bg-black/20 p-2 rounded-md mt-4">
                            <h3 className="font-bold border-b mb-1">Log</h3>
                             <div className="h-32 overflow-y-auto text-sm font-mono space-y-1">
                                {log.length > 0 ? log.map((msg, i) => <p key={i}>{msg}</p>) : <p className="italic text-stone-light">No actions yet.</p>}
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTestMapPage;

