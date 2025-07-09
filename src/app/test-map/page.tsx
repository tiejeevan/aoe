
'use client';

import React, { useState, useEffect, useRef, forwardRef } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect, Group, Label, Tag, Text, Circle, Line, Ellipse } from 'react-konva';
import Konva from 'konva';

const GRID_SIZE = 30;
const MAP_WIDTH_CELLS = 40;
const MAP_HEIGHT_CELLS = 25;
const UNIT_SPEED = 60; // pixels per second

interface Villager {
    id: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    targetX: number;
    targetY: number;
    task: 'idle' | 'moving' | 'mining' | 'building' | 'attacking' | 'dead';
    targetMineId: string | null;
    attackTargetId: string | null;
}

interface GoldMineData {
    id: string;
    x: number;
    y: number;
    amount: number;
}

interface Building {
    id: string;
    x: number;
    y: number;
    type: 'house';
}

type PlayerAction = 
    | { mode: 'moving_villager'; data: { villagerId: string } }
    | { mode: 'placing_building'; data: { buildingType: 'house' } }
    | null;

// =================================================================
// Konva Components (Self-Contained)
// =================================================================

const scale = 0.07;

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

interface AnimatedVillagerProps extends Konva.GroupConfig {
  isMoving: boolean;
  isSelected: boolean;
  isMining: boolean;
  isDead?: boolean;
}

const AnimatedVillager = forwardRef<Konva.Group, AnimatedVillagerProps>(
  ({ isMoving, isSelected, isMining, isDead, ...groupProps }, ref) => {
    const leftUpperArm = useRef<Konva.Rect>(null);
    const leftLowerArm = useRef<Konva.Rect>(null);
    const rightUpperArm = useRef<Konva.Rect>(null);
    const rightLowerArm = useRef<Konva.Rect>(null);
    const leftUpperLeg = useRef<Konva.Rect>(null);
    const leftLowerLeg = useRef<Konva.Rect>(null);
    const rightUpperLeg = useRef<Konva.Rect>(null);
    const rightLowerLeg = useRef<Konva.Rect>(null);
    const torso = useRef<Konva.Rect>(null);
    const headGroup = useRef<Konva.Group>(null);
    const pickaxeRef = useRef<Konva.Group>(null);

    const animationRequestRef = useRef<number>();
    const startTimeRef = useRef<number>(0);
    const deathStartTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if(typeof window !== 'undefined'){
            startTimeRef.current = performance.now();
        }
    }, []);

    const resetToIdle = () => {
        const allRefs = [leftUpperArm, rightUpperArm, leftUpperLeg, rightUpperLeg, leftLowerArm, rightLowerArm, leftLowerLeg, rightLowerLeg, headGroup];
        allRefs.forEach(limbRef => {
            if(limbRef.current) limbRef.current.rotation(0);
        });
        if (torso.current) torso.current.y(-50 * scale);
        if (headGroup.current) headGroup.current.y(-70 * scale);
        if (pickaxeRef.current) pickaxeRef.current.visible(false);
    };

    useEffect(() => {
      const node = (ref as React.RefObject<Konva.Group>)?.current;
      if (!node) return;

      if (animationRequestRef.current) {
        cancelAnimationFrame(animationRequestRef.current);
      }

      if (isDead) {
        if (deathStartTimeRef.current === null) {
          deathStartTimeRef.current = performance.now();
          resetToIdle();
          node.filters([Konva.Filters.Grayscale]);
          node.cache();
        }

        const animateDeath = (now: number) => {
          const elapsed = now - (deathStartTimeRef.current || now);
          const duration = 700; // 0.7 second death animation
          const progress = Math.min(elapsed / duration, 1);
          
          node.rotation(90 * progress);
          node.opacity(1 - 0.4 * progress);

          if (progress < 1) {
            animationRequestRef.current = requestAnimationFrame(animateDeath);
          }
        };

        animationRequestRef.current = requestAnimationFrame(animateDeath);
        return;
      }
      
      // Reset death state if villager is not dead anymore
      if (deathStartTimeRef.current !== null) {
        deathStartTimeRef.current = null;
        node.rotation(0);
        node.opacity(1);
        node.filters([]);
        node.cache();
      }

      if (isMoving) {
        if (pickaxeRef.current) pickaxeRef.current.visible(false);
        const animate = () => {
          const now = performance.now();
          const elapsed = (now - startTimeRef.current) / 1000;
          const cycle = elapsed % 2;
          const progress = cycle / 2;
          const easedProgress = easeInOutQuad(progress < 0.5 ? progress * 2 : 2 - progress * 2);
          const swing = 25;

          if (leftUpperArm.current) leftUpperArm.current.rotation(swing * easedProgress);
          if (rightUpperArm.current) rightUpperArm.current.rotation(-swing * easedProgress);
          if (leftUpperLeg.current) leftUpperLeg.current.rotation(-swing * easedProgress);
          if (rightUpperLeg.current) rightUpperLeg.current.rotation(swing * easedProgress);

          const elbowBend = 10 * Math.sin(elapsed * 5);
          const kneeBend = 15 * Math.sin(elapsed * 4);

          if (leftLowerArm.current) leftLowerArm.current.rotation(elbowBend);
          if (rightLowerArm.current) rightLowerArm.current.rotation(-elbowBend);
          if (leftLowerLeg.current) leftLowerLeg.current.rotation(kneeBend);
          if (rightLowerLeg.current) rightLowerLeg.current.rotation(-kneeBend);

          if (torso.current) torso.current.y(-50 * scale + Math.sin(elapsed * 6) * 2 * scale);
          if (headGroup.current) {
            headGroup.current.y(-70 * scale + Math.sin(elapsed * 6) * 2 * scale);
            headGroup.current.rotation(Math.sin(elapsed * 3) * 3);
          }

          animationRequestRef.current = requestAnimationFrame(animate);
        };
        animationRequestRef.current = requestAnimationFrame(animate);
      } else if (isMining) {
         if (pickaxeRef.current) pickaxeRef.current.visible(true);
         resetToIdle();

         const animateMine = () => {
            const now = performance.now();
            const elapsed = (now - startTimeRef.current) / 1000;
            const swing = easeInOutQuad((Math.sin(elapsed * 4) + 1) / 2) * 90 - 45;

            if(rightUpperArm.current) rightUpperArm.current.rotation(swing);
            if(leftUpperArm.current) leftUpperArm.current.rotation(swing);
            if(rightLowerArm.current) rightLowerArm.current.rotation(15);
            if(leftLowerArm.current) leftLowerArm.current.rotation(15);

            if (torso.current) torso.current.y(-50 * scale + Math.abs(Math.sin(elapsed * 4) * 4 * scale));
            
            animationRequestRef.current = requestAnimationFrame(animateMine);
         }
         animationRequestRef.current = requestAnimationFrame(animateMine);
      } else {
        if (animationRequestRef.current) cancelAnimationFrame(animationRequestRef.current);
        resetToIdle();
      }

      return () => {
        if (animationRequestRef.current) cancelAnimationFrame(animationRequestRef.current);
      };
    }, [isMoving, isMining, isDead, ref]);

    return (
      <Group ref={ref} {...groupProps}>
        {/* Blood Pool */}
        {isDead && (
            <Circle 
                radius={60 * scale}
                fill="#8a0303"
                y={120 * scale}
                opacity={0.5}
                shadowBlur={5}
                shadowColor="#5c0000"
                listening={false}
            />
        )}

        {/* Selection Indicator */}
        {isSelected && !isDead && (
            <Ellipse
                y={100 * scale}
                radiusX={60 * scale}
                radiusY={20 * scale}
                stroke="#d79921"
                strokeWidth={2}
                dash={[10, 5]}
            />
        )}
        
        {/* Torso */}
        <Rect
          ref={torso}
          x={-40 * scale}
          y={-50 * scale}
          width={80 * scale}
          height={140 * scale}
          fillLinearGradientStartPoint={{ x: 0, y: -50 * scale }}
          fillLinearGradientEndPoint={{ x: 0, y: 90 * scale }}
          fillLinearGradientColorStops={[0, "#a16207", 1, "#7a4b03"]}
          stroke="black"
          strokeWidth={2 * scale}
          cornerRadius={20 * scale}
        />

        {/* Left Arm Group */}
        <Group>
          <Rect
            ref={leftUpperArm}
            x={-90 * scale}
            y={-45 * scale}
            width={30 * scale}
            height={70 * scale}
            fillLinearGradientStartPoint={{ x: 0, y: -45 * scale }}
            fillLinearGradientEndPoint={{ x: 0, y: 25 * scale }}
            fillLinearGradientColorStops={[0, "#f5d6b4", 1, "#c49a6c"]}
            stroke="black"
            strokeWidth={2 * scale}
            cornerRadius={15 * scale}
            offsetX={15 * scale}
            offsetY={-5 * scale}
          />
          <Rect
            ref={leftLowerArm}
            x={-100 * scale}
            y={25 * scale}
            width={25 * scale}
            height={50 * scale}
            fillLinearGradientStartPoint={{ x: 0, y: 25 * scale }}
            fillLinearGradientEndPoint={{ x: 0, y: 75 * scale }}
            fillLinearGradientColorStops={[0, "#f5d6b4", 1, "#a07a56"]}
            stroke="black"
            strokeWidth={2 * scale}
            cornerRadius={12 * scale}
            offsetX={12.5 * scale}
            offsetY={0}
          />
        </Group>

        {/* Right Arm Group with Pickaxe */}
        <Group>
          <Rect
            ref={rightUpperArm}
            x={60 * scale}
            y={-45 * scale}
            width={30 * scale}
            height={70 * scale}
            fillLinearGradientStartPoint={{ x: 0, y: -45 * scale }}
            fillLinearGradientEndPoint={{ x: 0, y: 25 * scale }}
            fillLinearGradientColorStops={[0, "#f5d6b4", 1, "#c49a6c"]}
            stroke="black"
            strokeWidth={2 * scale}
            cornerRadius={15 * scale}
            offsetX={15 * scale}
            offsetY={-5 * scale}
          />
          <Group>
              <Rect
                ref={rightLowerArm}
                x={70 * scale}
                y={25 * scale}
                width={25 * scale}
                height={50 * scale}
                fillLinearGradientStartPoint={{ x: 0, y: 25 * scale }}
                fillLinearGradientEndPoint={{ x: 0, y: 75 * scale }}
                fillLinearGradientColorStops={[0, "#f5d6b4", 1, "#a07a56"]}
                stroke="black"
                strokeWidth={2 * scale}
                cornerRadius={12 * scale}
                offsetX={12.5 * scale}
                offsetY={0}
              />
              <Group ref={pickaxeRef} visible={false} x={80*scale} y={50*scale} rotation={45}>
                  <Rect x={0} y={-80*scale} width={8*scale} height={120*scale} fill="#8B4513" cornerRadius={2*scale} />
                  <Rect x={-20*scale} y={-90*scale} width={40*scale} height={20*scale} fill="#6c757d" cornerRadius={4*scale}/>
              </Group>
          </Group>
        </Group>

        {/* Left Leg Group */}
        <Group>
          <Rect
            ref={leftUpperLeg}
            x={-35 * scale}
            y={90 * scale}
            width={30 * scale}
            height={80 * scale}
            fillLinearGradientStartPoint={{ x: 0, y: 90 * scale }}
            fillLinearGradientEndPoint={{ x: 0, y: 170 * scale }}
            fillLinearGradientColorStops={[0, "#3c3836", 1, "#201c1a"]}
            stroke="black"
            strokeWidth={2 * scale}
            cornerRadius={15 * scale}
            offsetX={15 * scale}
            offsetY={0}
          />
          <Rect
            ref={leftLowerLeg}
            x={-35 * scale}
            y={170 * scale}
            width={25 * scale}
            height={60 * scale}
            fillLinearGradientStartPoint={{ x: 0, y: 170 * scale }}
            fillLinearGradientEndPoint={{ x: 0, y: 230 * scale }}
            fillLinearGradientColorStops={[0, "#3c3836", 1, "#0d0c0b"]}
            stroke="black"
            strokeWidth={2 * scale}
            cornerRadius={12 * scale}
            offsetX={12.5 * scale}
            offsetY={0}
          />
        </Group>

        {/* Right Leg Group */}
        <Group>
          <Rect
            ref={rightUpperLeg}
            x={15 * scale}
            y={90 * scale}
            width={30 * scale}
            height={80 * scale}
            fillLinearGradientStartPoint={{ x: 0, y: 90 * scale }}
            fillLinearGradientEndPoint={{ x: 0, y: 170 * scale }}
            fillLinearGradientColorStops={[0, "#3c3836", 1, "#201c1a"]}
            stroke="black"
            strokeWidth={2 * scale}
            cornerRadius={15 * scale}
            offsetX={15 * scale}
            offsetY={0}
          />
          <Rect
            ref={rightLowerLeg}
            x={20 * scale}
            y={170 * scale}
            width={25 * scale}
            height={60 * scale}
            fillLinearGradientStartPoint={{ x: 0, y: 170 * scale }}
            fillLinearGradientEndPoint={{ x: 0, y: 230 * scale }}
            fillLinearGradientColorStops={[0, "#3c3836", 1, "#0d0c0b"]}
            stroke="black"
            strokeWidth={2 * scale}
            cornerRadius={12 * scale}
            offsetX={12.5 * scale}
            offsetY={0}
          />
        </Group>

        {/* Head Group */}
        <Group ref={headGroup} y={-70 * scale}>
          <Circle
            x={0}
            y={-50 * scale}
            radius={40 * scale}
            fillLinearGradientStartPoint={{ x: 0, y: -90 * scale }}
            fillLinearGradientEndPoint={{ x: 0, y: -10 * scale }}
            fillLinearGradientColorStops={[0, "#f5d6b4", 1, "#c49a6c"]}
            stroke="black"
            strokeWidth={2 * scale}
          />
          <Circle x={-15 * scale} y={-60 * scale} radius={6 * scale} fill="black" />
          <Circle x={15 * scale} y={-60 * scale} radius={6 * scale} fill="black" />
          <Line
            points={[-25 * scale, -75 * scale, -5 * scale, -70 * scale]}
            stroke="black"
            strokeWidth={2 * scale}
            lineCap="round"
            tension={0.5}
          />
          <Line
            points={[5 * scale, -70 * scale, 25 * scale, -75 * scale]}
            stroke="black"
            strokeWidth={2 * scale}
            lineCap="round"
            tension={0.5}
          />
          <Line
            points={[0, -50 * scale, 0, -40 * scale]}
            stroke="#9c7b53"
            strokeWidth={1.5 * scale}
            lineCap="round"
          />
          <Line
            points={[-15 * scale, -30 * scale, 0, -20 * scale, 15 * scale, -30 * scale]}
            stroke="black"
            strokeWidth={2 * scale}
            tension={0.5}
            lineCap="round"
          />
        </Group>
      </Group>
    );
  }
);
AnimatedVillager.displayName = 'AnimatedVillager';


const AnimatedGoldMine = React.forwardRef<Konva.Group, Konva.GroupConfig>((props, ref) => {
  const pulleyRef = useRef<Konva.Group>(null);
  const bucketRef = useRef<Konva.Group>(null);
  const sparklesRef = useRef<Konva.Group>(null);
  const dustRef = useRef<Konva.Group>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const startTime = performance.now();

    const animate = () => {
      if (typeof window === 'undefined') return;
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      // Rotate pulley continuously
      if (pulleyRef.current) {
        pulleyRef.current.rotation((elapsed * 45) % 360);
      }

      // Animate bucket going up and down
      if (bucketRef.current) {
        const yPos = -20 * scale + 20 * scale * Math.sin(elapsed * 2);
        bucketRef.current.y(yPos);
      }

      // Flicker sparkles by scaling them in/out
      if (sparklesRef.current) {
        const sparkleScale = 0.8 + 0.2 * Math.sin(elapsed * 8);
        sparklesRef.current.scale({ x: sparkleScale, y: sparkleScale });
      }

      // Animate dust particles rising
      if (dustRef.current) {
        dustRef.current.children.forEach((child) => {
           const newY = (child.y() - 0.2 * scale);
           if (newY < -60 * scale) {
               child.y(0);
               child.opacity(1);
           } else {
               child.y(newY);
               child.opacity(1 - (Math.abs(newY) / (60 * scale)));
           }
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };
  }, []);
  
  return (
    <Group {...props} ref={ref}>
        {/* Cave Entrance */}
        <Rect
            x={-100 * scale}
            y={-70 * scale}
            width={200 * scale}
            height={140 * scale}
            fillLinearGradientStartPoint={{ x: 0, y: -70 * scale }}
            fillLinearGradientEndPoint={{ x: 0, y: 70 * scale }}
            fillLinearGradientColorStops={[0, "#B8860B", 0.5, "#9E6F0A", 1, "#8B4513"]}
            stroke="#201c1a"
            strokeWidth={4 * scale}
            cornerRadius={30 * scale}
        />
        <Rect
            x={-50 * scale}
            y={0}
            width={100 * scale}
            height={70 * scale}
            fill="#201c1a"
            cornerRadius={10 * scale}
        />

        {/* Gold Piles at the front */}
        <Group y={30 * scale}>
            <Rect 
                x={-40 * scale} 
                y={0} 
                width={80 * scale} 
                height={40 * scale} 
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: 0, y: 40 * scale }}
                fillLinearGradientColorStops={[0, "#FFD700", 0.7, "#DAA520"]}
                cornerRadius={15 * scale}
                rotation={-5}
            />
             <Rect 
                x={-25 * scale} 
                y={5 * scale} 
                width={50 * scale} 
                height={30 * scale} 
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: 0, y: 30 * scale }}
                fillLinearGradientColorStops={[0, "#F0E68C", 0.7, "#BDB76B"]}
                cornerRadius={10 * scale}
                rotation={10}
            />
        </Group>

        {/* Wooden Support Beams */}
        <Rect
            x={-110 * scale}
            y={-80 * scale}
            width={30 * scale}
            height={160 * scale}
            fill="#8B4513"
            stroke="black"
            strokeWidth={2 * scale}
            cornerRadius={4 * scale}
        />
        <Rect
            x={80 * scale}
            y={-80 * scale}
            width={30 * scale}
            height={160 * scale}
            fill="#8B4513"
            stroke="black"
            strokeWidth={2 * scale}
            cornerRadius={4 * scale}
        />
        <Rect
            x={-110 * scale}
            y={-90 * scale}
            width={220 * scale}
            height={20 * scale}
            fill="#A0522D"
            stroke="black"
            strokeWidth={2 * scale}
            cornerRadius={2 * scale}
        />

        {/* Pulley System */}
        <Group ref={pulleyRef} y={-100 * scale}>
            <Circle radius={20 * scale} fill="#C2B280" stroke="black" strokeWidth={2 * scale} />
            <Line points={[-5 * scale, -20 * scale, 5 * scale, 20 * scale]} stroke="black" strokeWidth={3 * scale} lineCap="round" />
            <Line points={[-20 * scale, 0, 20 * scale, 0]} stroke="black" strokeWidth={3 * scale} lineCap="round" />
        </Group>

        {/* Bucket on Rope */}
        <Group ref={bucketRef} y={-20 * scale}>
            <Line points={[0, -80 * scale, 0, 0]} stroke="#333" strokeWidth={3 * scale} />
            <Rect
            x={-15 * scale}
            y={0}
            width={30 * scale}
            height={20 * scale}
            fill="#8B4513"
            stroke="black"
            strokeWidth={1.5 * scale}
            cornerRadius={4 * scale}
            />
        </Group>

        {/* Gold Sparkles moved onto the piles */}
        <Group ref={sparklesRef} y={40 * scale}>
            {[...Array(8)].map((_, i) => (
            <Star
                key={i}
                numPoints={5}
                innerRadius={2 * scale}
                outerRadius={6 * scale}
                fill="#FFD700"
                stroke="white"
                strokeWidth={0.5 * scale}
                shadowBlur={5}
                shadowColor="#FFD700"
                x={-30 * scale + Math.random() * 60 * scale}
                y={-10 * scale + Math.random() * 20 * scale}
            />
            ))}
        </Group>

        {/* Dust Particles */}
        <Group ref={dustRef} y={60 * scale} listening={false}>
            {[...Array(10)].map((_, i) => (
            <Circle
                key={i}
                radius={4 * scale}
                fill="#ccc"
                opacity={0.4}
                x={-30 * scale + Math.random() * 60 * scale}
                y={Math.random() * -30 * scale}
            />
            ))}
        </Group>
    </Group>
  );
});
AnimatedGoldMine.displayName = 'AnimatedGoldMine';


const PickaxeIcon = React.forwardRef<Konva.Group, Konva.GroupConfig>((props, ref) => (
    <Group {...props} ref={ref} listening={false} opacity={0.8}>
      <Rect x={-12} y={-12} width={24} height={24} fill="#201c1a" cornerRadius={4} />
      <Group rotation={-45}>
          <Rect x={-2} y={-10} width={4} height={20} fill="#8B4513" />
          <Rect x={-8} y={-12} width={16} height={6} fill="#6c757d" />
      </Group>
    </Group>
));
PickaxeIcon.displayName = 'PickaxeIcon';

const House = React.forwardRef<Konva.Group, Konva.GroupConfig & { isPreview?: boolean }>(({ isPreview, ...props }, ref) => (
    <Group {...props} ref={ref} opacity={isPreview ? 0.6 : 1}>
        <Rect width={GRID_SIZE * 2} height={GRID_SIZE * 1.5} fill="#a16207" stroke="#3c3836" strokeWidth={2} cornerRadius={3} listening={false}/>
        <Konva.Line points={[0, 0, GRID_SIZE, -GRID_SIZE, GRID_SIZE * 2, 0]} closed fill="#854d0e" stroke="#3c3836" strokeWidth={2} listening={false}/>
        <Rect x={GRID_SIZE * 0.75} y={GRID_SIZE * 0.5} width={GRID_SIZE * 0.5} height={GRID_SIZE} fill="#3c3836" listening={false}/>
    </Group>
));
House.displayName = 'House';

// =================================================================
// Main Page Component
// =================================================================

const TestMapPage = () => {
    const [isClient, setIsClient] = useState(false);
    const [villagers, setVillagers] = useState<Villager[]>([]);
    const [goldMines, setGoldMines] = useState<GoldMineData[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [selectedVillagerIds, setSelectedVillagerIds] = useState<Set<string>>(new Set());
    const [selectionRect, setSelectionRect] = useState<{ x1: number, y1: number, x2: number, y2: number, visible: boolean } | null>(null);
    const [hoveredMineId, setHoveredMineId] =useState<string|null>(null);
    const [tooltipMineId, setTooltipMineId] = useState<string | null>(null);
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
    const [playerAction, setPlayerAction] = useState<PlayerAction>(null);
    const [placementPreview, setPlacementPreview] = useState<{x: number, y: number} | null>(null);

    const stageRef = useRef<Konva.Stage>(null);
    const layerRef = useRef<Konva.Layer>(null);
    const villagerRefs = useRef<Record<string, Konva.Group>>({});
    const goldMineRefs = useRef<Record<string, Konva.Group>>({});
    const isSelecting = useRef(false);
    const lastAttackTimes = useRef<Record<string, number>>({});

    // Use refs for animation loop to prevent re-creating the animation on every render
    const villagersRef = useRef(villagers);
    useEffect(() => {
        villagersRef.current = villagers;
    }, [villagers]);

    const goldMinesRef = useRef(goldMines);
    useEffect(() => {
        goldMinesRef.current = goldMines;
    }, [goldMines]);
    
    useEffect(() => {
        setIsClient(true);
        const initialVillagers: Villager[] = [];
        for (let i = 0; i < 5; i++) {
            const id = `villager-${i}`;
            const x = (Math.floor(Math.random() * 5) + 3) * GRID_SIZE;
            const y = (Math.floor(Math.random() * 5) + 3) * GRID_SIZE;
            initialVillagers.push({ id, x, y, hp: 10, maxHp: 10, targetX: x, targetY: y, task: 'idle', targetMineId: null, attackTargetId: null });
        }
        setVillagers(initialVillagers);
        
        setGoldMines([{ id: 'gold-mine-1', x: 25 * GRID_SIZE, y: 12 * GRID_SIZE, amount: 5000 }]);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === ' ') { e.preventDefault(); setIsSpacebarPressed(true); }};
        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') setIsSpacebarPressed(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, []);
    
    // Main Game Loop
    useEffect(() => {
        if (!isClient || !layerRef.current) return;

        let logicTickAccumulator = 0;
        const GAME_TICK_INTERVAL = 250; // ms

        const anim = new Konva.Animation(frame => {
            if (!frame) return;
            const timeDiff = frame.timeDiff;
            logicTickAccumulator += timeDiff;

            const villagersToUpdate = [...villagersRef.current];

            // --- Visual & Position Update (every frame) ---
            villagersToUpdate.forEach(villager => {
                if (villager.task === 'dead') return;
                
                const node = villagerRefs.current[villager.id];
                if (!node) return;

                const dx = villager.targetX - villager.x;
                const dy = villager.targetY - villager.y;
                const distance = Math.hypot(dx, dy);
                
                if (distance < 5) { // Close enough, snap to position and stop moving
                    villager.x = villager.targetX;
                    villager.y = villager.targetY;
                } else {
                    const moveDistance = UNIT_SPEED * (timeDiff / 1000);
                    const ratio = Math.min(1, moveDistance / distance);
                    villager.x += dx * ratio;
                    villager.y += dy * ratio;
                }
                node.position({ x: villager.x, y: villager.y });
            });


            // --- Logic Update (every GAME_TICK_INTERVAL) ---
            if (logicTickAccumulator > GAME_TICK_INTERVAL) {
                logicTickAccumulator = logicTickAccumulator % GAME_TICK_INTERVAL;

                const ATTACK_POWER = 2;
                const ATTACK_RANGE = GRID_SIZE * 1.5;
                const ATTACK_COOLDOWN = 1500;
                const MINE_RATE_PER_VILLAGER = 5;

                const damageToApply = new Map<string, number>();
                const goldToGain = new Map<string, number>();
                const now = Date.now();
                let villagersStateChanged = false;

                villagersToUpdate.forEach(villager => {
                    if (villager.task === 'dead') return;

                    const distanceToTarget = Math.hypot(villager.targetX - villager.x, villager.targetY - villager.y);
                    if (distanceToTarget < 5) {
                        if (villager.task === 'moving') {
                            villagersStateChanged = true;
                            if (villager.targetMineId) villager.task = 'mining';
                            else villager.task = 'idle';
                        }
                    }

                    if (villager.task === 'attacking' && villager.attackTargetId) {
                        const target = villagersToUpdate.find(v => v.id === villager.attackTargetId);
                        if (!target || target.task === 'dead') {
                            villager.task = 'idle';
                            villager.attackTargetId = null;
                            villagersStateChanged = true;
                        } else {
                            const distanceToTarget = Math.hypot(target.x - villager.x, target.y - villager.y);
                            if (distanceToTarget <= ATTACK_RANGE) {
                                villager.targetX = villager.x; // Stop moving
                                villager.targetY = villager.y;
                                if (now - (lastAttackTimes.current[villager.id] || 0) > ATTACK_COOLDOWN) {
                                    const currentDamage = damageToApply.get(target.id) || 0;
                                    damageToApply.set(target.id, currentDamage + ATTACK_POWER);
                                    lastAttackTimes.current[villager.id] = now;
                                }
                            } else { // Chase target
                                villager.targetX = target.x;
                                villager.targetY = target.y;
                            }
                        }
                    }

                    if (villager.task === 'mining' && villager.targetMineId) {
                        const currentGold = goldToGain.get(villager.targetMineId) || 0;
                        goldToGain.set(villager.targetMineId, currentGold + MINE_RATE_PER_VILLAGER * (GAME_TICK_INTERVAL / 1000));
                    }
                });

                if (damageToApply.size > 0) {
                    villagersStateChanged = true;
                    damageToApply.forEach((totalDamage, targetId) => {
                        const target = villagersToUpdate.find(v => v.id === targetId);
                        if (target) {
                            target.hp = Math.max(0, target.hp - totalDamage);
                            if (target.hp === 0) target.task = 'dead';
                        }
                    });
                }

                if (goldToGain.size > 0) {
                    setGoldMines(currentMines => {
                        const nextMines = currentMines.map(mine => {
                            const minedAmount = goldToGain.get(mine.id);
                            if (minedAmount) {
                                const newAmount = Math.max(0, mine.amount - minedAmount);
                                if (newAmount === 0 && mine.amount > 0) {
                                    villagersToUpdate.forEach(v => {
                                        if (v.targetMineId === mine.id) {
                                            v.task = 'idle';
                                            v.targetMineId = null;
                                            villagersStateChanged = true;
                                        }
                                    });
                                    setTooltipMineId(prev => prev === mine.id ? null : prev);
                                }
                                return { ...mine, amount: newAmount };
                            }
                            return mine;
                        });
                        return nextMines.filter(mine => mine.amount > 0);
                    });
                }
                
                if (villagersStateChanged) {
                    setVillagers([...villagersToUpdate]);
                }
            }
        }, layerRef.current);

        anim.start();
        return () => anim.stop();
    }, [isClient]);

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;
        const scaleBy = 1.05;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        const clampedScale = Math.max(0.5, Math.min(newScale, 3.0));
        if (clampedScale !== oldScale) {
            setStageScale(clampedScale);
            setStagePos({ x: pointer.x - mousePointTo.x * clampedScale, y: pointer.y - mousePointTo.y * clampedScale });
        }
    };

    const handleMineClick = (mineId: string, e: Konva.KonvaEventObject<MouseEvent>) => { e.evt.stopPropagation(); setTooltipMineId(prevId => (prevId === mineId ? null : mineId)); };

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (playerAction?.mode === 'placing_building') {
            const stage = stageRef.current; if (!stage) return;
            const pos = stage.getPointerPosition(); if (!pos) return;
            const transform = stage.getAbsoluteTransform().copy().invert();
            const { x, y } = transform.point(pos);
            setBuildings(prev => [...prev, { id: `house-${Date.now()}`, type: 'house', x, y }]);
            setPlayerAction(null); setPlacementPreview(null);
            return;
        }

        if (isSpacebarPressed || e.evt.button !== 0 || e.evt.altKey || e.evt.ctrlKey) return;
        if (e.target === stageRef.current) {
            setTooltipMineId(null);
            isSelecting.current = true;
            const stage = stageRef.current; if (!stage) return;
            const pos = stage.getPointerPosition(); if (!pos) return;
            const transform = stage.getAbsoluteTransform().copy().invert();
            const { x: x1, y: y1 } = transform.point(pos);
            setSelectionRect({ x1, y1, x2: x1, y2: y1, visible: true });
        }
    };

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = stageRef.current; if (!stage) return;
        const pos = stage.getPointerPosition(); if (!pos) return;
        const transform = stage.getAbsoluteTransform().copy().invert();
        const { x, y } = transform.point(pos);

        if (isSelecting.current && selectionRect) {
            setSelectionRect({ ...selectionRect, x2: x, y2: y });
        }
        if (playerAction?.mode === 'placing_building') {
            setPlacementPreview({ x, y });
        }
    };

    const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
        isSelecting.current = false;
        if (!selectionRect) return;
        const stage = stageRef.current; if (!stage) { setSelectionRect(null); return; }
        const { x1, y1, x2, y2 } = selectionRect;
        const isDrag = Math.abs(x1 - x2) > 5 || Math.abs(y1 - y2) > 5;
        
        if (e.evt.button !== 0) { setSelectionRect(null); return; }

        if (isDrag) {
            const selectionBox = { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x1 - x2), height: Math.abs(y1 - y2) };
            const newSelectedIds = new Set<string>();
            villagers.forEach(v => { if (v.task !== 'dead' && Konva.Util.haveIntersection(selectionBox, {x: v.x, y: v.y, width: 1, height: 1})) newSelectedIds.add(v.id); });
            if (e.evt.shiftKey) setSelectedVillagerIds(prev => { const combined = new Set(prev); newSelectedIds.forEach(id => combined.add(id)); return combined; });
            else setSelectedVillagerIds(newSelectedIds);
        } else if (e.target === stageRef.current) setSelectedVillagerIds(new Set());
        
        setSelectionRect(null);
    };

    const handleUnitClick = (e: Konva.KonvaEventObject<MouseEvent>, villagerId: string) => {
        e.evt.stopPropagation();
        const villager = villagers.find(v => v.id === villagerId);
        if (villager?.task === 'dead') { setSelectedVillagerIds(new Set()); return; }

        const currentlySelected = new Set(selectedVillagerIds);
        if (e.evt.shiftKey) { if (currentlySelected.has(villagerId)) currentlySelected.delete(villagerId); else currentlySelected.add(villagerId); } 
        else { currentlySelected.clear(); currentlySelected.add(villagerId); }
        setTooltipMineId(null);
        setSelectedVillagerIds(currentlySelected);
    };

    const handleStageContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
        e.evt.preventDefault();
        if (playerAction?.mode === 'placing_building') { setPlayerAction(null); setPlacementPreview(null); return; }
        if (selectedVillagerIds.size === 0) return;

        const stage = stageRef.current; if (!stage) return;
        const pos = stage.getPointerPosition(); if (!pos) return;
        const transform = stage.getAbsoluteTransform().copy().invert();
        let { x: targetX, y: targetY } = transform.point(pos);
        
        const targetVillagerGroup = e.target.getAncestors().find(ancestor => ancestor.id()?.startsWith('villager-'));
        const clickedVillagerId = targetVillagerGroup?.id();
        
        if (clickedVillagerId && !selectedVillagerIds.has(clickedVillagerId)) {
            const targetVillager = villagers.find(v => v.id === clickedVillagerId);
            if (!targetVillager || targetVillager.task === 'dead') return;

            setVillagers(currentVillagers => currentVillagers.map(v => {
                if (selectedVillagerIds.has(v.id) && v.task !== 'dead') {
                    return { ...v, task: 'attacking', attackTargetId: clickedVillagerId, targetMineId: null, targetX: targetVillager.x, targetY: targetVillager.y };
                }
                return v;
            }));
            return;
        }
        
        const mineGroup = e.target.getAncestors().find(ancestor => ancestor.id()?.startsWith('gold-mine'));
        if (mineGroup) {
            const mineId = mineGroup.id();
            const mineData = goldMines.find(m => m.id === mineId);
            if (mineData && mineData.amount > 0) {
                 setVillagers(currentVillagers => currentVillagers.map(v => {
                    if (selectedVillagerIds.has(v.id) && v.task !== 'dead') {
                         return { ...v, task: 'moving', targetX: mineData.x, targetY: mineData.y, targetMineId: mineId, attackTargetId: null };
                    }
                    return v;
                }));
            }
            return;
        }

        setVillagers(currentVillagers => currentVillagers.map(v => {
            if (selectedVillagerIds.has(v.id) && v.task !== 'dead') {
                return { ...v, task: 'moving', targetX, targetY, targetMineId: null, attackTargetId: null };
            }
            return v;
        }));
    };
    
    const handleEnterBuildMode = () => {
        setPlayerAction({ mode: 'placing_building', data: { buildingType: 'house' } });
    };

    const renderGrid = () => Array.from({ length: MAP_WIDTH_CELLS * MAP_HEIGHT_CELLS }).map((_, i) => <Rect key={i} x={(i % MAP_WIDTH_CELLS) * GRID_SIZE} y={Math.floor(i / MAP_HEIGHT_CELLS) * GRID_SIZE} width={GRID_SIZE} height={GRID_SIZE} fill="#504945" stroke="#665c54" strokeWidth={1} listening={false}/>);
    const activeTooltipMine = tooltipMineId ? goldMines.find(m => m.id === tooltipMineId) : null;
    if (!isClient) return <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8"><h1 className="text-4xl font-serif text-brand-gold mb-4">Loading Map Engine...</h1></div>;

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-serif text-brand-gold mb-2">Resource Interaction Test Map</h1>
            <p className="text-parchment-dark mb-4 text-sm">Left-click drag to select. Right-click to move/attack. Hold Spacebar + drag to pan. Scroll to zoom.</p>
            <div className="flex w-full max-w-6xl">
                <div className={`flex-grow aspect-[40/25] bg-black rounded-lg overflow-hidden border-2 border-stone-light relative ${isSpacebarPressed ? 'cursor-grab' : 'cursor-default'}`}>
                     <Stage 
                        ref={stageRef} width={MAP_WIDTH_CELLS * GRID_SIZE} height={MAP_HEIGHT_CELLS * GRID_SIZE} 
                        className="mx-auto" onMouseDown={handleStageMouseDown} onMouseMove={handleStageMouseMove}
                        onMouseUp={handleStageMouseUp} onContextMenu={handleStageContextMenu} onWheel={handleWheel}
                        draggable={isSpacebarPressed} scaleX={stageScale} scaleY={stageScale} x={stagePos.x} y={stagePos.y}
                    >
                        <Layer ref={layerRef}>
                            {renderGrid()}
                            {buildings.map(building => (<House key={building.id} id={building.id} x={building.x} y={building.y} />))}
                            {goldMines.map(mine => (
                                <AnimatedGoldMine
                                    key={mine.id} id={mine.id} ref={node => { if(node) goldMineRefs.current[mine.id] = node; }}
                                    x={mine.x} y={mine.y} onClick={(e) => handleMineClick(mine.id, e)} onTap={(e) => handleMineClick(mine.id, e as any)}
                                    onMouseEnter={() => { if(selectedVillagerIds.size > 0) setHoveredMineId(mine.id); }}
                                    onMouseLeave={() => { setHoveredMineId(null); }}
                                />
                            ))}
                            {villagers.map(villager => (
                                <Group key={villager.id} id={villager.id}
                                    onMouseEnter={() => {if (!isSpacebarPressed) (stageRef.current?.container() as HTMLDivElement).style.cursor = 'pointer';}}
                                    onMouseLeave={() => {if (!isSpacebarPressed) (stageRef.current?.container() as HTMLDivElement).style.cursor = 'default';}}
                                >
                                    <AnimatedVillager 
                                        ref={node => { if(node) villagerRefs.current[villager.id] = node; }} 
                                        x={villager.x} 
                                        y={villager.y}
                                        isMoving={villager.task === 'moving' || (villager.task === 'attacking' && Math.hypot(villager.targetX - villager.x, villager.targetY - villager.y) > GRID_SIZE * 1.5)}
                                        isMining={villager.task === 'mining'}
                                        isDead={villager.task === 'dead'}
                                        isSelected={selectedVillagerIds.has(villager.id)}
                                        onClick={(e) => handleUnitClick(e, villager.id)} 
                                        onTap={(e) => handleUnitClick(e, villager.id)}
                                    />
                                    {villager.hp < villager.maxHp && villager.task !== 'dead' && (
                                        <Group x={villager.x - 20} y={villager.y - 30} listening={false}>
                                            <Rect width={40} height={5} fill="#3c3836" cornerRadius={2} />
                                            <Rect width={40 * (villager.hp / villager.maxHp)} height={5} fill="#fb4934" cornerRadius={2} />
                                        </Group>
                                    )}
                                </Group>
                            ))}
                            {selectionRect?.visible && (<Rect x={Math.min(selectionRect.x1, selectionRect.x2)} y={Math.min(selectionRect.y1, selectionRect.y2)} width={Math.abs(selectionRect.x1 - selectionRect.x2)} height={Math.abs(selectionRect.y1 - selectionRect.y2)} fill="rgba(131, 165, 152, 0.3)" stroke="#83a598" strokeWidth={1 / stageScale} listening={false} />)}
                            {hoveredMineId && goldMines.find(m => m.id === hoveredMineId) && (<PickaxeIcon x={goldMines.find(m => m.id === hoveredMineId)!.x} y={goldMines.find(m => m.id === hoveredMineId)!.y - 60}/>)}
                            {activeTooltipMine && (<Label x={activeTooltipMine.x} y={activeTooltipMine.y - 90} opacity={0.9} listening={false} ><Tag fill='#201c1a' pointerDirection='down' pointerWidth={10} pointerHeight={10} lineJoin='round' cornerRadius={5} shadowColor='black' shadowBlur={5} shadowOpacity={0.4} /><Text text={`Gold: ${Math.floor(activeTooltipMine.amount)}`} fontFamily='Quattrocento Sans, sans-serif' fontSize={16} padding={8} fill='#fbf1c7' /></Label>)}
                            {placementPreview && (<House x={placementPreview.x} y={placementPreview.y} isPreview />)}
                        </Layer>
                    </Stage>
                </div>
                {selectedVillagerIds.size > 0 && (
                    <div className="w-48 ml-4 p-4 bg-stone-dark/50 rounded-lg border border-stone-light/30">
                        <h3 className="font-serif text-lg text-brand-gold mb-2">{selectedVillagerIds.size} Villager(s) Selected</h3>
                        <div className="flex flex-col gap-2">
                           <button onClick={handleEnterBuildMode} className="text-left p-2 rounded-md hover:bg-brand-blue/20 transition-colors">Build House</button>
                        </div>
                    </div>
                )}
            </div>
             <Link href="/" className="sci-fi-button mt-6">Return to Main Menu</Link>
        </div>
    );
};

export default TestMapPage;
