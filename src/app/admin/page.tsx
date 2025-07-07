'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { AgeConfig, BuildingConfig, BuildingCosts, Resources } from '../../../types';
import { saveAgeConfig, getAllAgeConfigs, deleteAgeConfig, saveBuildingConfig, getAllBuildingConfigs, deleteBuildingConfig } from '../../../services/dbService';
import { Trash2, Lock, ArrowUp, ArrowDown } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { INITIAL_BUILDINGS } from '../../../data/buildingInfo';
import { buildingIconMap } from '../../../components/icons/iconRegistry';

const INITIAL_AGES = [
    { name: 'Nomadic Age', description: 'A scattered tribe, learning to survive.' },
    { name: 'Feudal Age', description: 'Society organizes under lords and vassals, unlocking new military and economic structures.' },
    { name: 'Castle Age', description: 'Powerful fortifications and advanced siege weaponry mark this new era of warfare and defense.' },
    { name: 'Imperial Age', description: 'Your civilization becomes a true empire, with unparalleled economic and military might.' },
];

const AdminPage: React.FC = () => {
    // Ages State
    const [ages, setAges] = useState<AgeConfig[]>([]);
    const [newAgeName, setNewAgeName] = useState('');
    const [newAgeDescription, setNewAgeDescription] = useState('');
    const [isAgesLoading, setIsAgesLoading] = useState(true);

    // Buildings State
    const [buildings, setBuildings] = useState<BuildingConfig[]>([]);
    const [isBuildingsLoading, setIsBuildingsLoading] = useState(true);
    const [newBuilding, setNewBuilding] = useState<Partial<BuildingConfig>>({
        name: '',
        description: '',
        hp: 1000,
        buildTime: 30,
        isUnique: false,
        cost: { food: 0, wood: 0, gold: 0, stone: 0 },
        unlockedInAge: '',
        iconId: 'default',
    });


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
        if (allAges.length > 0 && !newBuilding.unlockedInAge) {
            setNewBuilding(prev => ({ ...prev, unlockedInAge: allAges[0].name }));
        }
    }, [newBuilding.unlockedInAge]);
    
    const fetchBuildings = useCallback(async () => {
        setIsBuildingsLoading(true);
        let allBuildings = await getAllBuildingConfigs();
        if (allBuildings.length === 0) {
            allBuildings = [];
            for (const [index, pb] of INITIAL_BUILDINGS.entries()) {
                const newPredefinedBuilding: BuildingConfig = {
                    ...pb,
                    isActive: true,
                    isPredefined: true,
                    order: index,
                    unlockedInAge: 'Nomadic Age', // Default for predefined
                    iconId: pb.id,
                };
                await saveBuildingConfig(newPredefinedBuilding);
                allBuildings.push(newPredefinedBuilding);
            }
        }
        setBuildings(allBuildings);
        setIsBuildingsLoading(false);
    }, []);

    useEffect(() => {
        fetchAges();
        fetchBuildings();
    }, [fetchAges, fetchBuildings]);

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
        const updatedAges = [...ages];
        [updatedAges[index].order, updatedAges[newIndex].order] = [updatedAges[newIndex].order, updatedAges[index].order];
        await saveAgeConfig(updatedAges[index]); await saveAgeConfig(updatedAges[newIndex]);
        await fetchAges();
    };

    // --- Buildings Handlers ---
    const handleBuildingInputChange = (field: keyof BuildingConfig, value: any) => {
        setNewBuilding(prev => ({ ...prev, [field]: value }));
    };
    const handleBuildingCostChange = (resource: keyof BuildingCosts, value: string) => {
        const amount = parseInt(value, 10) || 0;
        setNewBuilding(prev => ({ ...prev, cost: { ...prev.cost, [resource]: amount } }));
    };
    const handleAddBuilding = async () => {
        if (!newBuilding.name?.trim() || !newBuilding.description?.trim()) return alert('Building name and description cannot be empty.');
        const buildingId = `custom-${newBuilding.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        const newBuildingConfig: BuildingConfig = {
            id: buildingId,
            name: newBuilding.name,
            description: newBuilding.description,
            hp: newBuilding.hp!,
            buildTime: newBuilding.buildTime!,
            cost: newBuilding.cost!,
            isUnique: newBuilding.isUnique!,
            unlockedInAge: newBuilding.unlockedInAge!,
            iconId: newBuilding.iconId!,
            isActive: true,
            isPredefined: false,
            order: buildings.length > 0 ? Math.max(...buildings.map(b => b.order)) + 1 : 0,
        };
        await saveBuildingConfig(newBuildingConfig);
        await fetchBuildings();
    };
    const handleDeleteBuilding = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this custom building?')) {
            await deleteBuildingConfig(id); await fetchBuildings();
        }
    };
     const handleToggleBuildingActive = async (building: BuildingConfig) => {
        await saveBuildingConfig({ ...building, isActive: !building.isActive }); await fetchBuildings();
    };

    return (
        <div className="min-h-screen bg-stone-dark flex items-center justify-center p-4">
            <div className="bg-stone-dark p-8 rounded-lg shadow-2xl border-2 border-stone-light w-full max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-serif text-parchment-light">Admin Panel</h1>
                    <Link href="/" className="text-brand-blue hover:underline font-sans">Back to Game</Link>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* AGES COLUMN */}
                    <div className="flex flex-col gap-8">
                        <div className="sci-fi-panel-popup p-6">
                            <h2 className="text-2xl font-serif text-brand-gold mb-4">Manage Ages</h2>
                            {isAgesLoading ? <p>Loading ages...</p> : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {ages.map((age, index) => (
                                        <div key={age.id} className="sci-fi-unit-row flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2 flex-grow">
                                                <div className="flex flex-col"><button onClick={() => handleMoveAge(index, 'up')} disabled={index === 0} className="disabled:opacity-20 hover:text-brand-gold"><ArrowUp className="w-4 h-4" /></button><button onClick={() => handleMoveAge(index, 'down')} disabled={index === ages.length - 1} className="disabled:opacity-20 hover:text-brand-gold"><ArrowDown className="w-4 h-4" /></button></div>
                                                <div className="flex-grow"><h3 className="font-bold flex items-center gap-2">{age.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}{age.name}</h3><p className="text-sm text-parchment-dark">{age.description}</p></div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center space-x-2"><Label htmlFor={`active-age-${age.id}`} className="text-xs">Active</Label><Switch id={`active-age-${age.id}`} checked={age.isActive} onCheckedChange={() => handleToggleAgeActive(age)} /></div>
                                                <button onClick={() => handleDeleteAge(age.id)} disabled={age.isPredefined} className="p-1 text-parchment-dark/60 hover:text-brand-red rounded-full disabled:text-parchment-dark/20 disabled:cursor-not-allowed"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="sci-fi-panel-popup p-6">
                            <h2 className="text-2xl font-serif text-brand-gold mb-4">Add Custom Age</h2>
                            <div className="space-y-4">
                                <input type="text" value={newAgeName} onChange={(e) => setNewAgeName(e.target.value)} placeholder="New Age Name" className="sci-fi-input w-full !text-lg" />
                                <textarea value={newAgeDescription} onChange={(e) => setNewAgeDescription(e.target.value)} placeholder="Description..." className="sci-fi-input w-full min-h-[80px] !text-base" rows={3} />
                                <button onClick={handleAddAge} className="sci-fi-button w-full !py-2 !text-lg">Add Custom Age</button>
                            </div>
                        </div>
                    </div>

                    {/* BUILDINGS COLUMN */}
                    <div className="flex flex-col gap-8">
                         <div className="sci-fi-panel-popup p-6">
                            <h2 className="text-2xl font-serif text-brand-gold mb-4">Manage Buildings</h2>
                             {isBuildingsLoading ? <p>Loading buildings...</p> : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {buildings.map((b) => (
                                        <div key={b.id} className="sci-fi-unit-row flex items-center justify-between gap-4">
                                             <div className="flex items-center gap-2 flex-grow">
                                                <div className="flex-shrink-0 w-8 h-8 p-1 bg-black/20 rounded-md">{React.createElement(buildingIconMap[b.iconId] || buildingIconMap.default)}</div>
                                                <div className="flex-grow"><h3 className="font-bold flex items-center gap-2">{b.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}{b.name}</h3><p className="text-sm text-parchment-dark">Unlocks in: {b.unlockedInAge}</p></div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center space-x-2"><Label htmlFor={`active-bld-${b.id}`} className="text-xs">Active</Label><Switch id={`active-bld-${b.id}`} checked={b.isActive} onCheckedChange={() => handleToggleBuildingActive(b)} /></div>
                                                <button onClick={() => handleDeleteBuilding(b.id)} disabled={b.isPredefined} className="p-1 text-parchment-dark/60 hover:text-brand-red rounded-full disabled:text-parchment-dark/20 disabled:cursor-not-allowed"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="sci-fi-panel-popup p-6">
                            <h2 className="text-2xl font-serif text-brand-gold mb-4">Add Custom Building</h2>
                            <div className="space-y-4">
                                <input type="text" value={newBuilding.name} onChange={(e) => handleBuildingInputChange('name', e.target.value)} placeholder="Building Name" className="sci-fi-input w-full" />
                                <textarea value={newBuilding.description} onChange={(e) => handleBuildingInputChange('description', e.target.value)} placeholder="Description" className="sci-fi-input w-full" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" value={newBuilding.hp} onChange={(e) => handleBuildingInputChange('hp', parseInt(e.target.value, 10))} placeholder="HP" className="sci-fi-input w-full" />
                                    <input type="number" value={newBuilding.buildTime} onChange={(e) => handleBuildingInputChange('buildTime', parseInt(e.target.value, 10))} placeholder="Build Time (s)" className="sci-fi-input w-full" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {(Object.keys(newBuilding.cost!) as (keyof Resources)[]).map(res => (
                                        <div key={res}><Label className="capitalize text-xs">{res}</Label><input type="number" value={newBuilding.cost![res]} onChange={(e) => handleBuildingCostChange(res, e.target.value)} placeholder="0" className="sci-fi-input w-full" /></div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <select value={newBuilding.unlockedInAge} onChange={(e) => handleBuildingInputChange('unlockedInAge', e.target.value)} className="sci-fi-input w-full"><option disabled value="">Select Age</option>{ages.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</select>
                                    <select value={newBuilding.iconId} onChange={(e) => handleBuildingInputChange('iconId', e.target.value)} className="sci-fi-input w-full"><option disabled value="">Select Icon</option>{Object.keys(buildingIconMap).map(iconId => <option key={iconId} value={iconId}>{iconId}</option>)}</select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><Switch id="isUnique" checked={newBuilding.isUnique} onCheckedChange={(c) => handleBuildingInputChange('isUnique', c)} /><Label htmlFor="isUnique">Unique Building (limit 1)</Label></div>
                                    <button onClick={handleAddBuilding} className="sci-fi-button">Add Building</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
