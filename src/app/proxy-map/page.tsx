
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { MapContainer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { loadGameState, getAllSaveNames, getAllBuildingConfigs, getAllResourceConfigs } from '../../../services/dbService';
import { getRandomNames } from '../../../services/nameService';
import type { FullGameState, BuildingConfig, ResourceConfig, BuildingInstance, ResourceNode, Villager, BuildingType } from '../../../types';

// Define the grid dimensions of our game map
const MAP_DIMENSIONS = { width: 25, height: 18 };

interface MappedVillager extends Villager {
    position: L.LatLngTuple;
}

const ProxyMapPage = () => {
    // State to hold all game data
    const [allSaves, setAllSaves] = useState<string[]>([]);
    const [selectedSave, setSelectedSave] = useState<string | null>(null);
    const [gameState, setGameState] = useState<FullGameState | null>(null);
    const [allBuildingConfigs, setAllBuildingConfigs] = useState<BuildingConfig[]>([]);
    const [allResourceConfigs, setAllResourceConfigs] = useState<ResourceConfig[]>([]);
    const [villagers, setVillagers] = useState<MappedVillager[]>([]);
    const [buildings, setBuildings] = useState<BuildingInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [playerAction, setPlayerAction] = useState<{
        mode: 'moving_villager' | 'placing_building';
        data: any;
    } | null>(null);
    
    const [placementPreview, setPlacementPreview] = useState<L.LatLngTuple | null>(null);
    const mapRef = React.useRef<L.Map>(null);

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
                    
                    const tcPosition = state.buildings.townCenter?.[0]?.position || { x: MAP_DIMENSIONS.width / 2, y: MAP_DIMENSIONS.height / 2 };
                    const mappedVillagers = state.units.villagers.map(v => ({
                        ...v,
                        position: [
                            -(tcPosition.y - MAP_DIMENSIONS.height / 2 + (Math.random() - 0.5) * 4),
                            tcPosition.x - MAP_DIMENSIONS.width / 2 + (Math.random() - 0.5) * 4
                        ] as L.LatLngTuple
                    }));
                    setVillagers(mappedVillagers);
                    setBuildings(Object.values(state.buildings).flat());
                }
            };
            fetchGameState();
        } else {
            setGameState(null);
            setVillagers([]);
            setBuildings([]);
        }
    }, [selectedSave]);

    const iconCache = useMemo(() => {
        const cache: Record<string, L.Icon> = {};
        
        const createIcon = (text: string, size: number, bgColor: string, fgColor: string = 'white', opacity: number = 1) => {
             const iconHtml = `<div style="width:${size}px;height:${size}px;background-color:#${bgColor};color:#${fgColor};font-size:${size*0.5}px;border-radius:50%;display:flex;justify-content:center;align-items:center;font-weight:bold;opacity:${opacity};border: 2px solid #${fgColor};">${text.substring(0,2).toUpperCase()}</div>`;
             return L.divIcon({
                html: iconHtml,
                className: '',
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
                popupAnchor: [0, -size / 2],
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
        
        cache.villager = createIcon('V', 20, '83a598', 'fdf6e3');
        cache.house_preview = createIcon('H', 40, 'a89984', '3c3836', 0.5);

        cache.defaultBuilding = createIcon('?', 40, 'a89984', '3c3836');
        cache.defaultResource = createIcon('?', 28, 'f59e0b', '3c3836');

        return cache;
    }, [allBuildingConfigs, allResourceConfigs]);

    const getIconForBuilding = (buildingType: BuildingType | string): L.Icon => {
        return iconCache[buildingType] || iconCache.defaultBuilding;
    };
    
    const getIconForResource = (resourceType: string): L.Icon => {
        return iconCache[resourceType] || iconCache.defaultResource;
    };

    // This component will handle all our map-level events
    const MapEventsHandler = () => {
        useMapEvents({
            click: (e) => {
                if (playerAction?.mode === 'moving_villager') {
                    const { villagerId } = playerAction.data;
                    setVillagers(currentVillagers => 
                        currentVillagers.map(v => 
                            v.id === villagerId ? { ...v, position: [e.latlng.lat, e.latlng.lng] } : v
                        )
                    );
                    setPlayerAction(null);
                    mapRef.current?.closePopup();
                } else if (playerAction?.mode === 'placing_building') {
                    const { buildingType } = playerAction.data;
                    const buildingInfo = allBuildingConfigs.find(b => b.id === buildingType);
                    if (!buildingInfo) return;

                    const newBuilding: BuildingInstance = {
                        id: `proxy-${buildingType}-${Date.now()}`,
                        name: getRandomNames('building', 1)[0],
                        position: { x: e.latlng.lng + MAP_DIMENSIONS.width / 2, y: -e.latlng.lat + MAP_DIMENSIONS.height / 2 },
                        currentHp: buildingInfo.hp
                    };
                    setBuildings(prev => [...prev, newBuilding]);
                    setPlayerAction(null);
                    setPlacementPreview(null);
                    mapRef.current?.closePopup();
                }
            },
            mousemove: (e) => {
                 if (playerAction?.mode === 'placing_building') {
                    setPlacementPreview([e.latlng.lat, e.latlng.lng]);
                }
            },
            contextmenu: () => { // Right click to cancel
                if (playerAction) {
                    setPlayerAction(null);
                    setPlacementPreview(null);
                }
            }
        });
        return null;
    };


    const renderMapContent = () => {
        if (isLoading) {
            return <p className="text-center p-8">Loading game data...</p>;
        }
        if (!gameState) {
            return <p className="text-center p-8">Select a saved game to view its map.</p>;
        }

        const transformCoords = (pos: { x: number, y: number }): L.LatLngExpression => {
            const y = -(pos.y - MAP_DIMENSIONS.height / 2);
            const x = pos.x - MAP_DIMENSIONS.width / 2;
            return [y, x];
        };
        
        let cursorClass = '';
        if (playerAction?.mode === 'moving_villager') cursorClass = 'cursor-move';
        if (playerAction?.mode === 'placing_building') cursorClass = 'cursor-copy';

        return (
            <MapContainer
                ref={mapRef}
                center={[0, 0]}
                zoom={5}
                style={{ height: '100%', width: '100%', backgroundColor: '#1d2021' }}
                className={`rounded-lg ${cursorClass}`}
                crs={L.CRS.Simple}
                maxBounds={L.latLngBounds([-50, -50], [50, 50])}
                minZoom={4}
            >
                <MapEventsHandler />

                {/* Render Buildings */}
                {buildings.map((instance: BuildingInstance) => {
                    const buildingType = allBuildingConfigs.find(conf => conf.name === instance.name.replace(/#\d+$/, '').trim())?.id || Object.keys(gameState.buildings).find(key => gameState.buildings[key].some(b => b.id === instance.id)) || 'defaultBuilding'
                    return (
                        <Marker key={instance.id} position={transformCoords(instance.position)} icon={getIconForBuilding(buildingType as BuildingType)}>
                            <Popup>{instance.name} ({buildingType})</Popup>
                        </Marker>
                    )
                })}

                {/* Render Resource Nodes */}
                {gameState.resourceNodes.map((node: ResourceNode) => (
                    <Marker key={node.id} position={transformCoords(node.position)} icon={getIconForResource(node.type)}>
                        <Popup>{node.type} Node (Amount: {Math.floor(node.amount)})</Popup>
                    </Marker>
                ))}

                {/* Render Villagers */}
                {villagers.map((villager) => (
                    <Marker key={villager.id} position={villager.position} icon={iconCache.villager}>
                        <Popup>
                            <div className="flex flex-col gap-2 w-28">
                                <p className="font-bold text-center">{villager.name}</p>
                                <Button size="sm" onClick={() => setPlayerAction({ mode: 'moving_villager', data: { villagerId: villager.id } })}>Move</Button>
                                <Button size="sm" onClick={() => setPlayerAction({ mode: 'placing_building', data: { buildingType: 'houses' }})}>Build House</Button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
                
                {/* Render placement preview */}
                {placementPreview && playerAction?.mode === 'placing_building' && (
                    <Marker position={placementPreview} icon={iconCache.house_preview}></Marker>
                )}
            </MapContainer>
        );
    };

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8">
            <h1 className="text-4xl font-serif text-brand-gold mb-2">Proxy Map Development</h1>
            <p className="text-parchment-dark mb-4">A sandbox for developing new map interactions.</p>
            
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
