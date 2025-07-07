'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { AgeConfig } from '../../../types';
import { saveAgeConfig, getAllAgeConfigs, deleteAgeConfig } from '../../../services/dbService';
import { PREDEFINED_AGES } from '../../../data/predefinedContent';
import { Trash2, Lock } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';

const AdminPage: React.FC = () => {
    const [ages, setAges] = useState<AgeConfig[]>([]);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchAges = useCallback(async () => {
        setIsLoading(true);
        let allAges = await getAllAgeConfigs();

        // Check if predefined ages are seeded in the DB. If not, add them.
        const needsSeeding = PREDEFINED_AGES.some(pa => !allAges.find(a => a.id === pa.name));

        if (needsSeeding) {
            for (const pa of PREDEFINED_AGES) {
                if (!allAges.find(a => a.id === pa.name)) {
                    const newPredefinedAge: AgeConfig = {
                        id: pa.name,
                        name: pa.name,
                        description: pa.description,
                        isActive: true,
                        isPredefined: true,
                    };
                    await saveAgeConfig(newPredefinedAge);
                }
            }
            allAges = await getAllAgeConfigs();
        }

        // Sort so predefined ages are always first and in order
        const predefinedOrder = PREDEFINED_AGES.map(a => a.name);
        allAges.sort((a, b) => {
            const indexA = predefinedOrder.indexOf(a.name);
            const indexB = predefinedOrder.indexOf(b.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(b.name);
        });

        setAges(allAges);
        setIsLoading(false);
    }, []);


    useEffect(() => {
        fetchAges();
    }, [fetchAges]);

    const handleAddAge = async () => {
        if (!newName.trim() || !newDescription.trim()) {
            alert('Age name and description cannot be empty.');
            return;
        }
        const newAge: AgeConfig = {
            id: `custom-${Date.now()}`,
            name: newName,
            description: newDescription,
            isActive: true,
            isPredefined: false,
        };
        await saveAgeConfig(newAge);
        setNewName('');
        setNewDescription('');
        await fetchAges();
    };

    const handleDeleteAge = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this custom age?')) {
            await deleteAgeConfig(id);
            await fetchAges();
        }
    };
    
    const handleToggleActive = async (age: AgeConfig) => {
        const updatedAge = { ...age, isActive: !age.isActive };
        await saveAgeConfig(updatedAge);
        await fetchAges();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddAge();
        }
    };

    return (
        <div className="min-h-screen bg-stone-dark flex items-center justify-center p-4">
            <div className="bg-stone-dark p-8 rounded-lg shadow-2xl border-2 border-stone-light w-full max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-serif text-parchment-light">Admin Panel</h1>
                    <Link href="/" className="text-brand-blue hover:underline font-sans">
                        Back to Game
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* All Ages List */}
                    <div className="sci-fi-panel-popup p-6">
                        <h2 className="text-2xl font-serif text-brand-gold mb-4">Manage Ages</h2>
                        {isLoading ? (
                            <p className="text-parchment-dark">Loading ages...</p>
                        ) : ages.length > 0 ? (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                {ages.map(age => (
                                    <div key={age.id} className="sci-fi-unit-row flex items-start justify-between gap-4">
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-parchment-light flex items-center gap-2">
                                                {age.isPredefined && <Lock className="w-3 h-3 text-brand-gold" />}
                                                {age.name}
                                            </h3>
                                            <p className="text-sm text-parchment-dark">{age.description}</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex items-center space-x-2">
                                                <Label htmlFor={`active-switch-${age.id}`} className="text-xs">Active</Label>
                                                <Switch
                                                    id={`active-switch-${age.id}`}
                                                    checked={age.isActive}
                                                    onCheckedChange={() => handleToggleActive(age)}
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteAge(age.id)}
                                                disabled={age.isPredefined}
                                                className="p-2 text-parchment-dark/60 hover:text-brand-red rounded-full transition-colors flex-shrink-0 disabled:text-parchment-dark/20 disabled:cursor-not-allowed"
                                                aria-label={`Delete ${age.name}`}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-parchment-dark text-center py-8">No ages configured.</p>
                        )}
                    </div>
                    
                    {/* Add New Age Form */}
                    <div className="sci-fi-panel-popup p-6">
                        <h2 className="text-2xl font-serif text-brand-gold mb-4">Add Custom Age</h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="New Age Name"
                                className="sci-fi-input w-full !text-lg"
                            />
                            <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Description of the new age..."
                                className="sci-fi-input w-full min-h-[100px] !text-base"
                                rows={4}
                            />
                            <button
                                onClick={handleAddAge}
                                className="sci-fi-button w-full !py-2 !text-lg"
                            >
                                Add Custom Age
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminPage;
