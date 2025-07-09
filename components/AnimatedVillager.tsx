
'use client';

import React, { forwardRef, useEffect, useRef } from 'react';
import { Group, Rect, Circle, Ellipse } from 'react-konva';
import Konva from 'konva';

const scale = 0.07;

interface AnimatedVillagerProps extends Omit<Konva.GroupConfig, 'id'> {
    id: string;
    isSelected?: boolean;
    task: 'idle' | 'moving' | 'attacking' | 'dead';
    hp: number;
    maxHp: number;
}

const AnimatedVillager = forwardRef<Konva.Group, AnimatedVillagerProps>(
  ({ id, isSelected, task, hp, maxHp, ...groupProps }, ref) => {
    
    const leftArmRef = useRef<Konva.Group>(null);
    const rightArmRef = useRef<Konva.Group>(null);
    const leftLegRef = useRef<Konva.Group>(null);
    const rightLegRef = useRef<Konva.Group>(null);
    const animRef = useRef<Konva.Animation | null>(null);
    const mainGroupRef = useRef<Konva.Group>(null);

    useEffect(() => {
        const node = mainGroupRef.current;
        if (!node) return;

        if (animRef.current) {
            animRef.current.stop();
        }

        const resetToIdle = () => {
            if (leftArmRef.current) leftArmRef.current.rotation(0);
            if (rightArmRef.current) rightArmRef.current.rotation(0);
            if (leftLegRef.current) leftLegRef.current.rotation(0);
            if (rightLegRef.current) rightLegRef.current.rotation(0);
        };

        animRef.current = new Konva.Animation((frame) => {
            if (!frame || !node) return;
            
            if (task === 'moving') {
                const animSpeed = 0.01;
                const swingAngle = 20; 
                const rotation = Math.sin(frame.time * animSpeed) * swingAngle;

                if (leftArmRef.current) leftArmRef.current.rotation(rotation);
                if (rightArmRef.current) rightArmRef.current.rotation(-rotation);
                if (leftLegRef.current) leftLegRef.current.rotation(-rotation);
                if (rightLegRef.current) rightLegRef.current.rotation(rotation);
            } else if (task === 'attacking') {
                const animSpeed = 0.02;
                const swingAngle = 45;
                const rotation = Math.sin((frame.time) * animSpeed) * swingAngle;
                if (rightArmRef.current) rightArmRef.current.rotation(rotation);
                if (leftArmRef.current) leftArmRef.current.rotation(0);
                if (leftLegRef.current) leftLegRef.current.rotation(0);
                if (rightLegRef.current) rightLegRef.current.rotation(0);
            } else if (task === 'dead') {
                if(node.opacity() > 0) {
                    node.opacity(node.opacity() - 0.01);
                } else {
                    animRef.current?.stop();
                }
            } else { 
                resetToIdle();
            }
        }, node.getLayer());

        animRef.current.start();
        
        return () => {
            if (animRef.current) {
                animRef.current.stop();
            }
        };

    }, [task]);

    return (
      <Group ref={mainGroupRef} {...groupProps} name="villager" id={id} visible={task !== 'dead' || (mainGroupRef.current?.opacity() || 0) > 0}>
        {/* HP Bar - Not listening for clicks */}
         {task !== 'dead' && (
             <Group y={-80 * scale} listening={false}>
                <Rect x={-50 * scale} y={-10 * scale} width={100 * scale} height={10 * scale} fill="#3c3836" cornerRadius={5 * scale} />
                <Rect x={-50 * scale} y={-10 * scale} width={(100 * scale * hp) / maxHp} height={10 * scale} fill="#98971a" cornerRadius={5 * scale} />
            </Group>
         )}


        {/* Selection Indicator - Not listening for clicks */}
        {isSelected && (
            <Ellipse
                y={100 * scale}
                radiusX={60 * scale}
                radiusY={20 * scale}
                stroke="#d79921"
                strokeWidth={2}
                dash={[10, 5]}
                listening={false}
            />
        )}
        
        {/* Torso */}
        <Rect
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

        {/* Left Leg Group */}
        <Group ref={leftLegRef} x={-17 * scale} y={85 * scale}>
          <Rect
            x={-15 * scale} y={0} width={30 * scale} height={80 * scale}
            fill="#3c3836" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}
          />
          <Rect
            x={-12.5 * scale} y={75 * scale} width={25 * scale} height={60 * scale}
            fill="#201c1a" stroke="black" strokeWidth={2 * scale} cornerRadius={12 * scale}
          />
        </Group>

        {/* Right Leg Group */}
        <Group ref={rightLegRef} x={17 * scale} y={85 * scale}>
          <Rect
             x={-15 * scale} y={0} width={30 * scale} height={80 * scale}
            fill="#3c3836" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}
          />
          <Rect
            x={-12.5 * scale} y={75 * scale} width={25 * scale} height={60 * scale}
            fill="#201c1a" stroke="black" strokeWidth={2 * scale} cornerRadius={12 * scale}
          />
        </Group>

        {/* Left Arm Group */}
        <Group ref={leftArmRef} x={-50 * scale} y={-35 * scale}>
          <Rect
            x={-15 * scale} y={0} width={30 * scale} height={70 * scale}
            fill="#f5d6b4" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}
          />
          <Rect
            x={-12.5 * scale} y={65 * scale} width={25 * scale} height={50 * scale}
            fill="#a07a56" stroke="black" strokeWidth={2 * scale} cornerRadius={12 * scale}
          />
        </Group>

        {/* Right Arm Group */}
        <Group ref={rightArmRef} x={50 * scale} y={-35 * scale}>
          <Rect
            x={-15 * scale} y={0} width={30 * scale} height={70 * scale}
            fill="#f5d6b4" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}
          />
          <Rect
             x={-12.5 * scale} y={65 * scale} width={25 * scale} height={50 * scale}
            fill="#a07a56" stroke="black" strokeWidth={2 * scale} cornerRadius={12 * scale}
          />
        </Group>

        {/* Head Group */}
        <Group y={-70 * scale}>
          <Circle x={0} y={-50 * scale} radius={40 * scale} fill="#c49a6c" stroke="black" strokeWidth={2 * scale} />
          <Circle x={-15 * scale} y={-60 * scale} radius={6 * scale} fill="black" />
          <Circle x={15 * scale} y={-60 * scale} radius={6 * scale} fill="black" />
        </Group>
      </Group>
    );
  }
);

AnimatedVillager.displayName = 'AnimatedVillager';
export default AnimatedVillager;
