
'use client';

import React, { useState } from 'react';
import type { AgeConfig, ResourceConfig, ResearchConfig } from '../../../../types';
import type { GenerateResourcesOutput, GenerateAgesOutput, GeneratedTechnologyOutput } from '../../ai/flows/generate-resources';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WandSparkles, LoaderCircle, Package, Calendar, Beaker, Sprout } from 'lucide-react';
import { generateResourcesAction, generateAgesAction, generateTechnologyAction } from '../../actions';
import { saveResourceConfig, saveAgeConfig, saveResearchConfig } from '../../../../services/dbService';

interface DataGeneratorProps {
    resources: ResourceConfig[];
    ages: AgeConfig[];
    research: ResearchConfig[];
    onGenerationComplete: () => void;
}

type StagedData =
    | { type: 'resources'; data: NonNullable<GenerateResourcesOutput['resources']> }
    | { type: 'ages'; data: NonNullable<GenerateAgesOutput['ages']> }
    | { type: 'technology'; data: GeneratedTechnologyOutput };


export default function DataGenerator({ resources, ages, research, onGenerationComplete }: DataGeneratorProps) {
    const [dgeResourceCount, setDgeResourceCount] = useState<number>(3);
    const [dgeAgeCount, setDgeAgeCount] = useState<number>(4);
    const [dgeTechTheme, setDgeTechTheme] = useState<string>('Economic');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [dgeError, setDgeError] = useState<string | null>(null);
    const [stagedData, setStagedData] = useState<StagedData | null>(null);

    const handleGenerateResources = async () => {
        setIsGenerating(true);
        setDgeError(null);
        try {
            const existingResourceNames = resources.map(r => r.name);
            const response = await generateResourcesAction({ count: dgeResourceCount, existingResourceNames });

            if (response.error) throw new Error(response.error);
            if (!response.data?.resources) throw new Error("No data returned from AI.");

            setStagedData({ type: 'resources', data: response.data.resources });
        } catch (error) {
            setDgeError(error instanceof Error ? error.message : 'An unknown error occurred during generation.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateAges = async () => {
        setIsGenerating(true);
        setDgeError(null);
        try {
            const existingAgeNames = ages.map(a => a.name);
            const response = await generateAgesAction({ count: dgeAgeCount, existingAgeNames });

            if (response.error) throw new Error(response.error);
            if (!response.data?.ages) throw new Error("No age data returned from AI.");

            setStagedData({ type: 'ages', data: response.data.ages });
        } catch (error) {
            setDgeError(error instanceof Error ? error.message : 'An unknown error occurred during age generation.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateTechnology = async () => {
        setIsGenerating(true);
        setDgeError(null);
        try {
            const existingTechNames = research.map(r => r.name);
            const response = await generateTechnologyAction({ theme: dgeTechTheme, existingTechNames });

            if (response.error) throw new Error(response.error);
            if (!response.data) throw new Error("No technology data returned from AI.");

            setStagedData({ type: 'technology', data: response.data });
        } catch (error) {
            setDgeError(error instanceof Error ? error.message : 'An unknown error occurred during technology generation.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmSave = async () => {
        if (!stagedData) return;

        try {
            if (stagedData.type === 'resources') {
                const highestOrder = resources.length > 0 ? Math.max(...resources.map(r => r.order)) : 0;
                for (const [index, genRes] of stagedData.data.entries()) {
                    const newResource: ResourceConfig = {
                        id: `custom-${genRes.name.toLowerCase().replace(/\s+/g, '_')}-${Date.now()}`,
                        name: genRes.name,
                        description: genRes.description,
                        iconId: genRes.iconId,
                        rarity: genRes.rarity,
                        isActive: true,
                        isPredefined: false,
                        order: highestOrder + index + 1,
                        initialAmount: 0,
                        baseGatherRate: 5,
                        spawnInSafeZone: false,
                        isTradable: true,
                        decaysOverTime: false
                    };
                    await saveResourceConfig(newResource);
                }
            } else if (stagedData.type === 'ages') {
                const highestOrder = ages.length > 0 ? Math.max(...ages.map(a => a.order)) : 0;
                for (const [index, genAge] of stagedData.data.entries()) {
                    const newAge: AgeConfig = {
                        id: `custom-age-${genAge.name.toLowerCase().replace(/\s+/g, '_')}-${Date.now()}`,
                        name: genAge.name,
                        description: genAge.description,
                        isActive: true,
                        isPredefined: false,
                        order: highestOrder + index + 1,
                    };
                    await saveAgeConfig(newAge);
                }
            } else if (stagedData.type === 'technology') {
                const genTech = stagedData.data;
                const highestOrder = research.length > 0 ? Math.max(...research.map(r => r.order)) : 0;
                const newTech: ResearchConfig = {
                    id: `custom-tech-${genTech.name.toLowerCase().replace(/\s+/g, '_')}-${Date.now()}`,
                    name: genTech.name,
                    description: genTech.description,
                    iconId: genTech.iconId,
                    cost: genTech.cost,
                    researchTime: genTech.researchTime,
                    prerequisites: [],
                    effects: [],
                    treeId: genTech.treeId.toLowerCase().replace(/\s+/g, '_'),
                    treeName: genTech.treeName,
                    requiredBuildingId: 'blacksmith',
                    ageRequirement: ages[0]?.name || 'Nomadic Age',
                    isActive: true,
                    isPredefined: false,
                    order: highestOrder + 1,
                };
                await saveResearchConfig(newTech);
            }

            await onGenerationComplete();
        } catch (error) {
            setDgeError(error instanceof Error ? error.message : "Failed to save generated data.");
        } finally {
            setStagedData(null);
        }
    };
    
    const renderStagedData = () => {
        if (!stagedData) return null;

        switch(stagedData.type) {
            case 'resources':
                return (
                    <div className="space-y-2">
                        {stagedData.data.map((res, i) => (
                             <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-black/20">
                                 <div className="w-5 h-5 mt-1 text-brand-green"><Sprout/></div>
                                 <div>
                                    <p className="font-bold">{res.name} <span className="text-xs font-normal text-parchment-dark">({res.rarity})</span></p>
                                    <p className="text-sm text-parchment-dark">{res.description}</p>
                                 </div>
                             </div>
                        ))}
                    </div>
                );
            case 'ages':
                 return (
                    <div className="space-y-2">
                        {stagedData.data.map((age, i) => (
                             <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-black/20">
                                 <div className="w-5 h-5 mt-1 text-brand-gold"><Calendar/></div>
                                 <div>
                                    <p className="font-bold">{age.name}</p>
                                    <p className="text-sm text-parchment-dark">{age.description}</p>
                                 </div>
                             </div>
                        ))}
                    </div>
                );
            case 'technology':
                const tech = stagedData.data;
                const costString = Object.entries(tech.cost).map(([res, val]) => `${val} ${res}`).join(', ');
                 return (
                     <div className="flex items-start gap-3 p-2 rounded-md bg-black/20">
                         <div className="w-5 h-5 mt-1 text-brand-blue"><Beaker/></div>
                         <div>
                            <p className="font-bold">{tech.name} <span className="text-xs font-normal text-parchment-dark">({tech.treeName})</span></p>
                            <p className="text-sm text-parchment-dark mb-1">{tech.description}</p>
                            <p className="text-xs text-parchment-dark">Cost: {costString || 'Free'} | Time: {tech.researchTime}s</p>
                         </div>
                     </div>
                );
            default: return null;
        }
    };


    return (
        <Card className="bg-stone-dark/30 border-stone-light/30">
            <AlertDialog open={!!stagedData} onOpenChange={(isOpen) => !isOpen && setStagedData(null)}>
                <AlertDialogContent className="sci-fi-panel-popup sci-fi-grid">
                    <AlertDialogHeader>
                        <AlertDialogTitle>AI Generation Complete</AlertDialogTitle>
                        <AlertDialogDescription className="text-parchment-dark">
                           The following data has been generated. Review and confirm to add it to your game's database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <ScrollArea className="max-h-60 -mx-6 pr-2 pl-6 py-2 my-2 border-y border-stone-light/20 bg-black/10">
                        {renderStagedData()}
                    </ScrollArea>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setStagedData(null)} className="sci-fi-button !text-base">Cancel</AlertDialogCancel>
                        <Button onClick={handleConfirmSave} className="sci-fi-button !text-base bg-brand-green hover:bg-brand-green/80">Accept & Save</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <CardHeader>
                <CardTitle className="text-brand-gold flex items-center gap-2"><WandSparkles /> Data Generator Engine (DGE)</CardTitle>
                <CardDescription className="text-parchment-dark">Use AI to procedurally generate new content for your game.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {dgeError && (
                    <Alert variant="destructive">
                        <AlertTitle>Generation Failed</AlertTitle>
                        <AlertDescription>{dgeError}</AlertDescription>
                    </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-stone-dark/20 border-stone-light/20">
                        <CardHeader>
                            <CardTitle className="text-base font-serif">Resource Generator</CardTitle>
                            <CardDescription className="text-parchment-dark">Generate new, creative economic resources.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-end gap-4">
                            <div className="flex-grow">
                                <Label htmlFor="dge-resource-count">Number to Generate</Label>
                                <Input 
                                    id="dge-resource-count" 
                                    type="number" 
                                    value={dgeResourceCount} 
                                    onChange={(e) => setDgeResourceCount(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))} 
                                    min="1" 
                                    max="10" 
                                    className="sci-fi-input" 
                                    disabled={isGenerating}
                                />
                            </div>
                            <Button onClick={handleGenerateResources} disabled={isGenerating}>
                                {isGenerating ? <LoaderCircle className="mr-2 animate-spin"/> : <WandSparkles className="mr-2" />}
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="bg-stone-dark/20 border-stone-light/20">
                        <CardHeader>
                            <CardTitle className="text-base font-serif">Age Generator</CardTitle>
                            <CardDescription className="text-parchment-dark">Generate a sequence of thematic ages for your game.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-end gap-4">
                            <div className="flex-grow">
                                <Label htmlFor="dge-age-count">Number to Generate</Label>
                                <Input 
                                    id="dge-age-count" 
                                    type="number" 
                                    value={dgeAgeCount} 
                                    onChange={(e) => setDgeAgeCount(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))} 
                                    min="1" 
                                    max="10" 
                                    className="sci-fi-input" 
                                    disabled={isGenerating}
                                />
                            </div>
                            <Button onClick={handleGenerateAges} disabled={isGenerating}>
                                {isGenerating ? <LoaderCircle className="mr-2 animate-spin"/> : <WandSparkles className="mr-2" />}
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </Button>
                        </CardContent>
                    </Card>
                    
                     <Card className="bg-stone-dark/20 border-stone-light/20">
                        <CardHeader>
                            <CardTitle className="text-base font-serif">Technology Generator</CardTitle>
                            <CardDescription className="text-parchment-dark">Generate a single new technology based on a theme.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-end gap-4">
                            <div className="flex-grow">
                                <Label htmlFor="dge-tech-theme">Theme</Label>
                                <Input
                                    id="dge-tech-theme"
                                    type="text"
                                    value={dgeTechTheme}
                                    onChange={(e) => setDgeTechTheme(e.target.value)}
                                    placeholder="e.g., Naval Combat"
                                    className="sci-fi-input"
                                    disabled={isGenerating}
                                />
                            </div>
                            <Button onClick={handleGenerateTechnology} disabled={isGenerating}>
                                {isGenerating ? <LoaderCircle className="mr-2 animate-spin" /> : <WandSparkles className="mr-2" />}
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
}
