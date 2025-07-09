
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect, Image } from 'react-konva';
import Konva from 'konva';

const GRID_SIZE = 30;
const MAP_WIDTH_CELLS = 30;
const MAP_HEIGHT_CELLS = 20;
const UNIT_SPEED = 200; // pixels per second

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
    const [panelPosition, setPanelPosition] = useState<{ x: number, y: number } | null>(null);
    const [isUnitSelected, setIsUnitSelected] = useState(false);
    const [villagerImage, setVillagerImage] = useState<HTMLImageElement | null>(null);
    
    const stageRef = useRef<Konva.Stage>(null);
    const unitRef = useRef<Konva.Image>(null);
    const animationRef = useRef<Konva.Animation | null>(null);

    useEffect(() => {
        setIsClient(true);
        
        // Create Villager Icon from SVG
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#83a598" width="24" height="24"><path d="M12 5.5a2.5 2.5 0 010 5 2.5 2.5 0 010-5zM12 15c-3.87 0-7 1.57-7 3.5V20h14v-1.5c0-1.93-3.13-3.5-7-3.5z"/></svg>`;
        const image = new window.Image();
        image.src = `data:image/svg+xml;base64,${window.btoa(svgString)}`;
        image.onload = () => {
            setVillagerImage(image);
        };

    }, []);

    useEffect(() => {
        if (!isClient || !unitRef.current) {
            return;
        }

        const unitNode = unitRef.current;
        const layer = unitNode.getLayer();

        if (animationRef.current) {
            animationRef.current.stop();
        }

        animationRef.current = new Konva.Animation((frame) => {
            if (!frame || !unitNode) return;

            const targetX = targetPosition.x * GRID_SIZE + GRID_SIZE / 2;
            const targetY = targetPosition.y * GRID_SIZE + GRID_SIZE / 2;
            
            const currentX = unitNode.x();
            const currentY = unitNode.y();

            const dx = targetX - currentX;
            const dy = targetY - currentY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                unitNode.position({ x: targetX, y: targetY });
                animationRef.current?.stop();
                return;
            }

            const moveDistance = UNIT_SPEED * (frame.timeDiff / 1000);
            const ratio = moveDistance / distance;
            
            const newX = currentX + dx * ratio;
            const newY = currentY + dy * ratio;

            unitNode.position({ x: newX, y: newY });
        }, layer);

        animationRef.current.start();

        return () => animationRef.current?.stop();
    }, [targetPosition, isClient]);

    const handleCellClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target.hasName('grid-background')) {
            setSelectedBuilding(null);
            const pos = e.target.getStage()?.getPointerPosition();
            if (pos && isUnitSelected) {
                 setTargetPosition({
                    x: Math.floor(pos.x / GRID_SIZE),
                    y: Math.floor(pos.y / GRID_SIZE),
                });
                setIsUnitSelected(false);
            } else {
                 setIsUnitSelected(false);
            }
        }
    };
    
    const handleUnitClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        e.evt.stopPropagation();
        setIsUnitSelected(true);
        setSelectedBuilding(null);
    };

    const handleBuildingClick = (building: Building, e: Konva.KonvaEventObject<MouseEvent>) => {
        e.evt.stopPropagation();
        setSelectedBuilding(building);
        setIsUnitSelected(false);
        const stage = stageRef.current;
        if (stage) {
            const rect = e.target.getClientRect();
            setPanelPosition({ x: rect.x + rect.width + 10, y: rect.y });
        }
    };
    
    const handleTrainUnit = (unitType: string) => {
        console.log(`Training ${unitType} from ${selectedBuilding?.type}`);
    };

    const renderGrid = () => {
        const grid = [];
        for (let y = 0; y < MAP_HEIGHT_CELLS; y++) {
            for (let x = 0; x < MAP_WIDTH_CELLS; x++) {
                grid.push(
                    <Rect
                        key={`${x}-${y}`}
                        x={x * GRID_SIZE}
                        y={y * GRID_SIZE}
                        width={GRID_SIZE}
                        height={GRID_SIZE}
                        fill="#504945"
                        stroke="#665c54"
                        strokeWidth={1}
                        listening={false}
                    />
                );
            }
        }
        return grid;
    };

    if (!isClient) {
        return (
             <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8">
                <h1 className="text-4xl font-serif text-brand-gold mb-4">Loading Map Engine...</h1>
             </div>
        )
    }

    const iconSize = GRID_SIZE * 0.8;

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-serif text-brand-gold mb-2">High-Performance RTS Map</h1>
            <p className="text-parchment-dark mb-4 text-sm">
                Click the villager to select it, then click a tile to move. Click a building for actions.
            </p>
            <div className="w-full max-w-4xl aspect-[3/2] bg-black rounded-lg overflow-hidden border-2 border-stone-light relative">
                 <Stage
                    ref={stageRef}
                    width={MAP_WIDTH_CELLS * GRID_SIZE}
                    height={MAP_HEIGHT_CELLS * GRID_SIZE}
                    className="mx-auto"
                    onClick={handleCellClick}
                >
                    <Layer>
                        <Rect 
                            x={0} y={0}
                            width={MAP_WIDTH_CELLS * GRID_SIZE}
                            height={MAP_HEIGHT_CELLS * GRID_SIZE}
                            name="grid-background"
                        />
                        {renderGrid()}

                        {buildings.map(building => (
                            <Rect
                                key={building.id}
                                x={building.x * GRID_SIZE}
                                y={building.y * GRID_SIZE}
                                width={building.width * GRID_SIZE}
                                height={building.height * GRID_SIZE}
                                fill="#a89984"
                                stroke="#fbf1c7"
                                strokeWidth={2}
                                shadowBlur={10}
                                shadowColor="black"
                                onClick={(e) => handleBuildingClick(building, e)}
                                onTap={(e) => handleBuildingClick(building, e)}
                                listening={true}
                            />
                        ))}
                        
                        <Image
                            ref={unitRef}
                            image={villagerImage}
                            x={5 * GRID_SIZE + GRID_SIZE / 2}
                            y={5 * GRID_SIZE + GRID_SIZE / 2}
                            width={iconSize}
                            height={iconSize}
                            offsetX={iconSize / 2}
                            offsetY={iconSize / 2}
                            stroke={isUnitSelected ? '#d79921' : undefined}
                            strokeWidth={isUnitSelected ? 2 : 0}
                            shadowColor={isUnitSelected ? '#d79921' : '#458588'}
                            shadowBlur={isUnitSelected ? 10 : 5}
                            shadowOpacity={0.7}
                            onClick={handleUnitClick}
                            onTap={handleUnitClick}
                            listening={true}
                        />
                    </Layer>
                </Stage>
                 {selectedBuilding && panelPosition && (
                    <div 
                        className="absolute bg-stone-dark/80 backdrop-blur-sm border-2 border-stone-light/50 rounded-lg p-4 shadow-lg text-parchment-light sci-fi-panel-popup"
                        style={{ top: `${panelPosition.y}px`, left: `${panelPosition.x}px` }}
                    >
                        <h4 className="text-lg font-serif text-brand-gold mb-2">{selectedBuilding.type}</h4>
                        <div className="flex flex-col gap-2">
                             <button onClick={() => handleTrainUnit('Swordsman')} className="sci-fi-button text-sm">
                                Train Swordsman
                            </button>
                             <button onClick={() => handleTrainUnit('Pikeman')} className="sci-fi-button text-sm">
                                Train Pikeman
                            </button>
                        </div>
                        <button 
                            onClick={() => setSelectedBuilding(null)} 
                            className="absolute -top-3 -right-3 w-7 h-7 bg-brand-red rounded-full text-white font-bold flex items-center justify-center border-2 border-stone-dark"
                        >
                            &times;
                        </button>
                    </div>
                )}
            </div>
             <Link href="/" className="sci-fi-button mt-6">
                Return to Main Menu
            </Link>
        </div>
    );
};

export default TestMapPage;
