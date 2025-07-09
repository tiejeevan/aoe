
'use client';

import React, { forwardRef, useEffect, useRef } from 'react';
import { Group } from 'react-konva';
import Konva from 'konva';
import { VillagerVisuals } from './VillagerVisuals';

const moveSpeed = 100; // pixels per second
const scale = 0.07;
const DEATH_DURATION = 10000; // ms

interface AnimatedVillagerProps {
    id: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    isSelected?: boolean;
    task: 'idle' | 'moving' | 'attacking' | 'dead' | 'building' | 'mining' | 'gathering' | 'returning';
    hp: number;
    maxHp: number;
    deathTime?: number;
    onMoveEnd: (villagerId: string, newPosition: { x: number; y: number }) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    carrying?: { type: string; amount: number };
}

const AnimatedVillager = forwardRef<Konva.Group, AnimatedVillagerProps>(
  ({ id, x, y, targetX, targetY, isSelected, task, hp, maxHp, deathTime, onMoveEnd, onMouseEnter, onMouseLeave, carrying }, ref) => {
    
    const leftArmRef = useRef<Konva.Group>(null);
    const rightArmRef = useRef<Konva.Group>(null);
    const leftLegRef = useRef<Konva.Group>(null);
    const rightLegRef = useRef<Konva.Group>(null);
    const animRef = useRef<Konva.Animation | null>(null);
    const mainGroupRef = useRef<Konva.Group>(null);
    const movementTweenRef = useRef<Konva.Tween | null>(null);

    useEffect(() => {
        const node = mainGroupRef.current;
        if (!node) return;

        // Ensure initial position is correct
        node.x(x);
        node.y(y);
        
        // Stop any previous tween
        if (movementTweenRef.current) {
            movementTweenRef.current.destroy();
            movementTweenRef.current = null;
        }

        if (task === 'moving' || task === 'returning') {
            const distance = Math.sqrt(Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2));

            if (distance > 1) {
                 movementTweenRef.current = new Konva.Tween({
                    node,
                    duration: distance / moveSpeed,
                    x: targetX,
                    y: targetY,
                    onFinish: () => {
                        onMoveEnd(id, { x: targetX, y: targetY });
                    },
                });
                movementTweenRef.current.play();
            } else {
                 onMoveEnd(id, { x: targetX, y: targetY });
            }
        }
    }, [x, y, targetX, targetY, task, id, onMoveEnd]);


    // Effect for cosmetic animations (walking, attacking, dying)
    useEffect(() => {
        const node = mainGroupRef.current;
        if (!node) return;

        const resetToIdle = () => {
            if (leftArmRef.current) leftArmRef.current.rotation(0);
            if (rightArmRef.current) rightArmRef.current.rotation(0);
            if (leftLegRef.current) leftLegRef.current.rotation(0);
            if (rightLegRef.current) rightLegRef.current.rotation(0);
        };

        if (animRef.current) {
            animRef.current.stop();
            animRef.current = null;
        }

        // Handle death separately with a precise tween
        if (task === 'dead') {
             // Stop any other animations
            resetToIdle();
            const deathTween = new Konva.Tween({
                node,
                duration: DEATH_DURATION / 1000, // Tween duration is in seconds
                opacity: 0,
            });
            deathTween.play();
            return;
        }

        // Reset opacity if it's not dead
        node.opacity(1);

        animRef.current = new Konva.Animation((frame) => {
            if (!frame || !node) return;
            
            const animSpeed = 0.01;
            const swingAngle = 20; 

            if (task === 'moving' || task === 'returning') {
                const rotation = Math.sin(frame.time * animSpeed) * swingAngle;
                if (leftArmRef.current) leftArmRef.current.rotation(rotation);
                if (rightArmRef.current) rightArmRef.current.rotation(-rotation);
                if (leftLegRef.current) leftLegRef.current.rotation(-rotation);
                if (rightLegRef.current) rightLegRef.current.rotation(rotation);
            } else if (task === 'attacking') {
                const attackAnimSpeed = 0.02;
                const attackSwingAngle = 45;
                const rotation = Math.sin((frame.time) * attackAnimSpeed) * attackSwingAngle;
                if (rightArmRef.current) rightArmRef.current.rotation(rotation);
                if (leftArmRef.current) leftArmRef.current.rotation(0);
                if (leftLegRef.current) leftLegRef.current.rotation(0);
                if (rightLegRef.current) rightLegRef.current.rotation(0);
            } else if (task === 'mining' || task === 'gathering' || task === 'building') {
                const workAnimSpeed = 0.01;
                const workSwingAngle = 40;
                const rotation = (Math.sin(frame.time * workAnimSpeed) * workSwingAngle) - 20;
                if(rightArmRef.current) rightArmRef.current.rotation(rotation);
                if(leftArmRef.current) leftArmRef.current.rotation(rotation);
            }
            else { // Idle
                resetToIdle();
            }
        }, node.getLayer());

        animRef.current.start();
        
        return () => {
            animRef.current?.stop();
        };

    }, [task]);

    return (
      <Group ref={mainGroupRef} x={x} y={y} name="villager" id={id} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <VillagerVisuals
          scale={scale}
          hp={hp}
          maxHp={maxHp}
          task={task}
          isSelected={isSelected}
          leftArmRef={leftArmRef}
          rightArmRef={rightArmRef}
          leftLegRef={leftLegRef}
          rightLegRef={rightLegRef}
          isCarrying={(carrying?.amount || 0) > 0}
        />
      </Group>
    );
  }
);

AnimatedVillager.displayName = 'AnimatedVillager';
export default AnimatedVillager;
