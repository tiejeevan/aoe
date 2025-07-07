'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { CustomAge } from '../../../types';
import { saveCustomAge, getAllCustomAges, deleteCustomAge } from '../../../services/dbService';
import { Trash2 } from 'lucide-react';

const AdminPage: React.FC = () => {
    const [ages, setAges] = useState<CustomAge[]>([]);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchAges = async () => {
        const customAges = await getAllCustomAges();
        setAges(customAges);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchAges();
    }, []);

    const handleAddAge = async () => {
        if (!newName.trim() || !newDescription.trim()) {
            alert('Age name and description cannot be empty.');
            return;
        }
        const newAge: CustomAge = {
            id: `custom-${Date.now()}`,
            name: newName,
            description: newDescription,
        };
        await saveCustomAge(newAge);
        setNewName('');
        setNewDescription('');
        await fetchAges();
    };

    const handleDeleteAge = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this age?')) {
            await deleteCustomAge(id);
            await fetchAges();
        }
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
                    {/* Add New Age Form */}
                    <div className="sci-fi-panel-popup p-6">
                        <h2 className="text-2xl font-serif text-brand-gold mb-4">Add New Age</h2>
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
                                Add Age
                            </button>
                        </div>
                    </div>

                    {/* Existing Custom Ages List */}
                    <div className="sci-fi-panel-popup p-6">
                        <h2 className="text-2xl font-serif text-brand-gold mb-4">Custom Ages</h2>
                        {isLoading ? (
                            <p className="text-parchment-dark">Loading custom ages...</p>
                        ) : ages.length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {ages.map(age => (
                                    <div key={age.id} className="sci-fi-unit-row flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-parchment-light">{age.name}</h3>
                                            <p className="text-sm text-parchment-dark">{age.description}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteAge(age.id)}
                                            className="p-2 text-parchment-dark/60 hover:text-brand-red rounded-full transition-colors flex-shrink-0"
                                            aria-label={`Delete ${age.name}`}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-parchment-dark text-center py-8">No custom ages created yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
