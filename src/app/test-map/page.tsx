
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect, Group } from 'react-konva';
import Konva from 'konva';
import AnimatedVillager from '../../../components/AnimatedVillager';

const GRID_SIZE = 30;
const MAP_WIDTH_CELLS = 30;
const MAP_HEIGHT_CELLS = 20;
const UNIT_SPEED = 120; // pixels per second

interface Building {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'Barracks' | 'Town Center';
}

const TestMapPage = () => {
    const [isClient, setIsClient] = useState(false);
    const [targetPosition, setTargetPosition] = useState({ x: 5, y: 5 });
    const [buildings, setBuildings] = useState<Building[]>([
        { id: 1, x: 15, y: 8, width: 3, height: 3, type: 'Barracks' },
    ]);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [buildingPanelPosition, setBuildingPanelPosition] = useState<{ x: number, y: number } | null>(null);
    
    const [isUnitSelected, setIsUnitSelected] = useState(false);
    const [unitActionPanel, setUnitActionPanel] = useState<{ x: number, y: number } | null>(null);
    const [isMoveMode, setIsMoveMode] = useState(false);
    const [isMoving, setIsMoving] = useState(false);

    const stageRef = useRef<Konva.Stage>(null);
    const villagerRef = useRef<Konva.Group>(null);
    const animationRef = useRef<Konva.Animation | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient || !villagerRef.current) return;

        const villagerNode = villagerRef.current;
        const layer = villagerNode.getLayer();
        if (!layer) return;

        if (animationRef.current) animationRef.current.stop();
        
        animationRef.current = new Konva.Animation((frame) => {
            if (!frame || !villagerNode) return;

            const targetX = targetPosition.x * GRID_SIZE + GRID_SIZE / 2;
            const targetY = targetPosition.y * GRID_SIZE + GRID_SIZE / 2;
            const currentX = villagerNode.x();
            const currentY = villagerNode.y();

            const dx = targetX - currentX;
            const dy = targetY - currentY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                if (isMoving) {
                    setIsMoving(false);
                }
                return;
            } 
            
            if (!isMoving) setIsMoving(true);
            
            const moveDistance = UNIT_SPEED * (frame.timeDiff / 1000);
            const ratio = Math.min(1, moveDistance / distance);
            villagerNode.position({ x: currentX + dx * ratio, y: currentY + dy * ratio });

        }, layer);

        animationRef.current.start();
        return () => animationRef.current?.stop();
    }, [targetPosition, isClient, isMoving]);

    const handleCellClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (unitActionPanel) setUnitActionPanel(null);
        if (selectedBuilding) setSelectedBuilding(null);
        
        if (isMoveMode && e.target.hasName('grid-background')) {
            const pos = e.target.getStage()?.getPointerPosition();
            if (pos) {
                 setTargetPosition({
                    x: Math.floor(pos.x / GRID_SIZE),
                    y: Math.floor(pos.y / GRID_SIZE),
                });
            }
            setIsMoveMode(false);
            setIsUnitSelected(false);
        }
    };
    
    const handleUnitClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        e.evt.stopPropagation();
        setIsUnitSelected(true);
        setSelectedBuilding(null);

        const stage = stageRef.current;
        const villagerNode = villagerRef.current;
        if (stage && villagerNode) {
            const pos = villagerNode.getAbsolutePosition();
            const stagePos = stage.container().getBoundingClientRect();
            setUnitActionPanel({ 
                x: pos.x + stagePos.left, 
                y: pos.y + stagePos.top - (60)
            });
        }
    };

    const handleBuildingClick = (building: Building, e: Konva.KonvaEventObject<MouseEvent>) => {
        e.evt.stopPropagation();
        setSelectedBuilding(building);
        setIsUnitSelected(false);
        setUnitActionPanel(null);
        const stage = stageRef.current;
        if (stage) {
            const rect = e.target.getClientRect();
            const stagePos = stage.container().getBoundingClientRect();
            setBuildingPanelPosition({ x: rect.x + stagePos.left + rect.width + 10, y: rect.y + stagePos.top });
        }
    };

    const handleTrainUnit = (unitType: string) => console.log(`Training ${unitType} from ${selectedBuilding?.type}`);
    const handleInitiateMove = () => { setIsMoveMode(true); setUnitActionPanel(null); };
    const handleInitiateBuild = () => { console.log("Initiating build menu..."); setUnitActionPanel(null); setIsUnitSelected(false); };
    
    const renderGrid = () => Array.from({ length: MAP_WIDTH_CELLS * MAP_HEIGHT_CELLS }).map((_, i) => {
        const x = i % MAP_WIDTH_CELLS;
        const y = Math.floor(i / MAP_WIDTH_CELLS);
        return <Rect key={`${x}-${y}`} x={x*GRID_SIZE} y={y*GRID_SIZE} width={GRID_SIZE} height={GRID_SIZE} fill="#504945" stroke="#665c54" strokeWidth={1} listening={false}/>
    });

    if (!isClient) return <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8"><h1 className="text-4xl font-serif text-brand-gold mb-4">Loading Map Engine...</h1></div>;

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-serif text-brand-gold mb-2">High-Performance RTS Map</h1>
            <p className="text-parchment-dark mb-4 text-sm">Click the villager, then 'Move', then a tile. Click a building for actions.</p>
            <div className="w-full max-w-4xl aspect-[3/2] bg-black rounded-lg overflow-hidden border-2 border-stone-light relative">
                 <Stage ref={stageRef} width={MAP_WIDTH_CELLS * GRID_SIZE} height={MAP_HEIGHT_CELLS * GRID_SIZE} className="mx-auto" onClick={handleCellClick}>
                    <Layer>
                        <Rect x={0} y={0} width={MAP_WIDTH_CELLS*GRID_SIZE} height={MAP_HEIGHT_CELLS*GRID_SIZE} name="grid-background" listening={true}/>
                        {renderGrid()}
                        {buildings.map(building => <Rect key={building.id} x={building.x*GRID_SIZE} y={y*GRID_SIZE} width={building.width*GRID_SIZE} height={building.height*GRID_SIZE} fill="#a89984" stroke="#fbf1c7" strokeWidth={2} shadowBlur={10} shadowColor="black" draggable onDragEnd={(e)=>{const newX=Math.round(e.target.x()/GRID_SIZE);const newY=Math.round(e.target.y()/GRID_SIZE);e.target.position({x:newX*GRID_SIZE,y:newY*GRID_SIZE});setBuildings(p=>p.map(b=>b.id===building.id?{...b,x:newX,y:newY}:b));}} onMouseEnter={e=>{const s=e.target.getStage();if(s)s.container().style.cursor='grab';}} onMouseLeave={e=>{const s=e.target.getStage();if(s)s.container().style.cursor='default';}} onClick={(e)=>handleBuildingClick(building,e)} onTap={(e)=>handleBuildingClick(building,e)} listening={true}/>)}
                        <AnimatedVillager
                            ref={villagerRef}
                            isMoving={isMoving}
                            x={5 * GRID_SIZE + GRID_SIZE / 2}
                            y={5 * GRID_SIZE + GRID_SIZE / 2}
                            onClick={handleUnitClick}
                            onTap={handleUnitClick}
                        />
                    </Layer>
                </Stage>
                 {selectedBuilding && buildingPanelPosition && (
                    <div className="absolute bg-stone-dark/80 backdrop-blur-sm border-2 border-stone-light/50 rounded-lg p-4 shadow-lg text-parchment-light sci-fi-panel-popup" style={{ top: `${buildingPanelPosition.y}px`, left: `${buildingPanelPosition.x}px` }}>
                        <h4 className="text-lg font-serif text-brand-gold mb-2">{selectedBuilding.type}</h4>
                        <div className="flex flex-col gap-2"><button onClick={() => handleTrainUnit('Swordsman')} className="sci-fi-button text-sm">Train Swordsman</button><button onClick={() => handleTrainUnit('Pikeman')} className="sci-fi-button text-sm">Train Pikeman</button></div>
                        <button onClick={()=>setSelectedBuilding(null)} className="absolute -top-3 -right-3 w-7 h-7 bg-brand-red rounded-full text-white font-bold flex items-center justify-center border-2 border-stone-dark">&times;</button>
                    </div>
                )}
                 {unitActionPanel && (
                    <div className="absolute bg-stone-dark/90 border border-brand-gold rounded-md p-2 flex gap-2 shadow-lg" style={{ top: `${unitActionPanel.y}px`, left: `${unitActionPanel.x}px` }}>
                        <button onClick={handleInitiateMove} className="sci-fi-button !px-3 !py-1 !text-xs">Move</button>
                        <button onClick={handleInitiateBuild} className="sci-fi-button !px-3 !py-1 !text-xs">Build</button>
                    </div>
                 )}
            </div>
             <Link href="/" className="sci-fi-button mt-6">Return to Main Menu</Link>
        </div>
    );
};

export default TestMapPage;
