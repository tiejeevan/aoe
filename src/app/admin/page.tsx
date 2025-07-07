

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { AgeConfig, BuildingConfig, BuildingCosts, Resources, UnitConfig } from '../../../types';
import { saveAgeConfig, getAllAgeConfigs, deleteAgeConfig, saveBuildingConfig, getAllBuildingConfigs, deleteBuildingConfig, saveUnitConfig, getAllUnitConfigs, deleteUnitConfig } from '../../../services/dbService';
import { Trash2, Lock, ArrowUp, ArrowDown, Edit, Save, XCircle, PlusCircle, Building, Swords, Shield, Coins, TestTube, ChevronsUp, Star, Wrench, Calendar, Beaker, Info, Copy, RefreshCw } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Checkbox } from '../../components/ui/checkbox';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';


import { INITIAL_BUILDINGS } from '../../../data/buildingInfo';
import { INITIAL_UNITS } from '../../../data/unitInfo';
import { buildingIconMap, unitIconMap } from '../../../components/icons/iconRegistry';
import { INITIAL_AGES } from '../../../data/ageInfo';


// Reusable component for editing a building's details
const BuildingEditor: React.FC<{
    building: BuildingConfig;
    onSave: (building: BuildingConfig) => void;
    onCancel: () => void;
    allAges: AgeConfig[];
    allBuildings: BuildingConfig[];
}> = ({ building, onSave, onCancel, allAges, allBuildings }) => {
    const [editedBuilding, setEditedBuilding] = useState<BuildingConfig>(building);

    const handleInputChange = (field: keyof BuildingConfig, value: any) => {
        setEditedBuilding(prev => ({ ...prev, [field]: value }));
    };
    const handleNumberChange = (field: keyof BuildingConfig, value: string) => {
        setEditedBuilding(prev => ({ ...prev, [field]: value === '' ? undefined : parseInt(value, 10) || 0 }));
    };
    const handleCostChange = (costField: 'cost' | 'researchCost' | 'maintenanceCost', resource: keyof Resources, value: string) => {
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
                // Add a new upgrade path with default values if it doesn't exist
                if (!currentUpgrades.some(u => u.id === targetId)) {
                    return { ...prev, upgradesTo: [...currentUpgrades, { id: targetId, cost: {}, time: 60 }] };
                }
                return prev; // Should not happen if logic is correct
            } else {
                // Remove the upgrade path
                return { ...prev, upgradesTo: currentUpgrades.filter(u => u.id !== targetId) };
            }
        });
    };
    
    const handleUpgradeDetailChange = (targetId: string, field: 'time' | keyof Resources, value: string) => {
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

    return (
        <div className="bg-stone-dark/40 p-4 rounded-lg border-2 border-brand-gold my-4 space-y-4 animate-in fade-in-50">
            <h3 className="text-xl font-bold text-brand-gold font-serif">Editing: {building.name}</h3>
            
            <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-5 bg-stone-dark/80 border border-stone-light/20">
                    <TabsTrigger value="general"><Building className="w-4 h-4 mr-2"/>General</TabsTrigger>
                    <TabsTrigger value="economy"><Coins className="w-4 h-4 mr-2"/>Economy</TabsTrigger>
                    <TabsTrigger value="military"><Shield className="w-4 h-4 mr-2"/>Military</TabsTrigger>
                    <TabsTrigger value="research"><Beaker className="w-4 h-4 mr-2"/>Research & Upgrades</TabsTrigger>
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
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-stone-light/20 p-2 rounded-md bg-black/20 mt-1">
                                        {(['food', 'wood', 'gold', 'stone'] as (keyof Resources)[]).map(res => (<div key={res}><Label className="capitalize text-xs">{res}</Label><Input type="number" value={editedBuilding[key]?.[res] || ''} onChange={(e) => handleCostChange(key, res, e.target.value)} placeholder="0" className="sci-fi-input w-full" /></div>))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                     </Card>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Card className="bg-stone-dark/20 border-stone-light/20">
                            <CardHeader><CardTitle className="text-base font-serif">Population & Housing</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div><Label>Population Provided</Label><Input type="number" value={editedBuilding.populationCapacity || ''} onChange={(e) => handleNumberChange('populationCapacity', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                                <div><Label>Garrison Capacity</Label><Input type="number" value={editedBuilding.garrisonCapacity || ''} onChange={(e) => handleNumberChange('garrisonCapacity', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                            </CardContent>
                        </Card>
                        <Card className="bg-stone-dark/20 border-stone-light/20">
                            <CardHeader><CardTitle className="text-base font-serif">Passive Generation</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                 <div><Label>Generates Resource</Label><Select value={editedBuilding.generatesResource || 'none'} onValueChange={(val) => handleInputChange('generatesResource', val === 'none' ? undefined : val)}><SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{(['food', 'wood', 'gold', 'stone'] as (keyof Resources)[]).map(res => (<SelectItem key={res} value={res} className="capitalize">{res}</SelectItem>))}</SelectContent></Select></div>
                                {editedBuilding.generatesResource && <div><Label>Rate (per min)</Label><Input type="number" value={editedBuilding.generationRate || ''} onChange={(e) => handleNumberChange('generationRate', e.target.value)} placeholder="0" className="sci-fi-input" /></div>}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                
                <TabsContent value="military" className="pt-4">
                     <Card className="bg-stone-dark/20 border-stone-light/20">
                         <CardHeader><CardTitle className="text-base font-serif">Combat & Vision</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div><Label>Attack Damage</Label><Input type="number" value={editedBuilding.attack || ''} onChange={(e) => handleNumberChange('attack', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                            <div><Label>Attack Rate (/s)</Label><Input type="number" value={editedBuilding.attackRate || ''} onChange={(e) => handleNumberChange('attackRate', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                            <div><Label>Attack Range (cells)</Label><Input type="number" value={editedBuilding.attackRange || ''} onChange={(e) => handleNumberChange('attackRange', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                            <div><Label>Vision Range (cells)</Label><Input type="number" value={editedBuilding.visionRange || ''} onChange={(e) => handleNumberChange('visionRange', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                        </CardContent>
                     </Card>
                     <Card className="bg-stone-dark/20 border-stone-light/20 mt-4">
                         <CardHeader><CardTitle className="text-base font-serif">Durability & Repair</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>Decay Rate (HP/min)</Label><Input type="number" value={editedBuilding.decayRate || ''} onChange={(e) => handleNumberChange('decayRate', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                             <div><Label>Heal Rate (HP/s)</Label><Input type="number" value={editedBuilding.healRate || ''} onChange={(e) => handleNumberChange('healRate', e.target.value)} placeholder="0" className="sci-fi-input" /></div>
                        </CardContent>
                     </Card>
                </TabsContent>

                 <TabsContent value="research" className="pt-4">
                    <Card className="bg-stone-dark/20 border-stone-light/20">
                        <CardHeader><CardTitle className="text-base font-serif">Technology & Progression</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2"><Switch id="edit-canTrainUnits" checked={!!editedBuilding.canTrainUnits} onCheckedChange={(c) => handleInputChange('canTrainUnits', c)} /><Label htmlFor="edit-canTrainUnits">Can Train Units</Label></div>
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
                                    <Label>Tree Upgrades</Label>
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
                                                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                                                                    <Label className="sm:col-span-5 text-xs text-brand-gold">Upgrade Cost & Time for {targetBuilding.name}:</Label>
                                                                    {(['food', 'wood', 'gold', 'stone'] as (keyof Resources)[]).map(res => (
                                                                        <div key={res}>
                                                                            <Label className="capitalize text-xs">{res}</Label>
                                                                            <Input type="number" value={upgradePath.cost[res] || ''} onChange={(e) => handleUpgradeDetailChange(targetBuilding.id, res, e.target.value)} placeholder="0" className="sci-fi-input !h-8" />
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
                         <CardHeader><CardTitle className="text-base font-serif">Meta & Aesthetics</CardTitle></CardHeader>
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
}> = ({ unit, onSave, onCancel, allBuildings }) => {
    const [editedUnit, setEditedUnit] = useState<UnitConfig>(unit);

    const trainingBuildings = allBuildings.filter(b => b.canTrainUnits && b.isActive);

    const handleInputChange = (field: keyof UnitConfig, value: any) => {
        setEditedUnit(prev => ({ ...prev, [field]: value }));
    };
    const handleCostChange = (resource: keyof BuildingCosts, value: string) => {
        const amount = parseInt(value, 10) || 0;
        setEditedUnit(prev => ({ ...prev, cost: { ...prev.cost, [resource]: amount } }));
    };

    return (
        <div className="bg-stone-dark/40 p-4 rounded-lg border border-brand-gold my-2 space-y-4 animate-in fade-in-50">
            <h3 className="text-lg font-bold text-brand-gold">Editing: {unit.name}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input type="text" value={editedUnit.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Unit Name" className="sci-fi-input" />
                <Textarea value={editedUnit.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Description" className="sci-fi-input" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Input type="number" value={editedUnit.hp} onChange={(e) => handleInputChange('hp', parseInt(e.target.value, 10))} placeholder="HP" className="sci-fi-input" />
                <Input type="number" value={editedUnit.attack} onChange={(e) => handleInputChange('attack', parseInt(e.target.value, 10))} placeholder="Attack" className="sci-fi-input" />
                <Input type="number" value={editedUnit.trainTime} onChange={(e) => handleInputChange('trainTime', parseInt(e.target.value, 10))} placeholder="Train Time (s)" className="sci-fi-input" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(editedUnit.cost!) as (keyof Resources)[]).map(res => (
                    <div key={res}><Label className="capitalize text-xs">{res}</Label><Input type="number" value={editedUnit.cost![res] || 0} onChange={(e) => handleCostChange(res, e.target.value)} placeholder="0" className="sci-fi-input w-full" /></div>
                ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label>Required Building</Label>
                    <Select value={editedUnit.requiredBuilding} onValueChange={(val) => handleInputChange('requiredBuilding', val)}>
                        <SelectTrigger className="sci-fi-input" disabled={trainingBuildings.length === 0}>
                            <SelectValue placeholder="Select training building..." />
                        </SelectTrigger>
                        <SelectContent>
                            {trainingBuildings.length > 0 ? (
                                trainingBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)
                            ) : (
                                <SelectItem value="none" disabled>No training buildings available</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label>Icon</Label>
                    <Select value={editedUnit.iconId} onValueChange={(val) => handleInputChange('iconId', val)}>
                        <SelectTrigger className="sci-fi-input"><SelectValue placeholder="Select Icon"/></SelectTrigger>
                        <SelectContent>{Object.keys(unitIconMap).map(iconId => <SelectItem key={iconId} value={iconId}>{iconId}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
            </div>

            <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={onCancel} className="text-brand-red hover:bg-brand-red/10"><XCircle className="w-4 h-4 mr-2"/>Cancel</Button>
                <Button onClick={() => onSave(editedUnit)} className="bg-brand-green hover:bg-brand-green/80" disabled={!editedUnit.requiredBuilding}><Save className="w-4 h-4 mr-2"/>Save Changes</Button>
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
    const [editingBuilding, setEditingBuilding] = useState<BuildingConfig | null>(null);

    // Units State
    const [units, setUnits] = useState<UnitConfig[]>([]);
    const [isUnitsLoading, setIsUnitsLoading] = useState(true);
    const [editingUnit, setEditingUnit] = useState<UnitConfig | null>(null);


    // --- Data Fetching and Seeding ---
    const fetchAges = useCallback(async () => {
        setIsAgesLoading(true);
        let allItems = await getAllAgeConfigs();
        const itemMap = new Map(allItems.map(i => [i.id, i]));
        let needsUpdate = false;

        for (const [index, pItem] of INITIAL_AGES.entries()) {
            const existingItem = itemMap.get(pItem.name);
            const newItem: AgeConfig = {
                ...(existingItem || {}),
                ...pItem,
                id: pItem.name,
                isPredefined: true,
                isActive: existingItem?.isActive ?? true,
                order: existingItem?.order ?? index,
            };

            if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                await saveAgeConfig(newItem);
                needsUpdate = true;
            }
        }

        if (needsUpdate) allItems = await getAllAgeConfigs();
        setAges(allItems);
        setIsAgesLoading(false);
        return allItems;
    }, []);
    
    const fetchBuildings = useCallback(async (allAgeConfigs: AgeConfig[]) => {
        setIsBuildingsLoading(true);
        let allItems = await getAllBuildingConfigs();
        const itemMap = new Map(allItems.map(i => [i.id, i]));
        let needsUpdate = false;
        
        const defaultAge = allAgeConfigs[0]?.name || INITIAL_AGES[0].name;

        for (const [index, pItem] of INITIAL_BUILDINGS.entries()) {
            const existingItem = itemMap.get(pItem.id);
            const newItem: BuildingConfig = {
                ...pItem,
                ...(existingItem || {}),
                id: pItem.id,
                isPredefined: true,
                unlockedInAge: existingItem?.unlockedInAge || (pItem.id === 'townCenter' ? INITIAL_AGES[0].name : defaultAge),
                isActive: existingItem?.isActive ?? true,
                order: existingItem?.order ?? index,
                treeId: existingItem?.treeId || `tree-predefined-${pItem.id}`,
            };

            if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                await saveBuildingConfig(newItem);
                needsUpdate = true;
            }
        }

        if (needsUpdate) allItems = await getAllBuildingConfigs();
        setBuildings(allItems);
        setIsBuildingsLoading(false);
        return allItems;
    }, []);

    const fetchUnits = useCallback(async () => {
        setIsUnitsLoading(true);
        let allItems = await getAllUnitConfigs();
        const itemMap = new Map(allItems.map(i => [i.id, i]));
        let needsUpdate = false;

        for (const [index, pItem] of INITIAL_UNITS.entries()) {
            const existingItem = itemMap.get(pItem.id);
            const newItem: UnitConfig = {
                ...pItem,
                ...(existingItem || {}),
                id: pItem.id,
                isPredefined: true,
                isActive: existingItem?.isActive ?? true,
                order: existingItem?.order ?? index,
            };

            if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                await saveUnitConfig(newItem);
                needsUpdate = true;
            }
        }

        if (needsUpdate) allItems = await getAllUnitConfigs();
        setUnits(allItems);
        setIsUnitsLoading(false);
        return allItems;
    }, []);


    useEffect(() => {
        const loadAll = async () => {
            const allAges = await fetchAges();
            await fetchBuildings(allAges);
            await fetchUnits();
        };
        loadAll();
    }, [fetchAges, fetchBuildings, fetchUnits]);

    // --- Ages Handlers ---
    const handleAddAge = async () => {
        if (!newAgeName.trim() || !newAgeDescription.trim()) return alert('Age name and description cannot be empty.');
        const newAge: AgeConfig = {
            id: `custom-${Date.now()}`,
            name: newAgeName,
            description: newAgeDescription,
            isActive: true,
            isPredefined: false,
            order: ages.length > 0 ? Math.max(...ages.map(a => a.order)) + 1 : 0,
        };
        await saveAgeConfig(newAge);
        setNewAgeName(''); setNewAgeDescription('');
        await fetchAges();
    };
    const handleDeleteAge = async (ageToDelete: AgeConfig) => {
        const isAgeInUse = buildings.some(b => b.unlockedInAge === ageToDelete.name);
        if (isAgeInUse) {
            alert(`Cannot delete "${ageToDelete.name}". One or more buildings are assigned to this age. Please reassign them before deleting.`);
            return;
        }
        if (window.confirm(`Are you sure you want to delete the custom age "${ageToDelete.name}"?`)) {
            await deleteAgeConfig(ageToDelete.id);
            await fetchAges();
        }
    };
    const handleToggleAgeActive = async (age: AgeConfig) => {
        await saveAgeConfig({ ...age, isActive: !age.isActive }); await fetchAges();
    };
    const handleMoveAge = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= ages.length) return;
        
        const reorderedAges = [...ages];
        const [movedItem] = reorderedAges.splice(index, 1);
        reorderedAges.splice(newIndex, 0, movedItem);

        const updatedAges = reorderedAges.map((age, i) => ({ ...age, order: i }));
        for (const age of updatedAges) {
            await saveAgeConfig(age);
        }
        await fetchAges();
    };

    // --- Buildings Handlers ---
     const handleShowAddBuilding = () => {
        const newBuilding: BuildingConfig = {
            id: `custom-bld-${Date.now()}`,
            treeId: `tree-${Date.now()}`,
            name: 'New Building',
            description: 'A new custom building.',
            cost: { wood: 50 },
            isUnique: false,
            buildLimit: 0,
            buildTime: 30,
            hp: 1000,
            unlockedInAge: ages.find(a => a.isActive)?.name || 'Nomadic Age',
            iconId: 'default',
            isActive: true,
            isPredefined: false,
            order: buildings.length > 0 ? Math.max(...buildings.map(b => b.order)) + 1 : 0,
            canTrainUnits: false,
        };
        setEditingBuilding(newBuilding);
    };
    const handleDeleteBuilding = async (buildingToDelete: BuildingConfig) => {
        const isUpgradeTarget = buildings.some(b => b.upgradesTo?.some(u => u.id === buildingToDelete.id));
        if (isUpgradeTarget) {
            alert(`Cannot delete "${buildingToDelete.name}". It is targeted by another building's upgrade path.`);
            return;
        }
        const isRequiredForUnit = units.some(u => u.requiredBuilding === buildingToDelete.id);
        if (isRequiredForUnit) {
            alert(`Cannot delete "${buildingToDelete.name}". One or more units require this building for training.`);
            return;
        }
        if (window.confirm(`Are you sure you want to delete the custom building "${buildingToDelete.name}"?`)) {
            await deleteBuildingConfig(buildingToDelete.id);
            await fetchBuildings(ages);
        }
    };
    const handleToggleBuildingActive = async (building: BuildingConfig) => {
        await saveBuildingConfig({ ...building, isActive: !building.isActive }); await fetchBuildings(ages);
    };
    const handleSaveBuilding = async (buildingToSave: BuildingConfig) => {
        await saveBuildingConfig(buildingToSave);
        setEditingBuilding(null);
        await fetchBuildings(ages);
    };

    // --- Units Handlers ---
     const handleShowAddUnit = () => {
        const trainingBuildings = buildings.filter(b => b.canTrainUnits && b.isActive);
        if (trainingBuildings.length === 0) {
            alert("Please create and activate a building with 'Can Train Units' enabled before adding a unit.");
            return;
        }
        const newUnit: UnitConfig = {
            id: `custom-unit-${Date.now()}`,
            name: 'New Unit',
            description: 'A new custom unit.',
            cost: { food: 50, gold: 10 },
            trainTime: 20,
            hp: 50,
            attack: 5,
            iconId: 'default',
            isActive: true,
            isPredefined: false,
            order: units.length > 0 ? Math.max(...units.map(u => u.order)) + 1 : 0,
            requiredBuilding: trainingBuildings[0].id,
        };
        setEditingUnit(newUnit);
    };
     const handleSaveUnit = async (unitToSave: UnitConfig) => {
        await saveUnitConfig(unitToSave);
        setEditingUnit(null);
        await fetchUnits();
    };
    const handleDeleteUnit = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this custom unit?')) {
            await deleteUnitConfig(id); await fetchUnits();
        }
    };
     const handleToggleUnitActive = async (unit: UnitConfig) => {
        await saveUnitConfig({ ...unit, isActive: !unit.isActive }); await fetchUnits();
    };


    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light p-4 sm:p-8">
            <div className="w-full max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-serif text-parchment-light">Admin Panel</h1>
                    <Link href="/" className="text-brand-blue hover:underline font-sans">Back to Game</Link>
                </div>

                <Tabs defaultValue="ages" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-stone-dark/80 border border-stone-light/20">
                        <TabsTrigger value="ages">Ages</TabsTrigger>
                        <TabsTrigger value="buildings">Buildings</TabsTrigger>
                        <TabsTrigger value="units">Units</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="ages" className="mt-6">
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <Card className="bg-stone-dark/30 border-stone-light/30">
                                    <CardHeader>
                                        <CardTitle className="text-brand-gold">Manage Ages</CardTitle>
                                        <CardDescription className="text-parchment-dark">Enable, disable, and reorder the Ages of your civilization.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {isAgesLoading ? <p>Loading ages...</p> : (
                                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                                {ages.map((age, index) => (
                                                    <div key={age.id} className="sci-fi-unit-row flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4 flex-grow">
                                                            <span className="font-serif text-2xl text-stone-light/80 w-6 text-center">{index + 1}.</span>
                                                            <div className="flex flex-col">
                                                                <button onClick={() => handleMoveAge(index, 'up')} disabled={index === 0} className="disabled:opacity-20 hover:text-brand-gold"><ArrowUp className="w-4 h-4" /></button>
                                                                <button onClick={() => handleMoveAge(index, 'down')} disabled={index === ages.length - 1} className="disabled:opacity-20 hover:text-brand-gold"><ArrowDown className="w-4 h-4" /></button>
                                                            </div>
                                                            <div className="flex-grow">
                                                                <h3 className="font-bold flex items-center gap-2">{age.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}{age.name}</h3>
                                                                <p className="text-sm text-parchment-dark">{age.description}</p>
                                                            </div>
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
                                    <CardHeader>
                                        <CardTitle className="text-brand-gold">Add Custom Age</CardTitle>
                                    </CardHeader>
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
                                <div>
                                    <CardTitle className="text-brand-gold">Manage Buildings</CardTitle>
                                    <CardDescription className="text-parchment-dark">Create, edit, activate, or delete buildings.</CardDescription>
                                </div>
                                <Button onClick={handleShowAddBuilding} disabled={!!editingBuilding}><PlusCircle className="mr-2"/> Add Building</Button>
                            </CardHeader>
                            <CardContent>
                                {isBuildingsLoading ? <p>Loading buildings...</p> : (
                                    <>
                                        {editingBuilding && (
                                            <BuildingEditor 
                                                building={editingBuilding} 
                                                onSave={handleSaveBuilding} 
                                                onCancel={() => setEditingBuilding(null)} 
                                                allAges={ages.filter(a => a.isActive)} 
                                                allBuildings={buildings}
                                            />
                                        )}
                                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 mt-4">
                                            {buildings.map((b) => (
                                                <div key={b.id} className="sci-fi-unit-row flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 flex-grow">
                                                        <div className="flex-shrink-0 w-10 h-10 p-1.5 bg-black/20 rounded-md">{React.createElement(buildingIconMap[b.iconId] || buildingIconMap.default)}</div>
                                                        <div className="flex-grow">
                                                            <h3 className="font-bold flex items-center gap-2">{b.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}{b.name}</h3>
                                                            <p className="text-xs text-parchment-dark">Unlocks in: {b.unlockedInAge}</p>
                                                        </div>
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
                                <div>
                                    <CardTitle className="text-brand-gold">Manage Units</CardTitle>
                                    <CardDescription className="text-parchment-dark">Create, edit, and manage all military units in the game.</CardDescription>
                                </div>
                                <Button onClick={handleShowAddUnit} disabled={!!editingUnit}><PlusCircle className="mr-2"/> Add Unit</Button>
                            </CardHeader>
                            <CardContent>
                                {isUnitsLoading ? <p>Loading units...</p> : (
                                    <>
                                        {editingUnit && (
                                            <UnitEditor 
                                                unit={editingUnit} 
                                                onSave={handleSaveUnit} 
                                                onCancel={() => setEditingUnit(null)}
                                                allBuildings={buildings.filter(b => b.isActive)} 
                                            />
                                        )}
                                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 mt-4">
                                            {units.map((u) => (
                                                <div key={u.id} className="sci-fi-unit-row flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 flex-grow">
                                                        <div className="flex-shrink-0 w-10 h-10 p-1.5 bg-black/20 rounded-md">{React.createElement(unitIconMap[u.iconId] || unitIconMap.default)}</div>
                                                        <div className="flex-grow">
                                                            <h3 className="font-bold flex items-center gap-2">{u.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}{u.name}</h3>
                                                            <p className="text-xs text-parchment-dark">HP: {u.hp} | ATK: {u.attack}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center space-x-2"><Label htmlFor={`active-unit-${u.id}`} className="text-xs">Active</Label><Switch id={`active-unit-${u.id}`} checked={u.isActive} onCheckedChange={() => handleToggleUnitActive(u)} /></div>
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingUnit(u)} className="text-parchment-dark/70 hover:text-brand-blue" disabled={!!editingUnit}><Edit className="w-4 h-4"/></Button>
                                                        {!u.isPredefined && <button onClick={() => handleDeleteUnit(u.id)} className="p-1 text-parchment-dark/60 hover:text-brand-red rounded-full"><Trash2 className="w-5 h-5" /></button>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default AdminPage;

    
