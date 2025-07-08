
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MapContainer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadGameState, getAllSaveNames, getAllBuildingConfigs, getAllResourceConfigs } from '../../../services/dbService';
import type { FullGameState, BuildingConfig, ResourceConfig, BuildingInstance, ResourceNode } from '../../../types';

// Define the grid dimensions of our game map
const MAP_DIMENSIONS = { width: 25, height: 18 };

const ProxyMapPage = () => {
    // State to hold all game data
    const [allSaves, setAllSaves] = useState<string[]>([]);
    const [selectedSave, setSelectedSave] = useState<string | null>(null);
    const [gameState, setGameState] = useState<FullGameState | null>(null);
    const [allBuildingConfigs, setAllBuildingConfigs] = useState<BuildingConfig[]>([]);
    const [allResourceConfigs, setAllResourceConfigs] = useState<ResourceConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial data (list of saves and all configs)
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [saves, buildingConfigs, resourceConfigs] = await Promise.all([
                    getAllSaveNames(),
                    getAllBuildingConfigs(),
                    getAllResourceConfigs()
                ]);
                setAllSaves(saves);
                setAllBuildingConfigs(buildingConfigs);
                setAllResourceConfigs(resourceConfigs);
                if (saves.length > 0) {
                    setSelectedSave(saves[0]);
                }
            } catch (error) {
                console.error("Failed to load initial admin data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Load a specific game state when a save is selected
    useEffect(() => {
        if (selectedSave) {
            const fetchGameState = async () => {
                const state = await loadGameState(selectedSave);
                if (state) {
                    setGameState(state);
                }
            };
            fetchGameState();
        } else {
            setGameState(null);
        }
    }, [selectedSave]);

    // Memoize the icon creation to prevent re-creating them on every render
    const iconCache = useMemo(() => {
        const cache: Record<string, L.Icon> = {};
        
        const createIcon = (text: string, size: number, bgColor: string, fgColor: string = 'white') => {
             return L.icon({
                iconUrl: `https://placehold.co/${size}x${size}/${bgColor}/${fgColor}?text=${text.substring(0,2).toUpperCase()}`,
                iconSize: [size, size],
            });
        }
        
        allBuildingConfigs.forEach(config => {
            cache[config.id] = createIcon(config.name, 40, 'a89984', '3c3836');
        });
        
        allResourceConfigs.forEach(config => {
            let color = 'f59e0b';
            if (config.id === 'wood') color = 'a16207';
            if (config.id === 'gold') color = 'facc15';
            if (config.id === 'stone') color = 'a8a29e';
            cache[config.id] = createIcon(config.name, 28, color, '3c3836');
        });
        
        cache.defaultBuilding = createIcon('?', 40, 'a89984', '3c3836');
        cache.defaultResource = createIcon('?', 28, 'f59e0b', '3c3836');

        return cache;
    }, [allBuildingConfigs, allResourceConfigs]);

    const getIconForGameObject = (type: string, isBuilding: boolean): L.Icon => {
        return iconCache[type] || (isBuilding ? iconCache.defaultBuilding : iconCache.defaultResource);
    };

    const renderMapContent = () => {
        if (isLoading) {
            return <p className="text-center p-8">Loading game data...</p>;
        }
        if (!gameState) {
            return <p className="text-center p-8">Select a saved game to view its map.</p>;
        }

        // Center the game grid on the Leaflet map's [0,0] coordinate
        const transformCoords = (pos: { x: number, y: number }): L.LatLngExpression => {
            // Leaflet's Y-axis is inverted compared to a typical upward-Y game grid
            const y = -(pos.y - MAP_DIMENSIONS.height / 2);
            const x = pos.x - MAP_DIMENSIONS.width / 2;
            return [y, x];
        };
        
        return (
            <MapContainer
                center={[0, 0]}
                zoom={5}
                style={{ height: '100%', width: '100%', backgroundColor: '#1d2021' }}
                className="rounded-lg"
                crs={L.CRS.Simple}
                maxBounds={L.latLngBounds([-50, -50], [50, 50])}
                minZoom={4}
            >
                {/* Render Buildings */}
                {Object.entries(gameState.buildings).flatMap(([buildingType, instances]) => 
                    instances.map((instance: BuildingInstance) => (
                        <Marker key={instance.id} position={transformCoords(instance.position)} icon={getIconForGameObject(buildingType, true)}>
                            <Popup>{instance.name} ({buildingType})</Popup>
                        </Marker>
                    ))
                )}

                {/* Render Resource Nodes */}
                {gameState.resourceNodes.map((node: ResourceNode) => (
                    <Marker key={node.id} position={transformCoords(node.position)} icon={getIconForGameObject(node.type, false)}>
                        <Popup>{node.type} Node (Amount: {Math.floor(node.amount)})</Popup>
                    </Marker>
                ))}
            </MapContainer>
        );
    };

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8">
            <h1 className="text-4xl font-serif text-brand-gold mb-2">Proxy Map Development</h1>
            <p className="text-parchment-dark mb-4">Displaying all objects from a selected saved game.</p>
            
             <div className="mb-4 w-full max-w-sm">
                <Select value={selectedSave || ''} onValueChange={setSelectedSave} disabled={isLoading || allSaves.length === 0}>
                    <SelectTrigger className="sci-fi-input">
                        <SelectValue placeholder={isLoading ? "Loading saves..." : "Select a saved game..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {allSaves.map(save => (
                            <SelectItem key={save} value={save}>{save}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full max-w-4xl h-[60vh] bg-black/30 rounded-lg border-2 border-stone-light flex items-center justify-center">
                {renderMapContent()}
            </div>

            <Link href="/" className="mt-8 text-brand-blue hover:underline">
                &larr; Back to Main Menu
            </Link>
        </div>
    );
};

export default ProxyMapPage;
