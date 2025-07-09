
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect, Circle, Group } from 'react-konva';
import Konva from 'konva';

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

// A new component for our animated figure, based on the user's example.
// It's purely presentational; all animation logic is handled by the parent.
const AnimatedVillager = React.forwardRef<Konva.Group, {
    isSelected: boolean;
    leftLegRef: React.RefObject<Konva.Rect>;
    rightLegRef: React.RefObject<Konva.Rect>;
}>(({ isSelected, leftLegRef, rightLegRef }, ref) => {
    return (
        <Group ref={ref} offsetY={130}>
            {/* Body (torso) */}
            <Rect x={-40} y={-110} width={80} height={130} fill="#3b5998" stroke="black" strokeWidth={2} cornerRadius={20}/>
            {/* Left Arm */}
            <Rect x={-70} y={-100} width={30} height={90} fill="#f5d6b4" stroke="black" strokeWidth={2} cornerRadius={15}/>
            {/* Right Arm */}
            <Rect x={40} y={-100} width={30} height={90} fill="#f5d6b4" stroke="black" strokeWidth={2} cornerRadius={15}/>
            {/* Legs */}
            <Rect ref={leftLegRef} x={-30} y={20} width={30} height={110} fill="#654321" stroke="black" strokeWidth={2} cornerRadius={15}/>
            <Rect ref={rightLegRef} x={10} y={20} width={30} height={110} fill="#654321" stroke="black" strokeWidth={2} cornerRadius={15}/>
            {/* Head */}
            <Circle x={0} y={-150} radius={40} fill="#f5d6b4" stroke="black" strokeWidth={2}/>
            {/* Selection Indicator */}
            {isSelected && <Circle radius={60} y={-30} stroke="#d79921" strokeWidth={3} dash={[10, 5]} listening={false}/>}
        </Group>
    );
});
AnimatedVillager.displayName = 'AnimatedVillager';


const TestMapPage = () => {
    const [isClient, setIsClient] = useState(false);
    const [targetPosition, setTargetPosition] = useState({ x: 5, y: 5 });
    const [buildings, setBuildings] = useState<Building[]>([
        { id: 1, x: 15, y: 8, width: 3, height: 3, type: 'Barracks' },
    ]);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [panelPosition, setPanelPosition] = useState<{ x: number, y: number } | null>(null);
    const [isUnitSelected, setIsUnitSelected] = useState(false);
    const [isMoving, setIsMoving] = useState(false);

    const stageRef = useRef<Konva.Stage>(null);
    const villagerRef = useRef<Konva.Group>(null);
    const leftLegRef = useRef<Konva.Rect>(null);
    const rightLegRef = useRef<Konva.Rect>(null);
    const animationRef = useRef<Konva.Animation | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient || !villagerRef.current || !leftLegRef.current || !rightLegRef.current) {
            return;
        }

        const villagerNode = villagerRef.current;
        const leftLeg = leftLegRef.current;
        const rightLeg = rightLegRef.current;
        const layer = villagerNode.getLayer();
        if (!layer) return;

        const walkAmplitude = 5;
        const walkPeriod = 400; // ms for a full step cycle

        if (animationRef.current) {
            animationRef.current.stop();
        }

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
                if (isMoving) setIsMoving(false);
                // Reset legs to idle position
                leftLeg.y(20);
                rightLeg.y(20);
                return;
            } else if (!isMoving) {
                setIsMoving(true);
            }
            
            // Move position
            const moveDistance = UNIT_SPEED * (frame.timeDiff / 1000);
            const ratio = moveDistance / distance;
            const newX = currentX + dx * ratio;
            const newY = currentY + dy * ratio;
            villagerNode.position({ x: newX, y: newY });

            // Animate legs
            const angle = (frame.time / walkPeriod) * 2 * Math.PI;
            leftLeg.y(20 + Math.sin(angle) * walkAmplitude);
            rightLeg.y(20 - Math.sin(angle) * walkAmplitude);

        }, layer);

        animationRef.current.start();
        return () => animationRef.current?.stop();
    }, [targetPosition, isClient, isMoving]);

    const handleCellClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target.hasName('grid-background')) {
            const pos = e.target.getStage()?.getPointerPosition();
            if (pos && isUnitSelected) {
                 setTargetPosition({
                    x: Math.floor(pos.x / GRID_SIZE),
                    y: Math.floor(pos.y / GRID_SIZE),
                });
            }
            setIsUnitSelected(false);
            setSelectedBuilding(null);
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
                            listening={true}
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
                                draggable
                                onDragEnd={(e) => {
                                    const newX = Math.round(e.target.x() / GRID_SIZE);
                                    const newY = Math.round(e.target.y() / GRID_SIZE);
                                    e.target.position({ x: newX * GRID_SIZE, y: newY * GRID_SIZE });
                                    setBuildings(prev => prev.map(b => b.id === building.id ? {...b, x: newX, y: newY} : b));
                                }}
                                onMouseEnter={e => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'grab';
                                }}
                                onMouseLeave={e => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'default';
                                }}
                                onClick={(e) => handleBuildingClick(building, e)}
                                onTap={(e) => handleBuildingClick(building, e)}
                                listening={true}
                            />
                        ))}
                        
                        <Group
                            x={5 * GRID_SIZE + GRID_SIZE / 2}
                            y={5 * GRID_SIZE + GRID_SIZE / 2}
                            onClick={handleUnitClick}
                            onTap={handleUnitClick}
                            listening={true}
                            draggable={true}
                            onDragEnd={(e) => {
                                const newX = Math.round(e.target.x() / GRID_SIZE);
                                const newY = Math.round(e.target.y() / GRID_SIZE);
                                setTargetPosition({ x: newX, y: newY });
                                // Snap the group position after drag
                                e.target.position({
                                  x: newX * GRID_SIZE + GRID_SIZE / 2,
                                  y: newY * GRID_SIZE + GRID_SIZE / 2
                                });
                            }}
                        >
                            <AnimatedVillager
                                ref={villagerRef}
                                isSelected={isUnitSelected}
                                leftLegRef={leftLegRef}
                                rightLegRef={rightLegRef}
                            />
                        </Group>
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
