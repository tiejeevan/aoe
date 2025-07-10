
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Stage, Layer } from 'react-konva';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Import the new custom component directly
import CustomBuilding1 from '../../../components/test/CustomBuilding1';

const AdminTestMapPage = () => {
    const [isClient, setIsClient] = useState(false);
    const [buildingName, setBuildingName] = useState('My Stick Figure');
    const [error, setError] = useState<string | null>(null);
    const [log, setLog] = useState<string[]>([]);


    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleSaveBuilding = () => {
        if (!buildingName.trim()) {
            setError("Building name cannot be empty.");
            return;
        }

        // In a real app, this would save to a database or state management solution.
        // For now, we'll just log it to demonstrate the concept.
        console.log("Saving building:", {
            name: buildingName,
            component: 'CustomBuilding1', // We would save the component identifier
        });

        const newLogMessage = `Saved building "${buildingName}" successfully.`;
        setLog(prev => [newLogMessage, ...prev.slice(0, 9)]);
        setError(null);
    };

    const stageSize = 300;

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
                            <Label className="text-lg font-serif text-brand-gold">Component File</Label>
                            <p className="text-parchment-dark">Currently previewing: <code className="font-mono bg-black/30 p-1 rounded">components/test/CustomBuilding1.tsx</code></p>
                            <p className="text-xs text-stone-light mt-1">To change this, ask the AI to create or modify a component file.</p>
                         </div>
                    </div>
                    
                    {/* Right Panel: Preview and Actions */}
                    <div className="flex flex-col gap-4">
                         <div>
                            <Label className="text-lg font-serif text-brand-gold">Live Preview</Label>
                            <div className="w-full aspect-square bg-black/30 rounded-lg border-2 border-stone-light mt-1 flex items-center justify-center">
                               {isClient && (
                                    <Stage width={stageSize} height={stageSize}>
                                        <Layer>
                                            <CustomBuilding1 x={stageSize / 2} y={stageSize / 2 - 50} />
                                        </Layer>
                                    </Stage>
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
