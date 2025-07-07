
'use client';

import React, { useState, useMemo } from 'react';
import type { ResearchConfig, Resources, GameTask, AgeConfig } from '@/types';
import { Button } from '@/src/components/ui/button';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { resourceIconMap, researchIconMap } from '@/components/icons/iconRegistry';
import { CheckCircle2, Lock, Clock, Info, X } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';

interface ResearchPanelProps {
    isOpen: boolean;
    onClose: () => void;
    masterResearchList: ResearchConfig[];
    completedResearch: string[];
    activeTasks: GameTask[];
    resources: Resources;
    currentAge: string;
    ageProgressionList: AgeConfig[];
    onStartResearch: (researchId: string) => void;
}

const CostDisplay: React.FC<{ cost: { [key: string]: number }, resources: Resources, isAvailable: boolean }> = ({ cost, resources, isAvailable }) => (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {(Object.entries(cost)).map(([resource, amount]) => {
            if (!amount) return null;
            const hasEnough = (resources[resource] || 0) >= amount;
            const Icon = resourceIconMap[resource] || resourceIconMap.default;
            return (
                <span key={resource} className={`flex items-center transition-colors ${!isAvailable ? 'text-parchment-dark/50' : hasEnough ? 'text-parchment-dark' : 'text-brand-red'}`}>
                    <div className="w-4 h-4"><Icon /></div>
                    <span className="ml-1 font-mono">{amount}</span>
                </span>
            );
        })}
    </div>
);

const ResearchPanel: React.FC<ResearchPanelProps> = ({
    isOpen, onClose, masterResearchList, completedResearch, activeTasks, resources, currentAge, ageProgressionList, onStartResearch
}) => {
    const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

    const researchTrees = useMemo(() => {
        return masterResearchList
            .filter(tech => tech.isActive)
            .reduce((acc, tech) => {
                const treeId = tech.treeId || 'uncategorized';
                if (!acc[treeId]) {
                    acc[treeId] = {
                        id: treeId,
                        name: tech.treeName || 'Uncategorized',
                        colorTheme: tech.colorTheme || '#d79921',
                        technologies: []
                    };
                }
                acc[treeId].technologies.push(tech);
                acc[treeId].technologies.sort((a,b) => a.order - b.order);
                return acc;
            }, {} as Record<string, { id: string, name: string, colorTheme: string, technologies: ResearchConfig[] }>);
    }, [masterResearchList]);

    const getTechStatus = (tech: ResearchConfig) => {
        const currentAgeIndex = ageProgressionList.findIndex(a => a.name === currentAge);
        const techAgeIndex = ageProgressionList.findIndex(a => a.name === tech.ageRequirement);
        
        const prerequisitesMet = (tech.prerequisites || []).every(id => completedResearch.includes(id));
        const ageMet = techAgeIndex <= currentAgeIndex;

        if (completedResearch.includes(tech.id)) return 'researched';
        if (activeTasks.some(t => t.type === 'research' && t.payload?.researchId === tech.id)) return 'researching';
        if (prerequisitesMet && ageMet) return 'available';
        return 'locked';
    };
    
    const selectedTech = masterResearchList.find(t => t.id === selectedTechId);
    const selectedTechStatus = selectedTech ? getTechStatus(selectedTech) : 'locked';
    const canAffordSelected = selectedTech ? Object.entries(selectedTech.cost).every(([res, cost]) => (resources[res as keyof Resources] || 0) >= (cost as number)) : false;


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in-50">
            <div className="sci-fi-panel-popup sci-fi-grid p-0 w-full max-w-6xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-stone-light/20 flex-shrink-0">
                    <h2 className="text-3xl font-serif">Technology Trees</h2>
                    <button onClick={onClose} className="text-4xl font-bold sci-fi-close-button"><X/></button>
                </div>
                <div className="flex flex-grow min-h-0">
                    {/* Main Canvas Area */}
                    <ScrollArea className="flex-grow p-6">
                        <div className="space-y-8">
                            {Object.values(researchTrees).map(tree => (
                                <div key={tree.id}>
                                    <h3 className="text-2xl font-serif mb-4" style={{ color: tree.colorTheme }}>{tree.name}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {tree.technologies.map(tech => {
                                            const status = getTechStatus(tech);
                                            const Icon = researchIconMap[tech.iconId] || researchIconMap.default;
                                            const isSelected = selectedTechId === tech.id;
                                            
                                            let borderColor = 'border-stone-light/30';
                                            if (isSelected) borderColor = 'border-brand-gold';
                                            else if (status === 'available') borderColor = 'border-brand-green/70';
                                            else if (status === 'researched') borderColor = 'border-brand-blue/70';

                                            return (
                                                <button 
                                                    key={tech.id}
                                                    onClick={() => setSelectedTechId(tech.id)}
                                                    className={`relative group p-3 text-left rounded-md transition-all duration-200 border-2 ${borderColor} hover:border-brand-gold/80`}
                                                    style={{ backgroundColor: isSelected ? 'rgba(215, 153, 33, 0.1)' : 'rgba(0,0,0,0.3)' }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 p-1.5 flex-shrink-0 bg-black/30 rounded-md" style={{ color: tree.colorTheme }}><Icon/></div>
                                                        <p className="font-bold text-sm flex-grow">{tech.name}</p>
                                                    </div>
                                                     <div className="absolute top-1.5 right-1.5 text-parchment-dark">
                                                        {status === 'researched' && <CheckCircle2 className="w-5 h-5 text-brand-green" title="Researched"/>}
                                                        {status === 'researching' && <Clock className="w-5 h-5 text-brand-gold animate-spin" title="Researching"/>}
                                                        {status === 'locked' && <Lock className="w-5 h-5 text-parchment-dark/50" title="Locked"/>}
                                                    </div>
                                                    <p className="text-xs text-parchment-dark mt-2 truncate">{tech.description}</p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    
                    {/* Details Sidebar */}
                    <div className="w-[380px] flex-shrink-0 border-l border-stone-light/20 bg-black/30 p-4 flex flex-col">
                        {selectedTech ? (
                             <ScrollArea className="h-full">
                                <div className="pr-4 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 p-2 bg-black/40 rounded-md flex-shrink-0" style={{color: researchTrees[selectedTech.treeId]?.colorTheme || '#d79921'}}>
                                            {React.createElement(researchIconMap[selectedTech.iconId] || researchIconMap.default)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-serif text-brand-gold">{selectedTech.name}</h3>
                                            <p className="text-xs text-parchment-dark">{selectedTech.treeName}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-parchment-dark min-h-[60px]">{selectedTech.description}</p>
                                    
                                    <hr className="border-stone-light/20"/>
                                    
                                    <div><h4 className="font-serif text-base mb-1">Cost:</h4><CostDisplay cost={selectedTech.cost} resources={resources} isAvailable={selectedTechStatus === 'available'}/></div>
                                    <div className="text-sm text-parchment-dark">Research Time: {selectedTech.researchTime}s</div>
                                    
                                    <hr className="border-stone-light/20"/>

                                    <div>
                                        <h4 className="font-serif text-base mb-1">Requirements:</h4>
                                        <ul className="text-sm space-y-1">
                                            {(selectedTech.prerequisites || []).map(reqId => {
                                                const reqTech = masterResearchList.find(t => t.id === reqId);
                                                const isMet = completedResearch.includes(reqId);
                                                return (<li key={reqId} className={`flex items-center gap-2 ${isMet ? 'text-brand-green' : 'text-brand-red'}`}>{isMet ? <CheckCircle2 className="w-4 h-4"/> : <X className="w-4 h-4"/>}{reqTech?.name || reqId}</li>)
                                            })}
                                            <li className={`flex items-center gap-2 ${ageProgressionList.findIndex(a => a.name === currentAge) >= ageProgressionList.findIndex(a => a.name === selectedTech.ageRequirement) ? 'text-brand-green' : 'text-brand-red'}`}>
                                                 {ageProgressionList.findIndex(a => a.name === currentAge) >= ageProgressionList.findIndex(a => a.name === selectedTech.ageRequirement) ? <CheckCircle2 className="w-4 h-4"/> : <X className="w-4 h-4"/>}
                                                Requires {selectedTech.ageRequirement}
                                            </li>
                                        </ul>
                                    </div>

                                    {selectedTechStatus === 'available' && <Button disabled={!canAffordSelected} onClick={() => onStartResearch(selectedTech.id)} className="w-full sci-fi-button !text-lg !py-2 mt-auto">Research</Button>}
                                    {selectedTechStatus === 'researching' && <div className="pt-4"><ProgressBar startTime={activeTasks.find(t=>t.payload?.researchId === selectedTech.id)!.startTime} duration={activeTasks.find(t=>t.payload?.researchId === selectedTech.id)!.duration} className="h-4"/></div>}
                                    {selectedTechStatus === 'researched' && <div className="text-center py-4 text-brand-green font-bold flex items-center justify-center gap-2"><CheckCircle2/> Researched</div>}
                                    {selectedTechStatus === 'locked' && <div className="text-center py-4 text-brand-red font-bold flex items-center justify-center gap-2"><Lock/> Locked</div>}
                                </div>
                             </ScrollArea>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-parchment-dark">
                                <Info className="w-12 h-12 text-brand-blue mb-4"/>
                                <p>Select a technology to view its details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResearchPanel;
