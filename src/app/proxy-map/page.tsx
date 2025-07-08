
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { MapContainer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FullScreen from 'react-fullscreen-crossbrowser';

// UI and Panel Imports
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollText, Package as PackageIcon, Maximize, X } from 'lucide-react';
import { PopulationIcon, VillagerIcon, SwordIcon, AgeIcon, WatchTowerIcon, BeakerIcon } from '../../../components/icons/ResourceIcons';
import { resourceIconMap } from '../../../components/icons/iconRegistry';

// Service and Data Imports
import { loadGameState, getAllSaveNames, getAllBuildingConfigs, getAllResourceConfigs, getAllAgeConfigs, getAllUnitConfigs, getAllResearchConfigs } from '../../../services/dbService';
import { getRandomNames } from '../../../services/nameService';

// Type Imports
import type { FullGameState, BuildingConfig, ResourceConfig, BuildingInstance, ResourceNode, Villager, BuildingType, GameLogEntry, ResourceDeltas, Units, Buildings, GameTask, GameItem, ActiveBuffs, AgeConfig, UnitConfig, ResearchConfig } from '../../../types';

// Panel Component Imports
import UnitManagementPanel from '../../../components/UnitManagementPanel';
import BuildingManagementPanel from '../../../components/BuildingManagementPanel';
import AllBuildingsPanel from '../../../components/AllBuildingsPanel';
import CivilizationPanel from '../../../components/CivilizationPanel';
import InventoryPanel from '../../../components/InventoryPanel';
import ResearchPanel from '../../../components/ResearchPanel';
import BuildPanel from '../../../components/BuildPanel';

const MAP_DIMENSIONS = { width: 25, height: 18 };

interface MappedVillager extends Villager {
    position: L.LatLngTuple;
}

const HeaderStat: React.FC<{ icon: React.ReactNode; value: string | number; tooltip: string; colorClass?: string; }> = ({ icon, value, tooltip, colorClass }) => (
    <div className="relative group flex items-center space-x-2 bg-stone-dark/70 px-3 py-1 rounded-md border border-stone-light/30">
        <div className={`w-5 h-5 ${colorClass}`}>{icon}</div>
        <span className="font-bold text-md text-parchment-light">{value}</span>
        <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {tooltip}
        </div>
    </div>
);


const ProxyMapPage = () => {
    // --- Core State ---
    const [allSaves, setAllSaves] = useState<string[]>([]);
    const [selectedSave, setSelectedSave] = useState<string | null>(null);
    const [gameState, setGameState] = useState<FullGameState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // --- Config State ---
    const [allBuildingConfigs, setAllBuildingConfigs] = useState<BuildingConfig[]>([]);
    const [allResourceConfigs, setAllResourceConfigs] = useState<ResourceConfig[]>([]);
    const [allAgeConfigs, setAllAgeConfigs] = useState<AgeConfig[]>([]);
    const [allUnitConfigs, setAllUnitConfigs] = useState<UnitConfig[]>([]);
    const [allResearchConfigs, setAllResearchConfigs] = useState<ResearchConfig[]>([]);

    // --- Derived Game State for UI ---
    const [villagers, setVillagers] = useState<MappedVillager[]>([]);
    const [buildings, setBuildings] = useState<BuildingInstance[]>([]);
    const { population, currentAge, inventory, resourceDeltas, units, gameLog, activeTasks, hasResearchBuildings, completedResearch, civilization } = useMemo(() => {
        if (!gameState) return { population: { current: 0, capacity: 0 }, currentAge: 'Nomadic Age', inventory: [], resourceDeltas: {}, units: { villagers: [], military: [] }, gameLog: [], activeTasks: [], hasResearchBuildings: false, completedResearch: [], civilization: null };
        
        const capacity = Object.values(gameState.buildings).flat().reduce((acc, instance) => {
            const config = allBuildingConfigs.find(b => Object.values(gameState.buildings).flat().find(i => i.id === instance.id));
            return acc + (config?.populationCapacity || 0);
        }, 0);
        
        const currentPop = gameState.units.villagers.length + gameState.units.military.length;

        const researchBuildings = allBuildingConfigs.filter(b => b.canResearch).map(b => b.id);
        const hasResearchBuildings = Object.entries(gameState.buildings).some(([type, instances]) => researchBuildings.includes(type) && instances.length > 0);

        return {
            population: { current: currentPop, capacity: capacity },
            currentAge: gameState.currentAge,
            inventory: gameState.inventory,
            resourceDeltas: {},
            units: gameState.units,
            gameLog: gameState.gameLog,
            activeTasks: gameState.activeTasks,
            hasResearchBuildings,
            completedResearch: gameState.completedResearch,
            civilization: gameState.civilization,
        };
    }, [gameState, allBuildingConfigs]);

    // --- Interaction State ---
    const [playerAction, setPlayerAction] = useState<{ mode: 'moving_villager' | 'placing_building'; data: any; } | null>(null);
    const [placementPreview, setPlacementPreview] = useState<L.LatLngTuple | null>(null);
    const mapRef = React.useRef<L.Map>(null);

    // --- Panel State ---
    const [buildPanelState, setBuildPanelState] = useState<{ isOpen: boolean; villagerId: string | null; anchorRect: DOMRect | null }>({ isOpen: false, villagerId: null, anchorRect: null });
    const [unitManagementPanel, setUnitManagementPanel] = useState<{ isOpen: boolean; type: 'villagers' | 'military' | null; anchorRect: DOMRect | null; }>({ isOpen: false, type: null, anchorRect: null });
    const [buildingManagementPanel, setBuildingManagementPanel] = useState<{ isOpen: boolean; type: BuildingType | string | null; instanceId?: string; anchorRect: DOMRect | null; }>({ isOpen: false, type: null, anchorRect: null });
    const [allBuildingsPanel, setAllBuildingsPanel] = useState<{ isOpen: boolean; anchorRect: DOMRect | null; }>({ isOpen: false, anchorRect: null });
    const [civPanelState, setCivPanelState] = useState<{ isOpen: boolean; anchorRect: DOMRect | null; }>({ isOpen: false, anchorRect: null });
    const [inventoryPanelState, setInventoryPanelState] = useState<{ isOpen: boolean; anchorRect: DOMRect | null; }>({ isOpen: false, anchorRect: null });
    const [researchPanelState, setResearchPanelState] = useState<{ isOpen: boolean; anchorRect: DOMRect | null; }>({ isOpen: false, anchorRect: null });
    
    const closeAllPanels = useCallback(() => {
        setUnitManagementPanel({ isOpen: false, type: null, anchorRect: null });
        setBuildingManagementPanel({ isOpen: false, type: null, anchorRect: null });
        setBuildPanelState({ isOpen: false, villagerId: null, anchorRect: null });
        setCivPanelState({ isOpen: false, anchorRect: null });
        setAllBuildingsPanel({ isOpen: false, anchorRect: null });
        setInventoryPanelState({ isOpen: false, anchorRect: null });
        setResearchPanelState({ isOpen: false, anchorRect: null });
    }, []);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [saves, buildingConfigs, resourceConfigs, ageConfigs, unitConfigs, researchConfigs] = await Promise.all([
                    getAllSaveNames(),
                    getAllBuildingConfigs(),
                    getAllResourceConfigs(),
                    getAllAgeConfigs(),
                    getAllUnitConfigs(),
                    getAllResearchConfigs()
                ]);
                setAllSaves(saves);
                setAllBuildingConfigs(buildingConfigs);
                setAllResourceConfigs(resourceConfigs);
                setAllAgeConfigs(ageConfigs);
                setAllUnitConfigs(unitConfigs);
                setAllResearchConfigs(researchConfigs);

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

    // Load game state when a save is selected
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

    // --- Dummy Handlers for Panel Actions ---
    const dummyHandler = (action: string) => () => console.log(`Proxy Action: ${action} triggered. No game logic will run.`);
    const getDummyVillagerTaskDetails = () => 'Idle (Proxy)';
    const onBuildingClick = (building: BuildingInstance, e: React.MouseEvent) => {
        closeAllPanels();
        const type = Object.keys(gameState?.buildings || {}).find(key => gameState?.buildings[key as string]?.some(b => b.id === building.id));
        if (type) {
            setBuildingManagementPanel({ isOpen: true, type, instanceId: building.id, anchorRect: e.currentTarget.getBoundingClientRect() as DOMRect });
        }
    };
    
    // --- Map and Icon Logic ---
    const iconCache = useMemo(() => {
        const cache: Record<string, L.Icon> = {};
        const createIcon = (text: string, size: number, bgColor: string, fgColor: string = 'white', opacity: number = 1) => {
             const iconHtml = `<div style="width:${size}px;height:${size}px;background-color:#${bgColor};color:#${fgColor};font-size:${size*0.5}px;border-radius:50%;display:flex;justify-content:center;align-items:center;font-weight:bold;opacity:${opacity};border: 2px solid #${fgColor};">${text.substring(0,2).toUpperCase()}</div>`;
             return L.divIcon({ html: iconHtml, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2], });
        }
        allBuildingConfigs.forEach(config => { cache[config.id] = createIcon(config.name, 40, 'a89984', '3c3836'); });
        allResourceConfigs.forEach(config => {
            let color = 'f59e0b'; if (config.id === 'wood') color = 'a16207'; if (config.id === 'gold') color = 'facc15'; if (config.id === 'stone') color = 'a8a29e';
            cache[config.id] = createIcon(config.name, 28, color, '3c3836');
        });
        cache.villager = createIcon('V', 20, '83a598', 'fdf6e3');
        cache.house_preview = createIcon('H', 40, 'a89984', '3c3836', 0.5);
        cache.defaultBuilding = createIcon('?', 40, 'a89984', '3c3836'); cache.defaultResource = createIcon('?', 28, 'f59e0b', '3c3836');
        return cache;
    }, [allBuildingConfigs, allResourceConfigs]);

    const getIconForBuilding = (buildingType: BuildingType | string): L.Icon => iconCache[buildingType] || iconCache.defaultBuilding;
    const getIconForResource = (resourceType: string): L.Icon => iconCache[resourceType] || iconCache.defaultResource;

    const MapEventsHandler = () => {
        useMapEvents({
            click: (e) => {
                if (playerAction?.mode === 'moving_villager') {
                    const { villagerId } = playerAction.data;
                    setVillagers(currentVillagers => currentVillagers.map(v => v.id === villagerId ? { ...v, position: [e.latlng.lat, e.latlng.lng] } : v));
                    setPlayerAction(null); mapRef.current?.closePopup();
                } else if (playerAction?.mode === 'placing_building') {
                    const { buildingType } = playerAction.data;
                    const buildingInfo = allBuildingConfigs.find(b => b.id === buildingType);
                    if (!buildingInfo) return;
                    const newBuilding: BuildingInstance = { id: `proxy-${buildingType}-${Date.now()}`, name: getRandomNames('building', 1)[0], position: { x: e.latlng.lng + MAP_DIMENSIONS.width / 2, y: -e.latlng.lat + MAP_DIMENSIONS.height / 2 }, currentHp: buildingInfo.hp };
                    setBuildings(prev => [...prev, newBuilding]);
                    setPlayerAction(null); setPlacementPreview(null); mapRef.current?.closePopup();
                }
            },
            mousemove: (e) => { if (playerAction?.mode === 'placing_building') setPlacementPreview([e.latlng.lat, e.latlng.lng]); },
            contextmenu: () => { if (playerAction) { setPlayerAction(null); setPlacementPreview(null); } }
        });
        return null;
    };

    const totalBuildingsCount = buildings.length;
    const busyVillagerCount = units.villagers.filter(v => v.currentTask).length;
    const militaryUnitCounts = units.military.reduce((acc, unit) => { acc[unit.unitType] = (acc[unit.unitType] || 0) + 1; return acc; }, {} as Record<string, number>);

    return (
        <FullScreen enabled={isFullScreen} onChange={setIsFullScreen}>
            <div className={`min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-4 transition-all duration-300 ${isFullScreen ? '' : 'sm:p-8'}`}>
                 {!isFullScreen && (
                    <div className="w-full max-w-4xl text-center">
                        <h1 className="text-4xl font-serif text-brand-gold mb-2">Proxy Map Development</h1>
                        <p className="text-parchment-dark mb-4">A sandbox for developing new map interactions.</p>
                        <div className="flex justify-center gap-4 w-full max-w-sm mx-auto mb-4">
                            <Select value={selectedSave || ''} onValueChange={setSelectedSave} disabled={isLoading || allSaves.length === 0}>
                                <SelectTrigger className="sci-fi-input flex-grow"><SelectValue placeholder={isLoading ? "Loading saves..." : "Select a saved game..."} /></SelectTrigger>
                                <SelectContent>{allSaves.map(save => <SelectItem key={save} value={save}>{save}</SelectItem>)}</SelectContent>
                            </Select>
                            <Link href="/" className="sci-fi-button !px-4"> &larr; Menu</Link>
                        </div>
                    </div>
                )}
                
                <main className={`w-full max-w-7xl mx-auto flex-grow flex flex-col ${isFullScreen ? 'h-screen' : 'h-[80vh]'} ${gameState ? '' : 'items-center justify-center'}`}>
                    {isLoading || !gameState ? (
                        <p>Loading game data...</p>
                    ) : (
                        <div className="w-full h-full p-2 sm:p-4 rounded-lg shadow-2xl border-2 border-stone-light flex flex-col space-y-2 sm:space-y-4 bg-stone-dark">
                            <header className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                                <button onClick={(e) => { e.stopPropagation(); setCivPanelState({isOpen: true, anchorRect: e.currentTarget.getBoundingClientRect()})}} className="flex items-center space-x-2 text-brand-gold hover:text-yellow-400 transition-colors">
                                    <div className="w-8 h-8"><AgeIcon/></div>
                                    <h2 className="text-xl sm:text-2xl font-serif text-parchment-light">{currentAge}</h2>
                                    <div className="w-5 h-5 text-parchment-dark/70 ml-1"><ScrollText /></div>
                                </button>
                                <HeaderStat icon={<PopulationIcon/>} value={`${population.current}/${population.capacity}`} tooltip="Population / Capacity" colorClass="text-brand-blue" />
                                <div className="hidden md:flex items-center space-x-2">
                                   {allResourceConfigs.filter(r => r.isActive).map(resource => <HeaderStat key={resource.id} icon={React.createElement(resourceIconMap[resource.iconId] || resourceIconMap.default)} value={Math.floor(gameState.resources[resource.id] || 0)} delta={resourceDeltas[resource.id]} tooltip={resource.name}/>)}
                                </div>
                                 <button onClick={() => setIsFullScreen(f => !f)} className="p-2 text-parchment-light hover:text-brand-gold transition-colors">{isFullScreen ? <X /> : <Maximize />}</button>
                            </header>

                            <div className="relative flex-grow">
                                <MapContainer ref={mapRef} center={[0, 0]} zoom={5} style={{ height: '100%', width: '100%', backgroundColor: '#1d2021' }} className="rounded-lg" crs={L.CRS.Simple} maxBounds={L.latLngBounds([-50, -50], [50, 50])} minZoom={4}>
                                    <MapEventsHandler />
                                    {buildings.map((instance: BuildingInstance) => { const buildingType = allBuildingConfigs.find(conf => conf.name === instance.name.replace(/#\d+$/, '').trim())?.id || Object.keys(gameState.buildings).find(key => gameState.buildings[key].some(b => b.id === instance.id)) || 'defaultBuilding'; return <Marker key={instance.id} position={[-instance.position.y + MAP_DIMENSIONS.height/2, instance.position.x - MAP_DIMENSIONS.width/2]} icon={getIconForBuilding(buildingType as BuildingType)} eventHandlers={{click: (e) => onBuildingClick(instance, e.originalEvent)}}><Popup>{instance.name} ({buildingType})</Popup></Marker>})}
                                    {gameState.resourceNodes.map((node: ResourceNode) => <Marker key={node.id} position={[-node.position.y + MAP_DIMENSIONS.height/2, node.position.x - MAP_DIMENSIONS.width/2]} icon={getIconForResource(node.type)}><Popup>{node.type} Node (Amount: {Math.floor(node.amount)})</Popup></Marker>)}
                                    {villagers.map((villager) => <Marker key={villager.id} position={villager.position} icon={iconCache.villager}><Popup><div className="flex flex-col gap-2 w-28"><p className="font-bold text-center">{villager.name}</p><Button size="sm" onClick={() => setPlayerAction({ mode: 'moving_villager', data: { villagerId: villager.id } })}>Move</Button><Button size="sm" onClick={(e) => { closeAllPanels(); setBuildPanelState({ isOpen: true, villagerId: villager.id, anchorRect: e.currentTarget.getBoundingClientRect() }) }}>Build</Button></div></Popup></Marker>)}
                                    {placementPreview && playerAction?.mode === 'placing_building' && <Marker position={placementPreview} icon={iconCache.house_preview}></Marker>}
                                </MapContainer>

                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4">
                                     <div className="relative group"><button onClick={(e) => { closeAllPanels(); setUnitManagementPanel({ isOpen: true, type: 'villagers', anchorRect: e.currentTarget.getBoundingClientRect()})}} className="sci-fi-button flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 !rounded-lg"><div className="w-6 h-6 sm:w-7 sm:h-7 text-brand-blue"><VillagerIcon /></div><span className="text-lg sm:text-xl font-bold">{units.villagers.length}</span></button></div>
                                     <div className="relative group"><button onClick={(e) => { closeAllPanels(); setUnitManagementPanel({ isOpen: true, type: 'military', anchorRect: e.currentTarget.getBoundingClientRect()})}} className="sci-fi-button flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 !rounded-lg"><div className="w-6 h-6 sm:w-7 sm:h-7 text-brand-red"><SwordIcon /></div><span className="text-lg sm:text-xl font-bold">{units.military.length}</span></button></div>
                                     <div className="relative group"><button onClick={(e) => { closeAllPanels(); setAllBuildingsPanel({isOpen: true, anchorRect: e.currentTarget.getBoundingClientRect()})}} className="sci-fi-button flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 !rounded-lg"><div className="w-6 h-6 sm:w-7 sm:h-7 text-parchment-dark"><WatchTowerIcon /></div><span className="text-lg sm:text-xl font-bold">{totalBuildingsCount}</span></button></div>
                                     <div className="relative group"><button onClick={(e) => { closeAllPanels(); setInventoryPanelState({isOpen: true, anchorRect: e.currentTarget.getBoundingClientRect()})}} className="sci-fi-button flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 !rounded-lg"><div className="w-6 h-6 sm:w-7 sm:h-7 text-brand-gold"><PackageIcon /></div><span className="text-lg sm:text-xl font-bold">{inventory.length}</span></button></div>
                                     {hasResearchBuildings && <div className="relative group"><button onClick={(e) => { closeAllPanels(); setResearchPanelState({isOpen: true, anchorRect: e.currentTarget.getBoundingClientRect()})}} className="sci-fi-button flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 !rounded-lg"><div className="w-6 h-6 sm:w-7 sm:h-7 text-brand-green"><BeakerIcon /></div></button></div>}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
                
                {/* Render All Panels (logic is mostly placeholders) */}
                {gameState && (
                    <>
                         <BuildPanel isOpen={buildPanelState.isOpen} onClose={() => setBuildPanelState({ isOpen: false, villagerId: null, anchorRect: null })} onStartPlacement={(bt) => {setPlayerAction({mode: 'placing_building', data: { buildingType: bt }}); closeAllPanels();}} resources={gameState.resources} buildingCounts={Object.keys(gameState.buildings).reduce((acc, k) => ({...acc, [k]: gameState.buildings[k].length}), {})} buildingList={allBuildingConfigs} anchorRect={buildPanelState.anchorRect} />
                         <UnitManagementPanel isOpen={unitManagementPanel.isOpen} onClose={closeAllPanels} type={unitManagementPanel.type} units={units} onUpdateUnit={dummyHandler('update unit')} onDismissUnit={dummyHandler('dismiss unit')} onInitiateBuild={(vid, rect) => { closeAllPanels(); setBuildPanelState({ isOpen: true, villagerId: vid, anchorRect: rect })}} getVillagerTaskDetails={getDummyVillagerTaskDetails} anchorRect={unitManagementPanel.anchorRect} />
                         <BuildingManagementPanel isOpen={buildingManagementPanel.isOpen} onClose={closeAllPanels} panelState={buildingManagementPanel} buildings={gameState.buildings} buildingList={allBuildingConfigs} onUpdateBuilding={dummyHandler('update building')} onDemolishBuilding={dummyHandler('demolish building')} onTrainUnits={dummyHandler('train units')} onTrainVillagers={dummyHandler('train villagers')} onUpgradeBuilding={dummyHandler('upgrade building')} resources={gameState.resources} population={population} unitList={allUnitConfigs} onAdvanceAge={dummyHandler('advance age')} activeTasks={activeTasks} anchorRect={buildingManagementPanel.anchorRect} masterResearchList={allResearchConfigs} completedResearch={completedResearch} onStartResearch={dummyHandler('start research')} currentAge={currentAge} ageProgressionList={allAgeConfigs} />
                         <AllBuildingsPanel isOpen={allBuildingsPanel.isOpen} onClose={closeAllPanels} buildingList={allBuildingConfigs} buildingCounts={Object.keys(gameState.buildings).reduce((acc, k) => ({...acc, [k]: gameState.buildings[k].length}), {})} activeTasks={activeTasks} onOpenBuildingPanel={(type, id, rect) => { closeAllPanels(); setBuildingManagementPanel({isOpen: true, type, instanceId: id, anchorRect: rect})}} anchorRect={allBuildingsPanel.anchorRect} />
                         <CivilizationPanel isOpen={civPanelState.isOpen} onClose={closeAllPanels} civilization={civilization} anchorRect={civPanelState.anchorRect} />
                         <InventoryPanel isOpen={inventoryPanelState.isOpen} onClose={closeAllPanels} inventory={inventory} onUseItem={dummyHandler('use item')} activeTasks={activeTasks} activeBuffs={gameState.activeBuffs} anchorRect={inventoryPanelState.anchorRect} />
                         <ResearchPanel isOpen={researchPanelState.isOpen} onClose={closeAllPanels} masterResearchList={allResearchConfigs} completedResearch={completedResearch} activeTasks={activeTasks} resources={gameState.resources} currentAge={currentAge} ageProgressionList={allAgeConfigs} onStartResearch={dummyHandler('start research')} />
                    </>
                )}

            </div>
        </FullScreen>
    );
};

export default ProxyMapPage;
