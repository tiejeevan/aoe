
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { AgeConfig, BuildingConfig, BuildingCosts, Resources, UnitConfig, UnitClassification, AttackBonus, ArmorValue, ArmorClassification, DamageType, TerrainModifier, UnitUpgradePath, ResourceConfig, ResourceRarity, ResearchConfig, ResearchEffect, ResearchEffectType, ResearchOperation, ResearchTargetType } from '../../../types';
import { saveAgeConfig, getAllAgeConfigs, deleteAgeConfig, saveBuildingConfig, getAllBuildingConfigs, deleteBuildingConfig, saveUnitConfig, getAllUnitConfigs, deleteUnitConfig, saveResourceConfig, getAllResourceConfigs, deleteResourceConfig, saveResearchConfig, getAllResearchConfigs, deleteResearchConfig } from '../../../services/dbService';
import { Trash2, Lock, ArrowUp, ArrowDown, Edit, Save, XCircle, PlusCircle, Building, Swords, Shield, Coins, TestTube, ChevronsUp, Star, Wrench, Calendar, Beaker, Info, Copy, RefreshCw, Footprints, Sprout, FlaskConical, Target, WandSparkles, LoaderCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DataGenerator from './components/DataGenerator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


import { INITIAL_BUILDINGS } from '../../../data/buildingInfo';
import { INITIAL_UNITS } from '../../../data/unitInfo';
import { INITIAL_RESOURCES } from '../../../data/resourceInfo';
import { buildingIconMap, unitIconMap, resourceIconMap, researchIconMap } from '../../../components/icons/iconRegistry';
import { INITIAL_AGES } from '../../../data/ageInfo';
import { INITIAL_RESEARCH } from '../../../data/researchInfo';

const BuildingEditor: React.FC<{
    building: BuildingConfig;
    onSave: (building: BuildingConfig) => void;
    onCancel: () => void;
    allAges: AgeConfig[];
    allBuildings: BuildingConfig[];
    allResources: ResourceConfig[];
}> = ({ building, onSave, onCancel, allAges, allBuildings, allResources }) => {
    const [editedBuilding, setEditedBuilding] = useState<BuildingConfig>(building);

    const handleInputChange = (field: keyof BuildingConfig, value: any) => {
        setEditedBuilding(prev => ({ ...prev, [field]: value }));
    };
    const handleNumberChange = (field: keyof BuildingConfig, value: string) => {
        setEditedBuilding(prev => ({ ...prev, [field]: value === '' ? undefined : parseInt(value, 10) || 0 }));
    };
    const handleCostChange = (costField: 'cost' | 'researchCost' | 'maintenanceCost', resource: string, value: string) => {
        const amount = parseInt(value, 10) || 0;
        setEditedBuilding(prev => ({
            ...prev,
            [costField]: { ...prev[costField], [resource]: amount }
        }));
    };

    const handleUpgradePathChange = (targetId: string, checked: boolean) => {
        setEditedBuilding(prev => {
            const currentUpgrades = prev.upgradesTo || [];
            if (checked) {
                if (!currentUpgrades.some(u => u.id === targetId)) {
                    return { ...prev, upgradesTo: [...currentUpgrades, { id: targetId, cost: {}, time: 60 }] };
                }
                return prev;
            } else {
                return { ...prev, upgradesTo: currentUpgrades.filter(u => u.id !== targetId) };
            }
        });
    };
    
    const handleUpgradeDetailChange = (targetId: string, field: 'time' | string, value: string) => {
        const numValue = parseInt(value, 10) || 0;
        setEditedBuilding(prev => ({
            ...prev,
            upgradesTo: (prev.upgradesTo || []).map(u => {
                if (u.id === targetId) {
                    if (field === 'time') {
                        return { ...u, time: numValue };
                    }
                    return { ...u, cost: { ...u.cost, [field]: numValue } };
                }
                return u;
            })
        }));
    };

    const costLikeFields: { key: 'cost' | 'researchCost' | 'maintenanceCost', title: string }[] = [
        { key: 'cost', title: 'Build Cost' },
        { key: 'researchCost', title: 'Research Cost' },
        { key: 'maintenanceCost', title: 'Maintenance Cost (per min)' },
    ];
    
    const activeResources = allResources.filter(r => r.isActive);

    return (
        <div className="bg-stone-dark/40 p-4 rounded-lg border-2 border-brand-gold my-4 space-y-4 animate-in fade-in-50">
            <h3 className="text-xl font-bold text-brand-gold font-serif">Editing: {building.name}</h3>
            
            <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-5 bg-stone-dark/80 border border-stone-light/20">
                    <TabsTrigger value="general"><Building className="w-4 h-4 mr-2"/>General</TabsTrigger>
                    <TabsTrigger value="economy"><Coins className="w-4 h-4 mr-2"/>Economy</TabsTrigger>
                    <TabsTrigger value="military"><Shield className="w-4 h-4 mr-2"/>Military</TabsTrigger>
                    <TabsTrigger value="research"><Beaker className="w-4 h-4 mr-2"/>Research &amp; Upgrades</TabsTrigger>
                    <TabsTrigger value="meta"><Star className="w-4 h-4 mr-2"/>Meta</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="pt-4">
                    <Card className="bg-stone-dark/20 border-stone-light/20">
                        <CardHeader><CardTitle className="text-base font-serif">Core Attributes</CardTitle></CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label>Name</Label><Input type="text" value={editedBuilding.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Building Name" className="sci-fi-input" /></div>
                                <div><Label>Icon</Label><Select value={editedBuilding.iconId} onValueChange={(val) => handleInputChange('iconId', val)}><SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(buildingIconMap).map(iconId => <SelectItem key={iconId} value={iconId}>{iconId}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <div><Label>Description</Label><Textarea value={editedBuilding.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Description" className="sci-fi-input" /></div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                <div><Label>Build Time (s)</Label><Input type="number" value={editedBuilding.buildTime} onChange={(e) => handleNumberChange('buildTime', e.target.value)} className="sci-fi-input" /></div>
                                <div><Label>HP</Label><Input type="number" value={editedBuilding.hp} onChange={(e) => handleNumberChange('hp', e.target.value)} placeholder="HP" className="sci-fi-input" /></div>
                                <div><Label>Unlocked In</Label><Select value={editedBuilding.unlockedInAge} onValueChange={(val) => handleInputChange('unlockedInAge', val)}><SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger><SelectContent>{allAges.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent></Select></div>
                                 <div><Label>Prerequisite</Label><Select value={editedBuilding.requiredBuildingId || 'none'} onValueChange={(val) => handleInputChange('requiredBuildingId', val === 'none' ? undefined : val)}><SelectTrigger className="sci-fi-input"><SelectValue placeholder="None"/></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{allBuildings.filter(b => b.id !== building.id).map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="economy" className="pt-4">
                     <Card className="bg-stone-dark/20 border-stone-light/20 mb-4">
                        <CardHeader><CardTitle className="text-base font-serif">Costs</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {costLikeFields.map(({key, title}) => (
                                <div key={key}>
                                    <Label>{title}</Label>
                                    <div className={`grid grid-cols-2 sm:grid-cols-${activeResources.length || 1} gap-2 border border-stone-light/20 p-2 rounded-md bg-black/20 mt-1`}>
                                        {activeResources.map(res => (<div key={res.id}><Label className="capitalize text-xs">{res.name}</Label><Input type="number" value={editedBuilding[key]?.[res.id] || ''} onChange={(e) => handleCostChange(key, res.id, e.target.value)} placeholder="0" className="sci-fi-input w-full" /></div>))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                     </Card>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Card className="bg-stone-dark/20 border-stone-light/20">
                            <CardHeader><CardTitle className="text-base font-serif">Population &amp; Housing</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div><Label>Population Provided</Label><Input type="number" value={editedBuilding.populationCapacity || ''} onChange={(e) => handleNumberChange('populationCapacity', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                                <div><Label>Garrison Capacity</Label><Input type="number" value={editedBuilding.garrisonCapacity || ''} onChange={(e) => handleNumberChange('garrisonCapacity', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                            </CardContent>
                        </Card>
                        <Card className="bg-stone-dark/20 border-stone-light/20">
                            <CardHeader><CardTitle className="text-base font-serif">Passive Generation</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                 <div><Label>Generates Resource</Label><Select value={editedBuilding.generatesResource || 'none'} onValueChange={(val) => handleInputChange('generatesResource', val === 'none' ? undefined : val)}><SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{activeResources.map(res => (<SelectItem key={res.id} value={res.id} className="capitalize">{res.name}</SelectItem>))}</SelectContent></Select></div>
                                {editedBuilding.generatesResource && <div><Label>Rate (per min)</Label><Input type="number" value={editedBuilding.generationRate || ''} onChange={(e) => handleNumberChange('generationRate', e.target.value)} placeholder="0" className="sci-fi-input" /></div>}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                
                <TabsContent value="military" className="pt-4">
                     <Card className="bg-stone-dark/20 border-stone-light/20">
                         <CardHeader><CardTitle className="text-base font-serif">Combat &amp; Vision</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div><Label>Attack Damage</Label><Input type="number" value={editedBuilding.attack || ''} onChange={(e) => handleNumberChange('attack', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                            <div><Label>Attack Rate (/s)</Label><Input type="number" value={editedBuilding.attackRate || ''} onChange={(e) => handleNumberChange('attackRate', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                            <div><Label>Attack Range (cells)</Label><Input type="number" value={editedBuilding.attackRange || ''} onChange={(e) => handleNumberChange('attackRange', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                            <div><Label>Vision Range (cells)</Label><Input type="number" value={editedBuilding.visionRange || ''} onChange={(e) => handleNumberChange('visionRange', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                        </CardContent>
                     </Card>
                     <Card className="bg-stone-dark/20 border-stone-light/20 mt-4">
                         <CardHeader><CardTitle className="text-base font-serif">Durability &amp; Repair</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>Decay Rate (HP/min)</Label><Input type="number" value={editedBuilding.decayRate || ''} onChange={(e) => handleNumberChange('decayRate', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                             <div><Label>Heal Rate (HP/s)</Label><Input type="number" value={editedBuilding.healRate || ''} onChange={(e) => handleNumberChange('healRate', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                        </CardContent>
                     </Card>
                </TabsContent>

                 <TabsContent value="research" className="pt-4">
                    <Card className="bg-stone-dark/20 border-stone-light/20">
                        <CardHeader><CardTitle className="text-base font-serif">Technology &amp; Progression</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2"><Switch id="edit-canTrainUnits" checked={!!editedBuilding.canTrainUnits} onCheckedChange={(c) => handleInputChange('canTrainUnits', c)} /><Label htmlFor="edit-canTrainUnits">Can Train Units</Label></div>
                                <div className="flex items-center gap-2"><Switch id="edit-canResearch" checked={!!editedBuilding.canResearch} onCheckedChange={(c) => handleInputChange('canResearch', c)} /><Label htmlFor="edit-canResearch">Can Research Tech</Label></div>
                                <div className="flex items-center gap-2"><Switch id="edit-isUnique" checked={!!editedBuilding.isUnique} onCheckedChange={(c) => { handleInputChange('isUnique', c); if(c) handleInputChange('buildLimit', 1); }} /><Label htmlFor="edit-isUnique">Unique Building</Label></div>
                                {!editedBuilding.isUnique && (<div className="flex items-center gap-2"><Label htmlFor="edit-buildLimit">Build Limit (0=inf)</Label><Input id="edit-buildLimit" type="number" value={editedBuilding.buildLimit || 0} onChange={(e) => handleInputChange('buildLimit', Math.max(0, parseInt(e.target.value, 10) || 0))} className="sci-fi-input w-24" min="0" /></div>)}
                                <div className="flex items-center gap-2"><Switch id="edit-isUpgradeOnly" checked={!!editedBuilding.isUpgradeOnly} onCheckedChange={(c) => handleInputChange('isUpgradeOnly', c)} /><Label htmlFor="edit-isUpgradeOnly">Upgrade Only (Cannot be built directly)</Label></div>
                                <div className="flex items-center gap-2"><Switch id="edit-requiresResearch" checked={!!editedBuilding.requiresResearch} onCheckedChange={(c) => handleInputChange('requiresResearch', c)} /><Label htmlFor="edit-requiresResearch">Requires Research</Label></div>
                                {editedBuilding.requiresResearch && (
                                    <div className="pl-4 border-l-2 border-brand-gold space-y-2">
                                        <div><Label>Research Time (s)</Label><Input type="number" value={editedBuilding.researchTime || ''} onChange={(e) => handleNumberChange('researchTime', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                                        <div><Label>Unlocks Research IDs (comma-separated)</Label><Input type="text" value={(editedBuilding.unlocksResearchIds || []).join(',')} onChange={(e) => handleInputChange('unlocksResearchIds', e.target.value.split(',').map(s => s.trim()))} placeholder="tech_1, tech_2" className="sci-fi-input" /></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Label>Upgrade Paths</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-5 w-5 text-brand-blue hover:text-brand-gold"><Info className="w-4 h-4"/></Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-96 sci-fi-panel-popup">
                                            <h4 className="font-bold text-brand-gold font-serif">Upgrade Tree for ID:</h4>
                                            <p className="text-xs font-mono break-all mb-2">{editedBuilding.treeId}</p>
                                            <hr className="border-stone-light/20 mb-2"/>
                                            <ul className="space-y-1">
                                                {allBuildings
                                                    .filter(b => b.treeId === editedBuilding.treeId)
                                                    .sort((a,b) => a.order - b.order)
                                                    .map(b => (
                                                        <li key={b.id} className={`flex justify-between items-center text-sm p-1 rounded ${b.id === editedBuilding.id ? 'bg-brand-blue/20' : ''}`}>
                                                            <span>{b.name}</span>
                                                            <span className="text-xs text-parchment-dark">{b.unlockedInAge}</span>
                                                        </li>
                                                    ))
                                                }
                                            </ul>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <ScrollArea className="h-64 w-full rounded-md border border-stone-light/20 p-2 bg-black/20">
                                    <div className="space-y-4">
                                        {allBuildings
                                            .filter(b => b.treeId === editedBuilding.treeId && b.id !== editedBuilding.id)
                                            .map(targetBuilding => {
                                                const upgradePath = editedBuilding.upgradesTo?.find(u => u.id === targetBuilding.id);
                                                const isEnabled = !!upgradePath;
                                                return (
                                                    <div key={targetBuilding.id} className="p-2 border border-stone-light/10 rounded-md">
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox id={`upgrades-${targetBuilding.id}`} checked={isEnabled} onCheckedChange={(checked) => handleUpgradePathChange(targetBuilding.id, !!checked)} />
                                                            <label htmlFor={`upgrades-${targetBuilding.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                                {targetBuilding.name} <span className="text-xs text-parchment-dark">({targetBuilding.unlockedInAge})</span>
                                                            </label>
                                                        </div>
                                                        {isEnabled && (
                                                            <div className="mt-2 pl-6 space-y-2 animate-in fade-in-50">
                                                                <div className={`grid grid-cols-2 sm:grid-cols-${(activeResources.length || 0) + 1} gap-2 items-end`}>
                                                                    <Label className="sm:col-span-5 text-xs text-brand-gold">Upgrade Cost &amp; Time for {targetBuilding.name}:</Label>
                                                                    {activeResources.map(res => (
                                                                        <div key={res.id}>
                                                                            <Label className="capitalize text-xs">{res.name}</Label>
                                                                            <Input type="number" value={upgradePath.cost[res.id] || ''} onChange={(e) => handleUpgradeDetailChange(targetBuilding.id, res.id, e.target.value)} placeholder="0" className="sci-fi-input !h-8" />
                                                                        </div>
                                                                    ))}
                                                                    <div>
                                                                        <Label className="text-xs">Time(s)</Label>
                                                                        <Input type="number" value={upgradePath.time} onChange={(e) => handleUpgradeDetailChange(targetBuilding.id, 'time', e.target.value)} placeholder="0" className="sci-fi-input !h-8" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                        })}
                                        {allBuildings.filter(b => b.treeId === editedBuilding.treeId && b.id !== editedBuilding.id).length === 0 && (
                                            <p className="text-center text-parchment-dark text-sm p-4">No other buildings found in this tree. Create another building with the same Tree ID to set up an upgrade path.</p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </CardContent>
                    </Card>
                 </TabsContent>

                 <TabsContent value="meta" className="pt-4">
                     <Card className="bg-stone-dark/20 border-stone-light/20">
                         <CardHeader><CardTitle className="text-base font-serif">Meta &amp; Aesthetics</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 <div><Label>Award Points</Label><Input type="number" value={editedBuilding.awardPoints || ''} onChange={(e) => handleNumberChange('awardPoints', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                                 <div><Label>Award Tier</Label><Select value={editedBuilding.awardTier} onValueChange={(val) => handleInputChange('awardTier', val)}><SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger><SelectContent>{['Bronze', 'Silver', 'Gold'].map(tier => <SelectItem key={tier} value={tier}>{tier}</SelectItem>)}</SelectContent></Select></div>
                                 <div><Label>Placement Radius</Label><Input type="number" value={editedBuilding.placementRadius || ''} onChange={(e) => handleNumberChange('placementRadius', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                             </div>
                             <div>
                                <Label>Tree ID</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        type="text" 
                                        value={editedBuilding.treeId || ''} 
                                        onChange={(e) => handleInputChange('treeId', e.target.value)} 
                                        placeholder="e.g., tree-17..."
                                        className="sci-fi-input" 
                                    />
                                    <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(editedBuilding.treeId || '')} title="Copy Tree ID"><Copy className="w-4 h-4"/></Button>
                                    <Button variant="outline" size="icon" onClick={() => handleInputChange('treeId', `tree-${Date.now()}`)} title="Generate New Tree ID"><RefreshCw className="w-4 h-4"/></Button>
                                </div>
                                <p className="text-xs text-parchment-dark mt-1">Buildings with the same Tree ID can be upgraded to each other. Paste an ID to join a tree, or generate a new one.</p>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label>Custom Model ID</Label><Input type="text" value={editedBuilding.customModelId || ''} onChange={(e) => handleInputChange('customModelId', e.target.value)} placeholder="e.g., house_model_v2" className="sci-fi-input" /></div>
                                <div><Label>Seasonal Variant IDs (comma-separated)</Label><Input type="text" value={(editedBuilding.seasonalVariantIds || []).join(',')} onChange={(e) => handleInputChange('seasonalVariantIds', e.target.value.split(',').map(s => s.trim()))} placeholder="winter_skin, halloween_skin" className="sci-fi-input" /></div>
                             </div>
                        </CardContent>
                     </Card>
                 </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={onCancel} className="text-brand-red hover:bg-brand-red/10"><XCircle className="w-4 h-4 mr-2"/>Cancel</Button>
                <Button onClick={() => onSave(editedBuilding)} className="bg-brand-green hover:bg-brand-green/80"><Save className="w-4 h-4 mr-2"/>Save Changes</Button>
            </div>
        </div>
    );
};

const UnitEditor: React.FC<{
    unit: UnitConfig;
    onSave: (unit: UnitConfig) => void;
    onCancel: () => void;
    allBuildings: BuildingConfig[];
    allUnits: UnitConfig[];
    allResources: ResourceConfig[];
}> = ({ unit, onSave, onCancel, allBuildings, allUnits, allResources }) => {
    const [editedUnit, setEditedUnit] = useState<UnitConfig>(unit);

    const trainingBuildings = allBuildings.filter(b => b.canTrainUnits && b.isActive);
    const unitClassifications: UnitClassification[] = ['infantry', 'cavalry', 'archer', 'siege', 'support', 'mythical', 'ship'];
    const armorClassifications: ArmorClassification[] = ['melee', 'pierce', 'siege', 'magic', 'elemental'];
    const damageTypeOptions: string[] = ['slash', 'pierce', 'blunt', 'magic', 'fire', 'ice'];
    const terrainTypeOptions: string[] = ['plains', 'forest', 'desert', 'mountain', 'water'];
    const activeResources = allResources.filter(r => r.isActive);


    const handleInputChange = (field: keyof UnitConfig, value: any) => {
        setEditedUnit(prev => ({ ...prev, [field]: value }));
    };
    const handleNumberChange = (field: keyof UnitConfig, value: string) => {
        setEditedUnit(prev => ({ ...prev, [field]: value === '' ? undefined : Number(value) || 0 }));
    };
     const handleFloatChange = (field: keyof UnitConfig, value: string) => {
        setEditedUnit(prev => ({ ...prev, [field]: value === '' ? undefined : parseFloat(value) || 0 }));
    };
    const handleCostChange = (resource: string, value: string) => {
        const amount = parseInt(value, 10) || 0;
        setEditedUnit(prev => ({ ...prev, cost: { ...prev.cost, [resource]: amount } }));
    };

    const handleArrayFieldChange = <T,>(field: keyof UnitConfig, index: number, itemField: keyof T, value: any) => {
        setEditedUnit(prev => {
            const items = [...((prev[field] as T[] | undefined) || [])];
            items[index] = { ...items[index], [itemField]: value };
            return { ...prev, [field]: items };
        });
    };

    const addToArrayField = <T,>(field: keyof UnitConfig, newItem: T) => {
        setEditedUnit(prev => ({ ...prev, [field]: [...((prev[field] as T[] | undefined) || []), newItem] }));
    };
    
    const removeFromArrayField = (field: keyof UnitConfig, index: number) => {
        setEditedUnit(prev => ({ ...prev, [field]: ((prev[field] as any[] | undefined) || []).filter((_, i) => i !== index) }));
    };

    return (
        <div className="bg-stone-dark/40 p-4 rounded-lg border-2 border-brand-gold my-4 space-y-4 animate-in fade-in-50">
            <h3 className="text-xl font-bold text-brand-gold font-serif">Editing: {unit.name}</h3>

            <Tabs defaultValue="general">
                 <TabsList className="grid w-full grid-cols-5 bg-stone-dark/80 border border-stone-light/20">
                    <TabsTrigger value="general">General &amp; Combat</TabsTrigger>
                    <TabsTrigger value="mobility">Mobility</TabsTrigger>
                    <TabsTrigger value="economy">Cost &amp; Training</TabsTrigger>
                    <TabsTrigger value="bonuses">Bonuses &amp; Armor</TabsTrigger>
                    <TabsTrigger value="upgrades">Upgrades &amp; Tech</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="pt-4">
                     <Card className="bg-stone-dark/20 border-stone-light/20">
                        <CardHeader><CardTitle className="text-base font-serif">Core Attributes</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label>Name</Label><Input type="text" value={editedUnit.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Unit Name" className="sci-fi-input" /></div>
                                <div><Label>Icon</Label><Select value={editedUnit.iconId} onValueChange={(val) => handleInputChange('iconId', val)}><SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(unitIconMap).map(iconId => <SelectItem key={iconId} value={iconId}>{iconId}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <div><Label>Description</Label><Textarea value={editedUnit.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Description" className="sci-fi-input" /></div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                                <div><Label>HP</Label><Input type="number" value={editedUnit.hp || ''} onChange={(e) => handleNumberChange('hp', e.target.value)} className="sci-fi-input" /></div>
                                <div><Label>Base Attack</Label><Input type="number" value={editedUnit.attack || ''} onChange={(e) => handleNumberChange('attack', e.target.value)} className="sci-fi-input" /></div>
                                <div><Label>Attack Rate (/s)</Label><Input type="number" value={editedUnit.attackRate || ''} step="0.1" onChange={(e) => handleFloatChange('attackRate', e.target.value)} className="sci-fi-input" /></div>
                                <div><Label>Attack Range</Label><Input type="number" value={editedUnit.attackRange || ''} onChange={(e) => handleNumberChange('attackRange', e.target.value)} className="sci-fi-input" /></div>
                                <div><Label>Armor Penetration (%)</Label><Input type="number" value={editedUnit.armorPenetration || ''} onChange={(e) => handleNumberChange('armorPenetration', e.target.value)} className="sci-fi-input" /></div>
                                <div><Label>Crit Chance (%)</Label><Input type="number" value={editedUnit.criticalChance || ''} onChange={(e) => handleNumberChange('criticalChance', e.target.value)} className="sci-fi-input" /></div>
                                <div><Label>Unit Type</Label><Select value={editedUnit.unitType} onValueChange={(v) => handleInputChange('unitType', v)}><SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger><SelectContent>{unitClassifications.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                 <TabsContent value="mobility" className="pt-4">
                     <Card className="bg-stone-dark/20 border-stone-light/20">
                        <CardHeader><CardTitle className="text-base font-serif">Movement &amp; Terrain</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div><Label>Movement Speed</Label><Input type="number" value={editedUnit.movementSpeed || ''} step="0.1" onChange={(e) => handleFloatChange('movementSpeed', e.target.value)} className="sci-fi-input" /></div>
                                     <div><Label>Stamina</Label><Input type="number" value={editedUnit.stamina || ''} onChange={(e) => handleNumberChange('stamina', e.target.value)} className="sci-fi-input" /></div>
                                </div>
                             </div>
                             <div>
                                <Label>Terrain Modifiers</Label>
                                <div className="space-y-2 mt-1 border border-stone-light/20 p-2 rounded-md bg-black/20">
                                    {(editedUnit.terrainModifiers || []).map((mod, index) => (
                                         <div key={index} className="flex items-center gap-2">
                                             <Select value={mod.terrainType} onValueChange={(val) => handleArrayFieldChange<TerrainModifier>('terrainModifiers', index, 'terrainType', val)}>
                                                <SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger>
                                                <SelectContent>{terrainTypeOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                            </Select>
                                            <Input type="number" value={mod.speedBonus} onChange={(e) => handleArrayFieldChange<TerrainModifier>('terrainModifiers', index, 'speedBonus', parseInt(e.target.value, 10))} className="sci-fi-input w-28" placeholder="Speed %" />
                                            <Button variant="ghost" size="icon" className="text-brand-red w-8 h-8" onClick={() => removeFromArrayField('terrainModifiers', index)}><Trash2 className="w-4 h-4"/></Button>
                                         </div>
                                    ))}
                                    <Button onClick={() => addToArrayField<TerrainModifier>('terrainModifiers', { terrainType: 'forest', speedBonus: -10})} variant="outline" className="w-full sci-fi-button !text-xs !py-1">Add Terrain Modifier</Button>
                                </div>
                             </div>
                        </CardContent>
                     </Card>
                 </TabsContent>

                <TabsContent value="economy" className="pt-4">
                     <Card className="bg-stone-dark/20 border-stone-light/20">
                        <CardHeader><CardTitle className="text-base font-serif">Economic Attributes</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <Label>Training Cost</Label>
                                    <div className={`grid grid-cols-2 sm:grid-cols-${activeResources.length || 1} gap-2 border border-stone-light/20 p-2 rounded-md bg-black/20 mt-1`}>
                                        {activeResources.map(res => (<div key={res.id}><Label className="capitalize text-xs">{res.name}</Label><Input type="number" value={editedUnit.cost?.[res.id] || ''} onChange={(e) => handleCostChange(res.id, e.target.value)} placeholder="0" className="sci-fi-input w-full" /></div>))}
                                    </div>
                                </div>
                                <div>
                                    <Label>Maintenance Cost (per min)</Label>
                                    <div className={`grid grid-cols-2 sm:grid-cols-${activeResources.length || 1} gap-2 border border-stone-light/20 p-2 rounded-md bg-black/20 mt-1`}>
                                        {activeResources.map(res => (<div key={res.id}><Label className="capitalize text-xs">{res.name}</Label><Input type="number" value={editedUnit.maintenanceCost?.[res.id] || ''} onChange={(e) => setEditedUnit(p => ({...p, maintenanceCost: {...p.maintenanceCost, [res.id]: parseInt(e.target.value, 10) || 0}}))} placeholder="0" className="sci-fi-input w-full" /></div>))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div><Label>Train Time (s)</Label><Input type="number" value={editedUnit.trainTime || ''} onChange={(e) => handleNumberChange('trainTime', e.target.value)} className="sci-fi-input" /></div>
                                <div><Label>Population Cost</Label><Input type="number" value={editedUnit.populationCost || ''} onChange={(e) => handleNumberChange('populationCost', e.target.value)} className="sci-fi-input" /></div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="bonuses" className="pt-4">
                     <Card className="bg-stone-dark/20 border-stone-light/20">
                        <CardHeader><CardTitle className="text-base font-serif">Combat Roles &amp; Bonuses</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <Label>Attack Bonuses (vs Unit Types)</Label>
                                <div className="space-y-2 mt-1 border border-stone-light/20 p-2 rounded-md bg-black/20">
                                    {(editedUnit.attackBonuses || []).map((bonus, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Select value={bonus.targetType} onValueChange={(val) => handleArrayFieldChange<AttackBonus>('attackBonuses', index, 'targetType', val)}>
                                                <SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger>
                                                <SelectContent>{unitClassifications.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                            </Select>
                                            <Input type="number" value={bonus.bonus} onChange={(e) => handleArrayFieldChange<AttackBonus>('attackBonuses', index, 'bonus', parseInt(e.target.value))} className="sci-fi-input w-28" placeholder="+DMG" />
                                            <Button variant="ghost" size="icon" className="text-brand-red w-8 h-8" onClick={() => removeFromArrayField('attackBonuses', index)}><Trash2 className="w-4 h-4"/></Button>
                                        </div>
                                    ))}
                                    <Button onClick={() => addToArrayField<AttackBonus>('attackBonuses', { targetType: 'infantry', bonus: 0 })} variant="outline" className="w-full sci-fi-button !text-xs !py-1">Add Attack Bonus</Button>
                                </div>
                             </div>
                              <div>
                                <Label>Armor Values</Label>
                                <div className="space-y-2 mt-1 border border-stone-light/20 p-2 rounded-md bg-black/20">
                                   {(editedUnit.armorValues || []).map((armor, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Select value={armor.type} onValueChange={(val) => handleArrayFieldChange<ArmorValue>('armorValues', index, 'type', val)}>
                                                <SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger>
                                                <SelectContent>{armorClassifications.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                            </Select>
                                            <Input type="number" value={armor.value} onChange={(e) => handleArrayFieldChange<ArmorValue>('armorValues', index, 'value', parseInt(e.target.value))} className="sci-fi-input w-28" placeholder="Value" />
                                            <Button variant="ghost" size="icon" className="text-brand-red w-8 h-8" onClick={() => removeFromArrayField('armorValues', index)}><Trash2 className="w-4 h-4"/></Button>
                                        </div>
                                    ))}
                                    <Button onClick={() => addToArrayField<ArmorValue>('armorValues', { type: 'melee', value: 0 })} variant="outline" className="w-full sci-fi-button !text-xs !py-1">Add Armor Value</Button>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                 <TabsContent value="upgrades" className="pt-4">
                     <Card className="bg-stone-dark/20 border-stone-light/20">
                        <CardHeader><CardTitle className="text-base font-serif">Progression &amp; Unlocks</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Required Training Building</Label>
                                    <Select value={editedUnit.requiredBuilding} onValueChange={(val) => handleInputChange('requiredBuilding', val)}>
                                        <SelectTrigger className="sci-fi-input" disabled={trainingBuildings.length === 0}><SelectValue /></SelectTrigger>
                                        <SelectContent>{trainingBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Additional Required Buildings (Prerequisites)</Label>
                                    <Input type="text" value={(editedUnit.requiredBuildingIds || []).join(',')} onChange={(e) => handleInputChange('requiredBuildingIds', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} className="sci-fi-input" placeholder="barracks,blacksmith" />
                                </div>
                                <div><Label>Required Research IDs (Prerequisites)</Label><Input type="text" value={(editedUnit.prerequisites || []).join(',')} onChange={(e) => handleInputChange('prerequisites', e.target.value.split(',').map(s => s.trim()))} placeholder="tech_armor_1" className="sci-fi-input" /></div>
                            </div>
                            <div className="flex items-center gap-2 pt-2"><Switch id="edit-unit-isUpgradeOnly" checked={!!editedUnit.isUpgradeOnly} onCheckedChange={(c) => handleInputChange('isUpgradeOnly', c)} /><Label htmlFor="edit-unit-isUpgradeOnly">Upgrade Only (Cannot be trained directly)</Label></div>
                            <hr className="border-stone-light/20"/>
                            <div>
                                <Label>Tree ID</Label>
                                <div className="flex items-center gap-2">
                                    <Input type="text" value={editedUnit.treeId || ''} onChange={(e) => handleInputChange('treeId', e.target.value)} className="sci-fi-input" />
                                    <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(editedUnit.treeId || '')} title="Copy Tree ID"><Copy className="w-4 h-4"/></Button>
                                    <Button variant="outline" size="icon" onClick={() => handleInputChange('treeId', `utree-${Date.now()}`)} title="Generate New Tree ID"><RefreshCw className="w-4 h-4"/></Button>
                                </div>
                            </div>
                            <div>
                                <Label>Upgrade Paths</Label>
                                <div className="space-y-2 mt-1 border border-stone-light/20 p-2 rounded-md bg-black/20">
                                   {(editedUnit.upgradesTo || []).map((path, index) => (
                                        <div key={index} className="p-2 border border-stone-light/10 rounded-md">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-bold text-brand-gold">Path #{index+1}</Label>
                                                <Button variant="ghost" size="icon" className="text-brand-red w-8 h-8" onClick={() => removeFromArrayField('upgradesTo', index)}><Trash2 className="w-4 h-4"/></Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Target Unit</Label>
                                                    <Select value={path.targetUnitId} onValueChange={(val) => handleArrayFieldChange<UnitUpgradePath>('upgradesTo', index, 'targetUnitId', val)}>
                                                        <SelectTrigger className="sci-fi-input"><SelectValue placeholder="Select unit..."/></SelectTrigger>
                                                        <SelectContent>
                                                            {allUnits.filter(u => u.treeId === editedUnit.treeId && u.id !== editedUnit.id).map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                 <div>
                                                     <Label>Upgrade Time (s)</Label>
                                                     <Input type="number" value={path.time} onChange={(e) => handleArrayFieldChange<UnitUpgradePath>('upgradesTo', index, 'time', parseInt(e.target.value))} className="sci-fi-input" />
                                                 </div>
                                            </div>
                                            <div>
                                                <Label className="text-xs">Upgrade Cost</Label>
                                                 <div className={`grid grid-cols-${activeResources.length || 1} gap-2 mt-1`}>
                                                    {activeResources.map(res => (
                                                        <Input key={res.id} type="number" value={path.cost?.[res.id] || ''} onChange={(e) => {
                                                            const newCost = {...path.cost, [res.id]: parseInt(e.target.value) || 0};
                                                            handleArrayFieldChange<UnitUpgradePath>('upgradesTo', index, 'cost', newCost);
                                                        }} placeholder={res.name} className="sci-fi-input" />
                                                    ))}
                                                 </div>
                                            </div>
                                        </div>
                                   ))}
                                    <Button onClick={() => addToArrayField<UnitUpgradePath>('upgradesTo', { targetUnitId: '', cost: {}, time: 30 })} variant="outline" className="w-full sci-fi-button !text-xs !py-1">Add Upgrade Path</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                 </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={onCancel} className="text-brand-red hover:bg-brand-red/10"><XCircle className="w-4 h-4 mr-2"/>Cancel</Button>
                <Button onClick={() => onSave(editedUnit)} className="bg-brand-green hover:bg-brand-green/80" disabled={!editedUnit.requiredBuilding}><Save className="w-4 h-4 mr-2"/>Save Changes</Button>
            </div>
        </div>
    );
};

const ResourceEditor: React.FC<{
    resource: ResourceConfig;
    onSave: (resource: ResourceConfig) => void;
    onCancel: () => void;
    allBuildings: BuildingConfig[];
}> = ({ resource, onSave, onCancel, allBuildings }) => {
    const [editedResource, setEditedResource] = useState<ResourceConfig>(resource);
    const rarityOptions: ResourceRarity[] = ['Abundant', 'Common', 'Uncommon', 'Rare', 'Strategic'];

    const handleInputChange = (field: keyof ResourceConfig, value: any) => {
        setEditedResource(prev => ({ ...prev, [field]: value }));
    };

    const handleNumberChange = (field: keyof ResourceConfig, value: string) => {
        setEditedResource(prev => ({ ...prev, [field]: value === '' ? 0 : parseInt(value, 10) || 0 }));
    };

    return (
        <div className="bg-stone-dark/40 p-4 rounded-lg border-2 border-brand-gold my-4 space-y-4 animate-in fade-in-50">
            <h3 className="text-xl font-bold text-brand-gold font-serif">Editing: {resource.name}</h3>

            <Card className="bg-stone-dark/20 border-stone-light/20">
                <CardHeader><CardTitle className="text-base font-serif">Core Attributes</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><Label>Name</Label><Input type="text" value={editedResource.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Resource Name" className="sci-fi-input" /></div>
                        <div><Label>ID</Label><Input type="text" value={editedResource.id} disabled placeholder="e.g., crystal" className="sci-fi-input disabled:opacity-70" /></div>
                        <div><Label>Icon</Label><Select value={editedResource.iconId} onValueChange={(val) => handleInputChange('iconId', val)}><SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(resourceIconMap).map(iconId => <SelectItem key={iconId} value={iconId}>{iconId}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div><Label>Description</Label><Textarea value={editedResource.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Description" className="sci-fi-input" /></div>
                </CardContent>
            </Card>

            <Card className="bg-stone-dark/20 border-stone-light/20">
                <CardHeader><CardTitle className="text-base font-serif">Economy &amp; Spawning</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div><Label>Rarity</Label><Select value={editedResource.rarity} onValueChange={(val) => handleInputChange('rarity', val)}><SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger><SelectContent>{rarityOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Initial Amount</Label><Input type="number" value={editedResource.initialAmount} onChange={(e) => handleNumberChange('initialAmount', e.target.value)} className="sci-fi-input" /></div>
                    <div><Label>Base Gather Rate/s</Label><Input type="number" value={editedResource.baseGatherRate} onChange={(e) => handleNumberChange('baseGatherRate', e.target.value)} className="sci-fi-input" /></div>
                    <div className="flex items-center gap-2 pt-4"><Switch id="edit-spawnInSafeZone" checked={!!editedResource.spawnInSafeZone} onCheckedChange={(c) => handleInputChange('spawnInSafeZone', c)} /><Label htmlFor="edit-spawnInSafeZone">Spawns in Safe Zone</Label></div>
                    <div className="flex items-center gap-2 pt-4"><Switch id="edit-isTradable" checked={!!editedResource.isTradable} onCheckedChange={(c) => handleInputChange('isTradable', c)} /><Label htmlFor="edit-isTradable">Is Tradable</Label></div>
                </CardContent>
            </Card>

            <Card className="bg-stone-dark/20 border-stone-light/20">
                <CardHeader><CardTitle className="text-base font-serif">Advanced Mechanics</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 pt-4"><Switch id="edit-decays" checked={!!editedResource.decaysOverTime} onCheckedChange={(c) => handleInputChange('decaysOverTime', c)} /><Label htmlFor="edit-decays">Decays Over Time</Label></div>
                    {editedResource.decaysOverTime && <div><Label>Decay Rate (%/min)</Label><Input type="number" value={editedResource.decayRate || ''} onChange={(e) => handleNumberChange('decayRate', e.target.value)} placeholder="0" className="sci-fi-input" /></div>}
                     <div>
                        <Label>Storage Building</Label>
                        <Select value={editedResource.storageBuildingId || 'none'} onValueChange={(val) => handleInputChange('storageBuildingId', val === 'none' ? undefined : val)}>
                            <SelectTrigger className="sci-fi-input"><SelectValue placeholder="None" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">None</SelectItem>{allBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <p className="text-xs text-parchment-dark mt-1">If set, this building type increases max capacity for this resource.</p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={onCancel} className="text-brand-red hover:bg-brand-red/10"><XCircle className="w-4 h-4 mr-2"/>Cancel</Button>
                <Button onClick={() => onSave(editedResource)} className="bg-brand-green hover:bg-brand-green/80"><Save className="w-4 h-4 mr-2"/>Save Changes</Button>
            </div>
        </div>
    );
};

const ResearchEditor: React.FC<{
    research: ResearchConfig;
    onSave: (research: ResearchConfig) => void;
    onCancel: () => void;
    allBuildings: BuildingConfig[];
    allAges: AgeConfig[];
    allResearch: ResearchConfig[];
    allResources: ResourceConfig[];
}> = ({ research, onSave, onCancel, allBuildings, allAges, allResearch, allResources }) => {
    const [editedResearch, setEditedResearch] = useState<ResearchConfig>(research);

    const handleInputChange = (field: keyof ResearchConfig, value: any) => {
        setEditedResearch(prev => ({ ...prev, [field]: value }));
    };
    const handleNumberChange = (field: keyof ResearchConfig, value: string) => {
        setEditedResearch(prev => ({ ...prev, [field]: value === '' ? 0 : parseInt(value, 10) || 0 }));
    };
    const handleCostChange = (resource: string, value: string) => {
        const amount = parseInt(value, 10) || 0;
        setEditedResearch(prev => ({ ...prev, cost: { ...prev.cost, [resource]: amount } }));
    };

    const researchBuildings = allBuildings.filter(b => b.canResearch);
    const activeResources = allResources.filter(r => r.isActive);
    
    return (
        <div className="bg-stone-dark/40 p-4 rounded-lg border-2 border-brand-gold my-4 space-y-4 animate-in fade-in-50">
            <h3 className="text-xl font-bold text-brand-gold font-serif">Editing: {research.name}</h3>

            <Card className="bg-stone-dark/20 border-stone-light/20">
                <CardHeader><CardTitle className="text-base font-serif">Core Attributes</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Name</Label><Input type="text" value={editedResearch.name} onChange={(e) => handleInputChange('name', e.target.value)} className="sci-fi-input" /></div>
                        <div><Label>Icon</Label><Select value={editedResearch.iconId} onValueChange={(val) => handleInputChange('iconId', val)}><SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(researchIconMap).map(iconId => <SelectItem key={iconId} value={iconId}>{iconId}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                     <div><Label>Description</Label><Textarea value={editedResearch.description} onChange={(e) => handleInputChange('description', e.target.value)} className="sci-fi-input" /></div>
                </CardContent>
            </Card>

             <Card className="bg-stone-dark/20 border-stone-light/20">
                <CardHeader><CardTitle className="text-base font-serif">Requirements &amp; Cost</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><Label>Research Building</Label><Select value={editedResearch.requiredBuildingId} onValueChange={(val) => handleInputChange('requiredBuildingId', val)}><SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger><SelectContent>{researchBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Age Requirement</Label><Select value={editedResearch.ageRequirement} onValueChange={(val) => handleInputChange('ageRequirement', val)}><SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger><SelectContent>{allAges.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Research Time (s)</Label><Input type="number" value={editedResearch.researchTime} onChange={(e) => handleNumberChange('researchTime', e.target.value)} className="sci-fi-input" /></div>
                    </div>
                     <div>
                        <Label>Prerequisite Research (multi-select)</Label>
                        <ScrollArea className="h-24 w-full rounded-md border border-stone-light/20 p-2 bg-black/20">
                            <div className="space-y-1">
                            {allResearch.filter(r => r.id !== editedResearch.id).map(req => (
                                <div key={req.id} className="flex items-center gap-2">
                                <Checkbox
                                    id={`req-${req.id}`}
                                    checked={(editedResearch.prerequisites || []).includes(req.id)}
                                    onCheckedChange={(checked) => {
                                        const currentReqs = editedResearch.prerequisites || [];
                                        const newReqs = checked ? [...currentReqs, req.id] : currentReqs.filter(id => id !== req.id);
                                        handleInputChange('prerequisites', newReqs);
                                    }}
                                />
                                <label htmlFor={`req-${req.id}`} className="text-sm">{req.name}</label>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    </div>
                    <div>
                         <Label>Research Cost</Label>
                        <div className={`grid grid-cols-2 sm:grid-cols-${activeResources.length || 1} gap-2 border border-stone-light/20 p-2 rounded-md bg-black/20 mt-1`}>
                            {activeResources.map(res => (<div key={res.id}><Label className="capitalize text-xs">{res.name}</Label><Input type="number" value={editedResearch.cost?.[res.id] || ''} onChange={(e) => handleCostChange(res.id, e.target.value)} placeholder="0" className="sci-fi-input w-full" /></div>))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Effects editor could go here, but is very complex. Leaving as a placeholder for now. */}

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={onCancel} className="text-brand-red hover:bg-brand-red/10"><XCircle className="w-4 h-4 mr-2"/>Cancel</Button>
                <Button onClick={() => onSave(editedResearch)} className="bg-brand-green hover:bg-brand-green/80"><Save className="w-4 h-4 mr-2"/>Save Changes</Button>
            </div>
        </div>
    );
};


const AdminPage: React.FC = () => {
    // Ages State
    const [ages, setAges] = useState<AgeConfig[]>([]);
    const [newAgeName, setNewAgeName] = useState('');
    const [newAgeDescription, setNewAgeDescription] = useState('');
    const [isAgesLoading, setIsAgesLoading] = useState(true);

    // Buildings State
    const [buildings, setBuildings] = useState<BuildingConfig[]>([]);
    const [isBuildingsLoading, setIsBuildingsLoading] = useState(true);

    // Units State
    const [units, setUnits] = useState<UnitConfig[]>([]);
    const [isUnitsLoading, setIsUnitsLoading] = useState(true);
    
    // Resources State
    const [resources, setResources] = useState<ResourceConfig[]>([]);
    const [isResourcesLoading, setIsResourcesLoading] = useState(true);
    
    // Research State
    const [research, setResearch] = useState<ResearchConfig[]>([]);
    const [isResearchLoading, setIsResearchLoading] = useState(true);
    
    // States for editing forms
    const [editingBuilding, setEditingBuilding] = useState<BuildingConfig | null>(null);
    const [editingUnit, setEditingUnit] = useState<UnitConfig | null>(null);
    const [editingResource, setEditingResource] = useState<ResourceConfig | null>(null);
    const [editingResearch, setEditingResearch] = useState<ResearchConfig | null>(null);

    // States for deletion confirmation dialogs
    const [resourceToDelete, setResourceToDelete] = useState<ResourceConfig | null>(null);
    const [ageToDelete, setAgeToDelete] = useState<AgeConfig | null>(null);
    const [buildingToDelete, setBuildingToDelete] = useState<BuildingConfig | null>(null);
    const [unitToDelete, setUnitToDelete] = useState<UnitConfig | null>(null);
    const [researchToDelete, setResearchToDelete] = useState<ResearchConfig | null>(null);
    
    const [activeTab, setActiveTab] = useState('ages');
    const [dependencyError, setDependencyError] = useState<{ message: string; targetTab: string; } | null>(null);


    // --- Data Fetching and Seeding ---
    const loadAllData = useCallback(async () => {
        // This function will now be responsible for fetching all data types
        // to ensure dependent operations have the data they need.
        setIsAgesLoading(true);
        setIsBuildingsLoading(true);
        setIsUnitsLoading(true);
        setIsResourcesLoading(true);
        setIsResearchLoading(true);

        // Fetch all configs in parallel
        const [
            allAgeConfigs,
            allBuildingConfigs,
            allUnitConfigs,
            allResourceConfigs,
            allResearchConfigs
        ] = await Promise.all([
            getAllAgeConfigs(),
            getAllBuildingConfigs(),
            getAllUnitConfigs(),
            getAllResourceConfigs(),
            getAllResearchConfigs()
        ]);

        // Seed initial data if necessary
        const defaultAge = allAgeConfigs[0]?.name || INITIAL_AGES[0].name;

        const ageMap = new Map(allAgeConfigs.map(item => [item.id, item]));
        let agesNeedUpdate = false;
        for (const [index, pItem] of INITIAL_AGES.entries()) {
            const existingItem = ageMap.get(pItem.name);
            const newItem: AgeConfig = { ...(existingItem || {}), ...pItem, id: pItem.name, isPredefined: true, isActive: existingItem?.isActive ?? true, order: existingItem?.order ?? index };
            if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                await saveAgeConfig(newItem);
                agesNeedUpdate = true;
            }
        }
        if (agesNeedUpdate) setAges(await getAllAgeConfigs());
        else setAges(allAgeConfigs);
        setIsAgesLoading(false);

        const buildingMap = new Map(allBuildingConfigs.map(item => [item.id, item]));
        let buildingsNeedUpdate = false;
        for (const [index, pItem] of INITIAL_BUILDINGS.entries()) {
            const existingItem = buildingMap.get(pItem.id);
             const newItem: BuildingConfig = {
                ...(pItem as any), // Base predefined values
                ...(existingItem || {}), // Overwrite with saved values
                id: pItem.id,
                isPredefined: true,
                unlockedInAge: existingItem?.unlockedInAge || (pItem.id === 'townCenter' ? INITIAL_AGES[0].name : defaultAge),
                isActive: existingItem?.isActive ?? true,
                order: existingItem?.order ?? index,
                treeId: existingItem?.treeId || `tree-predefined-${pItem.id}`,
                populationCapacity: existingItem?.populationCapacity ?? pItem.populationCapacity,
                generatesResource: existingItem?.generatesResource ?? pItem.generatesResource,
                generationRate: existingItem?.generationRate ?? pItem.generationRate,
                maintenanceCost: existingItem?.maintenanceCost ?? pItem.maintenanceCost,
            };
            if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                await saveBuildingConfig(newItem);
                buildingsNeedUpdate = true;
            }
        }
        if (buildingsNeedUpdate) setBuildings(await getAllBuildingConfigs());
        else setBuildings(allBuildingConfigs);
        setIsBuildingsLoading(false);

        const unitMap = new Map(allUnitConfigs.map(item => [item.id, item]));
        let unitsNeedUpdate = false;
        const initialUnitsWithIds = INITIAL_UNITS.map(u => ({ ...u, id: u.name.toLowerCase().replace(/\s/g, '') }));
        for (const [index, pItem] of initialUnitsWithIds.entries()) {
            const existingItem = unitMap.get(pItem.id);
            const newItem: UnitConfig = {
                ...(pItem as any), // Base predefined values
                ...(existingItem || {}), // Overwrite with saved values
                id: pItem.id,
                isPredefined: true,
                isActive: existingItem?.isActive ?? true,
                order: existingItem?.order ?? index,
                treeId: existingItem?.treeId || `utree-predefined-${pItem.id}`,
                populationCost: existingItem?.populationCost ?? pItem.populationCost,
            };
            if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                await saveUnitConfig(newItem);
                unitsNeedUpdate = true;
            }
        }
        if (unitsNeedUpdate) setUnits(await getAllUnitConfigs());
        else setUnits(allUnitConfigs);
        setIsUnitsLoading(false);
        
        const resourceMap = new Map(allResourceConfigs.map(item => [item.id, item]));
        let resourcesNeedUpdate = false;
        for (const [index, pItem] of INITIAL_RESOURCES.entries()) {
            const existingItem = resourceMap.get(pItem.id);
            const newItem: ResourceConfig = { ...(pItem as any), ...(existingItem || {}), id: pItem.id, isPredefined: true, isActive: existingItem?.isActive ?? true, order: existingItem?.order ?? index };
            if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                await saveResourceConfig(newItem);
                resourcesNeedUpdate = true;
            }
        }
        if (resourcesNeedUpdate) setResources(await getAllResourceConfigs());
        else setResources(allResourceConfigs);
        setIsResourcesLoading(false);

        const researchMap = new Map(allResearchConfigs.map(item => [item.id, item]));
        let researchNeedUpdate = false;
        for (const [index, pItem] of INITIAL_RESEARCH.entries()) {
            const id = pItem.name.toLowerCase().replace(/\s/g, '_');
            const existingItem = researchMap.get(id);
            const newItem: ResearchConfig = {
                ...(pItem as any),
                ...(existingItem || {} as ResearchConfig),
                id,
                isPredefined: true,
                isActive: existingItem?.isActive ?? true,
                order: existingItem?.order ?? index,
                ageRequirement: existingItem?.ageRequirement || defaultAge,
                requiredBuildingId: existingItem?.requiredBuildingId || 'blacksmith',
            };
            if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                await saveResearchConfig(newItem);
                researchNeedUpdate = true;
            }
        }
        if (researchNeedUpdate) setResearch(await getAllResearchConfigs());
        else setResearch(allResearchConfigs);
        setIsResearchLoading(false);

    }, []);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);
    

    // --- Ages Handlers ---
    const handleAddAge = async () => {
        if (!newAgeName.trim() || !newAgeDescription.trim()) return;
        const newAge: AgeConfig = { id: `custom-${Date.now()}`, name: newAgeName, description: newAgeDescription, isActive: true, isPredefined: false, order: ages.length > 0 ? Math.max(...ages.map(a => a.order)) + 1 : 0, };
        await saveAgeConfig(newAge);
        setNewAgeName(''); setNewAgeDescription(''); await loadAllData();
    };
    const handleDeleteAge = (age: AgeConfig) => {
        const requiringBuilding = buildings.find(b => b.unlockedInAge === age.name);
        if (requiringBuilding) { 
            setDependencyError({
                message: `Cannot delete "${age.name}". The building "${requiringBuilding.name}" unlocks in this age. Please change the building's unlock age first.`,
                targetTab: 'buildings'
            });
            return;
        }
        setAgeToDelete(age);
    };
    const confirmDeleteAge = async () => {
        if (!ageToDelete) return;
        await deleteAgeConfig(ageToDelete.id);
        setAgeToDelete(null);
        await loadAllData();
    };
    const handleToggleAgeActive = async (age: AgeConfig) => { await saveAgeConfig({ ...age, isActive: !age.isActive }); await loadAllData(); };
    const handleMoveAge = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= ages.length) return;
        const reorderedAges = [...ages];
        const [movedItem] = reorderedAges.splice(index, 1);
        reorderedAges.splice(newIndex, 0, movedItem);
        const updatedAges = reorderedAges.map((age, i) => ({ ...age, order: i }));
        for (const age of updatedAges) { await saveAgeConfig(age); }
        await loadAllData();
    };

    // --- Buildings Handlers ---
     const handleShowAddBuilding = () => {
        const newBuilding: BuildingConfig = { id: `custom-bld-${Date.now()}`, treeId: `tree-${Date.now()}`, name: 'New Building', description: 'A new custom building.', cost: {}, isUnique: false, buildLimit: 0, buildTime: 30, hp: 1000, unlockedInAge: ages.find(a => a.isActive)?.name || 'Nomadic Age', iconId: 'default', isActive: true, isPredefined: false, order: buildings.length > 0 ? Math.max(...buildings.map(b => b.order)) + 1 : 0, canTrainUnits: false, };
        setEditingBuilding(newBuilding);
    };
    const handleDeleteBuilding = (building: BuildingConfig) => {
        if (buildings.some(b => b.upgradesTo?.some(u => u.id === building.id))) {
            setDependencyError({
                message: `Cannot delete "${building.name}". It is an upgrade target for another building. Check other buildings in the same tree first.`,
                targetTab: 'buildings'
            });
            return;
        }
        const requiringUnit = units.find(u => u.requiredBuilding === building.id || u.requiredBuildingIds?.includes(building.id));
        if (requiringUnit) {
            setDependencyError({
                message: `Cannot delete "${building.name}". The unit "${requiringUnit.name}" requires it. Please edit the unit's requirements first.`,
                targetTab: 'units'
            });
            return;
        }
        setBuildingToDelete(building);
    };
    const confirmDeleteBuilding = async () => {
        if (!buildingToDelete) return;
        await deleteBuildingConfig(buildingToDelete.id);
        setBuildingToDelete(null);
        await loadAllData();
    };
    const handleToggleBuildingActive = async (building: BuildingConfig) => { await saveBuildingConfig({ ...building, isActive: !building.isActive }); await loadAllData(); };
    const handleSaveBuilding = async (buildingToSave: BuildingConfig) => { await saveBuildingConfig(buildingToSave); setEditingBuilding(null); await loadAllData(); };

    // --- Units Handlers ---
     const handleShowAddUnit = () => {
        const trainingBuildings = buildings.filter(b => b.canTrainUnits && b.isActive);
        if (trainingBuildings.length === 0) { 
            setDependencyError({
                message: "Cannot create a new unit because no buildings are set to 'Can Train Units'. Please enable this on a building first.",
                targetTab: 'buildings'
            });
            return;
        }
        const newUnit: UnitConfig = { id: `custom-unit-${Date.now()}`, treeId: `utree-${Date.now()}`, name: 'New Unit', description: 'A new custom unit.', cost: {}, trainTime: 20, hp: 50, attack: 5, iconId: 'default', isActive: true, isPredefined: false, order: units.length > 0 ? Math.max(...units.map(u => u.order)) + 1 : 0, requiredBuilding: trainingBuildings[0].id, populationCost: 1, attackRate: 1, movementSpeed: 1, unitType: 'infantry', upgradesTo: [], armorValues: [], attackBonuses: [], damageTypes: [], terrainModifiers: [], requiredBuildingIds: [], prerequisites: [] };
        setEditingUnit(newUnit);
    };
     const handleSaveUnit = async (unitToSave: UnitConfig) => { await saveUnitConfig(unitToSave); setEditingUnit(null); await loadAllData(); };
    const handleDeleteUnit = (unit: UnitConfig) => {
        if (units.some(u => u.upgradesTo?.some(path => path.targetUnitId === unit.id))) {
            setDependencyError({
                message: `Cannot delete "${unit.name}". It is an upgrade target for another unit. Please modify the other unit's upgrade path first.`,
                targetTab: 'units'
            });
            return;
        }
        setUnitToDelete(unit);
    };
    const confirmDeleteUnit = async () => {
        if (!unitToDelete) return;
        await deleteUnitConfig(unitToDelete.id);
        setUnitToDelete(null);
        await loadAllData();
    };
     const handleToggleUnitActive = async (unit: UnitConfig) => { await saveUnitConfig({ ...unit, isActive: !unit.isActive }); await loadAllData(); };
     
    // --- Resources Handlers ---
    const handleShowAddResource = () => {
        const newId = `custom_res_${Date.now()}`;
        const newResource: ResourceConfig = { id: newId, name: 'New Resource', description: '', iconId: 'default', isActive: true, isPredefined: false, order: resources.length + 1, rarity: 'Common', initialAmount: 0, baseGatherRate: 5, spawnInSafeZone: false, isTradable: false, decaysOverTime: false };
        setEditingResource(newResource);
    };
    const handleSaveResource = async (resourceToSave: ResourceConfig) => { await saveResourceConfig(resourceToSave); setEditingResource(null); await loadAllData(); };
    const handleToggleResourceActive = async (resource: ResourceConfig) => { await saveResourceConfig({ ...resource, isActive: !resource.isActive }); await loadAllData(); };
    const handleDeleteResource = (resource: ResourceConfig) => {
        const usingItem = [...buildings, ...units, ...research].find(item => Object.keys(item.cost || {}).includes(resource.id));
        if (usingItem) {
            const itemType = buildings.includes(usingItem as any) ? 'buildings' : units.includes(usingItem as any) ? 'units' : 'research';
            setDependencyError({
                message: `Cannot delete "${resource.name}". It is used as a cost for "${usingItem.name}". Please remove the cost first.`,
                targetTab: itemType
            });
            return;
        }
        setResourceToDelete(resource);
    };
    const confirmDeleteResource = async () => {
        if (!resourceToDelete) return;
        await deleteResourceConfig(resourceToDelete.id);
        setResourceToDelete(null);
        await loadAllData();
    };


    // --- Research Handlers ---
    const handleShowAddResearch = () => {
        const researchBuildings = buildings.filter(b => b.canResearch && b.isActive);
        if (researchBuildings.length === 0) {
            setDependencyError({
                message: "Cannot create a new technology because no buildings are set to 'Can Research'. Please enable this on a building first.",
                targetTab: 'buildings'
            });
            return;
        }
        const newResearch: ResearchConfig = { id: `custom-tech-${Date.now()}`, name: 'New Technology', description: '', iconId: 'beaker', cost: {}, researchTime: 60, requiredBuildingId: researchBuildings[0].id, ageRequirement: ages[0]?.name || '', effects: [], prerequisites: [], isActive: true, isPredefined: false, order: research.length > 0 ? Math.max(...research.map(r => r.order)) + 1 : 0, treeId: 'custom_tree', treeName: 'Custom' };
        setEditingResearch(newResearch);
    };
    const handleSaveResearch = async (researchToSave: ResearchConfig) => { await saveResearchConfig(researchToSave); setEditingResearch(null); await loadAllData(); };
    const handleToggleResearchActive = async (researchItem: ResearchConfig) => { await saveResearchConfig({ ...researchItem, isActive: !researchItem.isActive }); await loadAllData(); };
    const handleDeleteResearch = (researchItem: ResearchConfig) => {
        if (research.some(r => r.prerequisites?.includes(researchItem.id))) {
            const requiringTech = research.find(r => r.prerequisites?.includes(researchItem.id));
            setDependencyError({
                message: `Cannot delete "${researchItem.name}". It is a prerequisite for "${requiringTech?.name}". Please remove it from the prerequisites first.`,
                targetTab: 'research'
            });
            return;
        }
        setResearchToDelete(researchItem);
    };
    const confirmDeleteResearch = async () => {
        if (!researchToDelete) return;
        await deleteResearchConfig(researchToDelete.id);
        setResearchToDelete(null);
        await loadAllData();
    };
    
    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light p-4 sm:p-8">
            <AlertDialog open={!!resourceToDelete} onOpenChange={(isOpen) => !isOpen && setResourceToDelete(null)}>
                <AlertDialogContent className="sci-fi-panel-popup sci-fi-grid">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-parchment-dark">
                            This action cannot be undone. This will permanently delete the
                            <span className="font-bold text-brand-gold"> {resourceToDelete?.name} </span>
                            resource from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setResourceToDelete(null)} className="sci-fi-button !text-base">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteResource} className="sci-fi-button !text-base bg-brand-red hover:bg-red-700/80">
                            Yes, delete resource
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!ageToDelete} onOpenChange={(isOpen) => !isOpen && setAgeToDelete(null)}>
                <AlertDialogContent className="sci-fi-panel-popup sci-fi-grid">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-parchment-dark">
                            Permanently delete the custom age <span className="font-bold text-brand-gold">{ageToDelete?.name}</span>? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAgeToDelete(null)} className="sci-fi-button !text-base">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteAge} className="sci-fi-button !text-base bg-brand-red hover:bg-red-700/80">Delete Age</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!buildingToDelete} onOpenChange={(isOpen) => !isOpen && setBuildingToDelete(null)}>
                <AlertDialogContent className="sci-fi-panel-popup sci-fi-grid">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-parchment-dark">
                             Permanently delete the building <span className="font-bold text-brand-gold">{buildingToDelete?.name}</span>? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setBuildingToDelete(null)} className="sci-fi-button !text-base">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteBuilding} className="sci-fi-button !text-base bg-brand-red hover:bg-red-700/80">Delete Building</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!unitToDelete} onOpenChange={(isOpen) => !isOpen && setUnitToDelete(null)}>
                <AlertDialogContent className="sci-fi-panel-popup sci-fi-grid">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-parchment-dark">
                             Permanently delete the unit <span className="font-bold text-brand-gold">{unitToDelete?.name}</span>? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUnitToDelete(null)} className="sci-fi-button !text-base">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteUnit} className="sci-fi-button !text-base bg-brand-red hover:bg-red-700/80">Delete Unit</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!researchToDelete} onOpenChange={(isOpen) => !isOpen && setResearchToDelete(null)}>
                <AlertDialogContent className="sci-fi-panel-popup sci-fi-grid">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-parchment-dark">
                             Permanently delete the technology <span className="font-bold text-brand-gold">{researchToDelete?.name}</span>? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setResearchToDelete(null)} className="sci-fi-button !text-base">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteResearch} className="sci-fi-button !text-base bg-brand-red hover:bg-red-700/80">Delete Technology</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             <AlertDialog open={!!dependencyError} onOpenChange={(isOpen) => !isOpen && setDependencyError(null)}>
                <AlertDialogContent className="sci-fi-panel-popup sci-fi-grid">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-brand-red">Deletion Blocked</AlertDialogTitle>
                        <AlertDialogDescription className="text-parchment-dark">
                            {dependencyError?.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDependencyError(null)} className="sci-fi-button !text-base">OK</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (dependencyError) {
                                setActiveTab(dependencyError.targetTab);
                            }
                            setDependencyError(null);
                        }} className="sci-fi-button !text-base bg-brand-blue hover:bg-brand-blue/80">
                            Go to {dependencyError?.targetTab && dependencyError.targetTab.charAt(0).toUpperCase() + dependencyError.targetTab.slice(1)}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="w-full max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-serif text-parchment-light">Admin Panel</h1>
                    <Link href="/" className="text-brand-blue hover:underline font-sans">Back to Game</Link>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-6 bg-stone-dark/80 border border-stone-light/20">
                        <TabsTrigger value="ages">Ages</TabsTrigger>
                        <TabsTrigger value="buildings">Buildings</TabsTrigger>
                        <TabsTrigger value="units">Units</TabsTrigger>
                        <TabsTrigger value="resources">Resources</TabsTrigger>
                        <TabsTrigger value="research">Research</TabsTrigger>
                        <TabsTrigger value="dge">Data Generator</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="ages" className="mt-6">
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <Card className="bg-stone-dark/30 border-stone-light/30">
                                    <CardHeader><CardTitle className="text-brand-gold">Manage Ages</CardTitle><CardDescription className="text-parchment-dark">Enable, disable, and reorder the Ages of your civilization.</CardDescription></CardHeader>
                                    <CardContent>
                                        {isAgesLoading ? <p>Loading ages...</p> : (
                                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                                {ages.map((age, index) => (
                                                    <div key={age.id} className="sci-fi-unit-row flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4 flex-grow">
                                                            <span className="font-serif text-2xl text-stone-light/80 w-6 text-center">{index + 1}.</span>
                                                            <div className="flex flex-col"><button onClick={() => handleMoveAge(index, 'up')} disabled={index === 0} className="disabled:opacity-20 hover:text-brand-gold"><ArrowUp className="w-4 h-4" /></button><button onClick={() => handleMoveAge(index, 'down')} disabled={index === ages.length - 1} className="disabled:opacity-20 hover:text-brand-gold"><ArrowDown className="w-4 h-4" /></button></div>
                                                            <div className="flex-grow"><h3 className="font-bold flex items-center gap-2">{age.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}{age.name}</h3><p className="text-sm text-parchment-dark">{age.description}</p></div>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="flex items-center space-x-2"><Label htmlFor={`active-age-${age.id}`} className="text-xs">Active</Label><Switch id={`active-age-${age.id}`} checked={age.isActive} onCheckedChange={() => handleToggleAgeActive(age)} /></div>
                                                            {!age.isPredefined && <button onClick={() => handleDeleteAge(age)} className="p-1 text-parchment-dark/60 hover:text-brand-red rounded-full disabled:text-parchment-dark/20 disabled:cursor-not-allowed"><Trash2 className="w-5 h-5" /></button>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                             <div>
                                <Card className="bg-stone-dark/30 border-stone-light/30">
                                    <CardHeader><CardTitle className="text-brand-gold">Add Custom Age</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <input type="text" value={newAgeName} onChange={(e) => setNewAgeName(e.target.value)} placeholder="New Age Name" className="sci-fi-input w-full !text-lg" />
                                        <textarea value={newAgeDescription} onChange={(e) => setNewAgeDescription(e.target.value)} placeholder="Description..." className="sci-fi-input w-full min-h-[80px] !text-base" rows={3} />
                                        <Button onClick={handleAddAge} className="sci-fi-button w-full !py-2 !text-lg"><PlusCircle className="mr-2"/>Add Custom Age</Button>
                                    </CardContent>
                                </Card>
                            </div>
                         </div>
                    </TabsContent>
                    
                    <TabsContent value="buildings" className="mt-6">
                        <Card className="bg-stone-dark/30 border-stone-light/30">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div><CardTitle className="text-brand-gold">Manage Buildings</CardTitle><CardDescription className="text-parchment-dark">Create, edit, activate, or delete buildings.</CardDescription></div>
                                <Button onClick={handleShowAddBuilding} disabled={!!editingBuilding}><PlusCircle className="mr-2"/> Add Building</Button>
                            </CardHeader>
                            <CardContent>
                                {isBuildingsLoading ? <p>Loading buildings...</p> : (
                                    <>
                                        {editingBuilding && <BuildingEditor building={editingBuilding} onSave={handleSaveBuilding} onCancel={() => setEditingBuilding(null)} allAges={ages.filter(a => a.isActive)} allBuildings={buildings} allResources={resources} />}
                                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 mt-4">
                                            {buildings.map((b) => (
                                                <div key={b.id} className="sci-fi-unit-row flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 flex-grow"><div className="flex-shrink-0 w-10 h-10 p-1.5 bg-black/20 rounded-md">{React.createElement(buildingIconMap[b.iconId] || buildingIconMap.default)}</div>
                                                        <div className="flex-grow"><h3 className="font-bold flex items-center gap-2">{b.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}{b.name}</h3><p className="text-xs text-parchment-dark">Unlocks in: {b.unlockedInAge}</p></div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center space-x-2"><Label htmlFor={`active-bld-${b.id}`} className="text-xs">Active</Label><Switch id={`active-bld-${b.id}`} checked={b.isActive} onCheckedChange={() => handleToggleBuildingActive(b)} /></div>
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingBuilding(b)} className="text-parchment-dark/70 hover:text-brand-blue" disabled={!!editingBuilding}><Edit className="w-4 h-4"/></Button>
                                                        {!b.isPredefined && <button onClick={() => handleDeleteBuilding(b)} className="p-1 text-parchment-dark/60 hover:text-brand-red rounded-full"><Trash2 className="w-5 h-5" /></button>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="units" className="mt-6">
                         <Card className="bg-stone-dark/30 border-stone-light/30">
                           <CardHeader className="flex flex-row items-center justify-between">
                                <div><CardTitle className="text-brand-gold">Manage Units</CardTitle><CardDescription className="text-parchment-dark">Create, edit, and manage all military units in the game.</CardDescription></div>
                                <Button onClick={handleShowAddUnit} disabled={!!editingUnit}><PlusCircle className="mr-2"/> Add Unit</Button>
                            </CardHeader>
                            <CardContent>
                                {isUnitsLoading ? <p>Loading units...</p> : (
                                    <>
                                        {editingUnit && <UnitEditor unit={editingUnit} onSave={handleSaveUnit} onCancel={() => setEditingUnit(null)} allBuildings={buildings.filter(b => b.isActive)} allUnits={units} allResources={resources}/>}
                                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 mt-4">
                                            {units.map((u) => (
                                                <div key={u.id} className="sci-fi-unit-row flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 flex-grow"><div className="flex-shrink-0 w-10 h-10 p-1.5 bg-black/20 rounded-md">{React.createElement(unitIconMap[u.iconId] || unitIconMap.default)}</div>
                                                        <div className="flex-grow"><h3 className="font-bold flex items-center gap-2">{u.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}{u.name}</h3><p className="text-xs text-parchment-dark">HP: {u.hp} | ATK: {u.attack}</p></div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center space-x-2"><Label htmlFor={`active-unit-${u.id}`} className="text-xs">Active</Label><Switch id={`active-unit-${u.id}`} checked={u.isActive} onCheckedChange={() => handleToggleUnitActive(u)} /></div>
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingUnit(u)} className="text-parchment-dark/70 hover:text-brand-blue" disabled={!!editingUnit}><Edit className="w-4 h-4"/></Button>
                                                        {!u.isPredefined && <button onClick={() => handleDeleteUnit(u)} className="p-1 text-parchment-dark/60 hover:text-brand-red rounded-full"><Trash2 className="w-5 h-5" /></button>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="resources" className="mt-6">
                        <Card className="bg-stone-dark/30 border-stone-light/30">
                           <CardHeader className="flex flex-row items-center justify-between">
                                <div><CardTitle className="text-brand-gold">Manage Resources</CardTitle><CardDescription className="text-parchment-dark">Define the core economic resources of your game.</CardDescription></div>
                                <Button onClick={handleShowAddResource} disabled={!!editingResource}><PlusCircle className="mr-2"/> Add Resource</Button>
                            </CardHeader>
                            <CardContent>
                                {isResourcesLoading ? <p>Loading resources...</p> : (
                                    <>
                                        {editingResource && <ResourceEditor resource={editingResource} onSave={handleSaveResource} onCancel={() => setEditingResource(null)} allBuildings={buildings} />}
                                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 mt-4">
                                            {resources.map((r) => (
                                                <div key={r.id} className="sci-fi-unit-row flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 flex-grow"><div className="flex-shrink-0 w-10 h-10 p-1.5 bg-black/20 rounded-md">{React.createElement(resourceIconMap[r.iconId] || resourceIconMap.default)}</div>
                                                        <div className="flex-grow"><h3 className="font-bold flex items-center gap-2">{r.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}{r.name}</h3><p className="text-xs text-parchment-dark">Rarity: {r.rarity}</p></div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center space-x-2"><Label htmlFor={`active-res-${r.id}`} className="text-xs">Active</Label><Switch id={`active-res-${r.id}`} checked={r.isActive} onCheckedChange={() => handleToggleResourceActive(r)} /></div>
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingResource(r)} className="text-parchment-dark/70 hover:text-brand-blue" disabled={!!editingResource}><Edit className="w-4 h-4"/></Button>
                                                        {!r.isPredefined && <button onClick={() => handleDeleteResource(r)} className="p-1 text-parchment-dark/60 hover:text-brand-red rounded-full"><Trash2 className="w-5 h-5" /></button>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="research" className="mt-6">
                        <Card className="bg-stone-dark/30 border-stone-light/30">
                           <CardHeader className="flex flex-row items-center justify-between">
                                <div><CardTitle className="text-brand-gold">Manage Research</CardTitle><CardDescription className="text-parchment-dark">Create and configure the technology tree for your civilization.</CardDescription></div>
                                <Button onClick={handleShowAddResearch} disabled={!!editingResearch}><PlusCircle className="mr-2"/> Add Technology</Button>
                            </CardHeader>
                             <CardContent>
                                {isResearchLoading ? <p>Loading research...</p> : (
                                    <>
                                        {editingResearch && <ResearchEditor research={editingResearch} onSave={handleSaveResearch} onCancel={() => setEditingResearch(null)} allBuildings={buildings} allAges={ages} allResearch={research} allResources={resources} />}
                                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 mt-4">
                                            {research.map((r) => (
                                                <div key={r.id} className="sci-fi-unit-row flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 flex-grow">
                                                        <div className="flex-shrink-0 w-10 h-10 p-1.5 bg-black/20 rounded-md">
                                                            {React.createElement(researchIconMap[r.iconId] || researchIconMap.default)}
                                                        </div>
                                                        <div className="flex-grow"><h3 className="font-bold flex items-center gap-2">{r.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}{r.name}</h3><p className="text-xs text-parchment-dark">Requires: {buildings.find(b=>b.id===r.requiredBuildingId)?.name || 'N/A'}</p></div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center space-x-2"><Label htmlFor={`active-tech-${r.id}`} className="text-xs">Active</Label><Switch id={`active-tech-${r.id}`} checked={r.isActive} onCheckedChange={() => handleToggleResearchActive(r)} /></div>
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingResearch(r)} className="text-parchment-dark/70 hover:text-brand-blue" disabled={!!editingResearch}><Edit className="w-4 h-4"/></Button>
                                                        {!r.isPredefined && <button onClick={() => handleDeleteResearch(r)} className="p-1 text-parchment-dark/60 hover:text-brand-red rounded-full"><Trash2 className="w-5 h-5" /></button>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                     <TabsContent value="dge" className="mt-6">
                        <DataGenerator
                           resources={resources}
                           ages={ages}
                           research={research}
                           onGenerationComplete={loadAllData}
                        />
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
};

export default AdminPage;
