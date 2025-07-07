'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { AgeConfig, BuildingConfig, BuildingCosts, Resources, UnitConfig } from '../../../types';
import { saveAgeConfig, getAllAgeConfigs, deleteAgeConfig, saveBuildingConfig, getAllBuildingConfigs, deleteBuildingConfig, saveUnitConfig, getAllUnitConfigs, deleteUnitConfig } from '../../../services/dbService';
import { Trash2, Lock, ArrowUp, ArrowDown, Edit, Save, XCircle, PlusCircle } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

import { INITIAL_BUILDINGS } from '../../../data/buildingInfo';
import { INITIAL_UNITS } from '../../../data/unitInfo';
import { buildingIconMap, unitIconMap } from '../../../components/icons/iconRegistry';

// This is the fallback if DB fails or is empty on first load.
const INITIAL_AGES = [
    { name: 'Nomadic Age', description: 'A scattered tribe, learning to survive.' },
    { name: 'Feudal Age', description: 'Society organizes under lords and vassals, unlocking new military and economic structures.' },
    { name: 'Castle Age', description: 'Powerful fortifications and advanced siege weaponry mark this new era of warfare and defense.' },
    { name: 'Imperial Age', description: 'Your civilization becomes a true empire, with unparalleled economic and military might.' },
];

// Reusable component for editing a building's details
const BuildingEditor: React.FC<{
    building: BuildingConfig;
    onSave: (building: BuildingConfig) => void;
    onCancel: () => void;
    allAges: AgeConfig[];
}> = ({ building, onSave, onCancel, allAges }) => {
    const [editedBuilding, setEditedBuilding] = useState<BuildingConfig>(building);

    const handleInputChange = (field: keyof BuildingConfig, value: any) => {
        setEditedBuilding(prev => ({ ...prev, [field]: value }));
    };
    const handleCostChange = (resource: keyof BuildingCosts, value: string) => {
        const amount = parseInt(value, 10) || 0;
        setEditedBuilding(prev => ({ ...prev, cost: { ...prev.cost, [resource]: amount } }));
    };

    return (
        <div className="bg-stone-dark/40 p-4 rounded-lg border border-brand-gold my-2 space-y-4 animate-in fade-in-50">
            <h3 className="text-lg font-bold text-brand-gold">Editing: {building.name}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="edit-name">Name</Label>
                    <Input id="edit-name" type="text" value={editedBuilding.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Building Name" className="sci-fi-input" />
                </div>
                 <div>
                    <Label htmlFor="edit-hp">HP</Label>
                    <Input id="edit-hp" type="number" value={editedBuilding.hp} onChange={(e) => handleInputChange('hp', parseInt(e.target.value, 10))} placeholder="HP" className="sci-fi-input" />
                </div>
            </div>

            <div>
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea id="edit-desc" value={editedBuilding.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Description" className="sci-fi-input" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                 <div>
                    <Label htmlFor="edit-buildTime">Build Time (s)</Label>
                    <Input id="edit-buildTime" type="number" value={editedBuilding.buildTime} onChange={(e) => handleInputChange('buildTime', parseInt(e.target.value, 10))} className="sci-fi-input" />
                </div>
                {(Object.keys(editedBuilding.cost!) as (keyof Resources)[]).map(res => (
                    <div key={res}>
                        <Label className="capitalize text-xs">{res}</Label>
                        <Input type="number" value={editedBuilding.cost![res]} onChange={(e) => handleCostChange(res, e.target.value)} placeholder="0" className="sci-fi-input" />
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Unlocked In Age</Label>
                    <Select value={editedBuilding.unlockedInAge} onValueChange={(val) => handleInputChange('unlockedInAge', val)}>
                        <SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {allAges.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Icon</Label>
                     <Select value={editedBuilding.iconId} onValueChange={(val) => handleInputChange('iconId', val)}>
                        <SelectTrigger className="sci-fi-input"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           {Object.keys(buildingIconMap).map(iconId => <SelectItem key={iconId} value={iconId}>{iconId}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Switch id="edit-isUnique" checked={editedBuilding.isUnique} onCheckedChange={(c) => handleInputChange('isUnique', c)} />
                    <Label htmlFor="edit-isUnique">Unique Building</Label>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel} className="text-brand-red hover:bg-brand-red/10"><XCircle className="w-4 h-4 mr-2"/>Cancel</Button>
                    <Button onClick={() => onSave(editedBuilding)} className="bg-brand-green hover:bg-brand-green/80"><Save className="w-4 h-4 mr-2"/>Save Changes</Button>
                </div>
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
                    <div key={res}><Label className="capitalize text-xs">{res}</Label><Input type="number" value={editedUnit.cost![res]} onChange={(e) => handleCostChange(res, e.target.value)} placeholder="0" className="sci-fi-input w-full" /></div>
                ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={editedUnit.requiredBuilding} onValueChange={(val) => handleInputChange('requiredBuilding', val)}>
                    <SelectTrigger className="sci-fi-input"><SelectValue placeholder="Required Building"/></SelectTrigger>
                    <SelectContent>{allBuildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
                 <Select value={editedUnit.iconId} onValueChange={(val) => handleInputChange('iconId', val)}>
                    <SelectTrigger className="sci-fi-input"><SelectValue placeholder="Select Icon"/></SelectTrigger>
                    <SelectContent>{Object.keys(unitIconMap).map(iconId => <SelectItem key={iconId} value={iconId}>{iconId}</SelectItem>)}</SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={onCancel} className="text-brand-red hover:bg-brand-red/10"><XCircle className="w-4 h-4 mr-2"/>Cancel</Button>
                <Button onClick={() => onSave(editedUnit)} className="bg-brand-green hover:bg-brand-green/80"><Save className="w-4 h-4 mr-2"/>Save Changes</Button>
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
        let allAges = await getAllAgeConfigs();
        if (allAges.length === 0) {
            allAges = [];
            for (const [index, pa] of INITIAL_AGES.entries()) {
                const newPredefinedAge: AgeConfig = { id: pa.name, name: pa.name, description: pa.description, isActive: true, isPredefined: true, order: index };
                await saveAgeConfig(newPredefinedAge);
                allAges.push(newPredefinedAge);
            }
        }
        setAges(allAges);
        setIsAgesLoading(false);
    }, []);
    
    const fetchBuildings = useCallback(async () => {
        setIsBuildingsLoading(true);
        let allBuildings = await getAllBuildingConfigs();
        if (allBuildings.length === 0) {
            allBuildings = [];
            const initialAges = await getAllAgeConfigs();
            const defaultAge = initialAges.find(a => a.order === 0)?.name || 'Nomadic Age';
            for (const [index, pb] of INITIAL_BUILDINGS.entries()) {
                const newPredefinedBuilding: BuildingConfig = {
                    ...pb,
                    isActive: true,
                    isPredefined: true,
                    order: index,
                    unlockedInAge: defaultAge, 
                    iconId: pb.id,
                };
                await saveBuildingConfig(newPredefinedBuilding);
                allBuildings.push(newPredefinedBuilding);
            }
        }
        setBuildings(allBuildings);
        setIsBuildingsLoading(false);
    }, []);

    const fetchUnits = useCallback(async () => {
        setIsUnitsLoading(true);
        let allUnits = await getAllUnitConfigs();
        if (allUnits.length === 0) {
            allUnits = [];
            for (const [index, pu] of INITIAL_UNITS.entries()) {
                 const newPredefinedUnit: UnitConfig = {
                    ...pu,
                    isActive: true,
                    isPredefined: true,
                    order: index,
                };
                await saveUnitConfig(newPredefinedUnit);
                allUnits.push(newPredefinedUnit);
            }
        }
        setUnits(allUnits);
        setIsUnitsLoading(false);
    }, []);


    useEffect(() => {
        fetchAges();
        fetchBuildings();
        fetchUnits();
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
    const handleDeleteAge = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this custom age?')) {
            await deleteAgeConfig(id); await fetchAges();
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
    const handleDeleteBuilding = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this custom building?')) {
            await deleteBuildingConfig(id); await fetchBuildings();
        }
    };
    const handleToggleBuildingActive = async (building: BuildingConfig) => {
        await saveBuildingConfig({ ...building, isActive: !building.isActive }); await fetchBuildings();
    };
    const handleSaveBuilding = async (buildingToSave: BuildingConfig) => {
        await saveBuildingConfig(buildingToSave);
        setEditingBuilding(null);
        await fetchBuildings();
    };

    // --- Units Handlers ---
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
                                                            {!age.isPredefined && <button onClick={() => handleDeleteAge(age.id)} className="p-1 text-parchment-dark/60 hover:text-brand-red rounded-full disabled:text-parchment-dark/20 disabled:cursor-not-allowed"><Trash2 className="w-5 h-5" /></button>}
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
                            <CardHeader>
                                <CardTitle className="text-brand-gold">Manage Buildings</CardTitle>
                                <CardDescription className="text-parchment-dark">Edit, activate, or delete buildings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isBuildingsLoading ? <p>Loading buildings...</p> : (
                                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                        {buildings.map((b) => (
                                            <div key={b.id}>
                                                {editingBuilding?.id === b.id ? (
                                                    <BuildingEditor building={editingBuilding} onSave={handleSaveBuilding} onCancel={() => setEditingBuilding(null)} allAges={ages} />
                                                ) : (
                                                    <div className="sci-fi-unit-row flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 flex-grow">
                                                            <div className="flex-shrink-0 w-10 h-10 p-1.5 bg-black/20 rounded-md">{React.createElement(buildingIconMap[b.iconId] || buildingIconMap.default)}</div>
                                                            <div className="flex-grow">
                                                                <h3 className="font-bold flex items-center gap-2">{b.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}{b.name}</h3>
                                                                <p className="text-xs text-parchment-dark">Unlocks in: {b.unlockedInAge}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center space-x-2"><Label htmlFor={`active-bld-${b.id}`} className="text-xs">Active</Label><Switch id={`active-bld-${b.id}`} checked={b.isActive} onCheckedChange={() => handleToggleBuildingActive(b)} /></div>
                                                            <Button variant="ghost" size="icon" onClick={() => setEditingBuilding(b)} className="text-parchment-dark/70 hover:text-brand-blue"><Edit className="w-4 h-4"/></Button>
                                                            {!b.isPredefined && <button onClick={() => handleDeleteBuilding(b.id)} className="p-1 text-parchment-dark/60 hover:text-brand-red rounded-full"><Trash2 className="w-5 h-5" /></button>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="units" className="mt-6">
                         <Card className="bg-stone-dark/30 border-stone-light/30">
                            <CardHeader>
                                <CardTitle className="text-brand-gold">Manage Units</CardTitle>
                                <CardDescription className="text-parchment-dark">Create, edit, and manage all military units in the game.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isUnitsLoading ? <p>Loading units...</p> : (
                                     <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                        {units.map((u) => (
                                            <div key={u.id}>
                                                {editingUnit?.id === u.id ? (
                                                    <UnitEditor unit={editingUnit} onSave={handleSaveUnit} onCancel={() => setEditingUnit(null)} allBuildings={buildings} />
                                                ) : (
                                                    <div className="sci-fi-unit-row flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 flex-grow">
                                                            <div className="flex-shrink-0 w-10 h-10 p-1.5 bg-black/20 rounded-md">{React.createElement(unitIconMap[u.iconId] || unitIconMap.default)}</div>
                                                            <div className="flex-grow">
                                                                <h3 className="font-bold flex items-center gap-2">{u.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}{u.name}</h3>
                                                                <p className="text-xs text-parchment-dark">HP: {u.hp} | ATK: {u.attack} | Requires: {buildings.find(b=>b.id===u.requiredBuilding)?.name || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center space-x-2"><Label htmlFor={`active-unit-${u.id}`} className="text-xs">Active</Label><Switch id={`active-unit-${u.id}`} checked={u.isActive} onCheckedChange={() => handleToggleUnitActive(u)} /></div>
                                                            <Button variant="ghost" size="icon" onClick={() => setEditingUnit(u)} className="text-parchment-dark/70 hover:text-brand-blue"><Edit className="w-4 h-4"/></Button>
                                                            {!u.isPredefined && <button onClick={() => handleDeleteUnit(u.id)} className="p-1 text-parchment-dark/60 hover:text-brand-red rounded-full"><Trash2 className="w-5 h-5" /></button>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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
