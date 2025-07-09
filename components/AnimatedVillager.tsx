
'use client';

import React, { forwardRef, useEffect, useRef } from 'react';
import { Group, Rect, Circle, Ellipse } from 'react-konva';
import Konva from 'konva';

const scale = 0.07;

interface AnimatedVillagerProps extends Omit<Konva.GroupConfig, 'x' | 'y'> {
    id: string;
    isSelected?: boolean;
    task: 'idle' | 'moving' | 'attacking' | 'dead';
    hp: number;
    maxHp: number;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    onMoveEnd: () => void;
}

const AnimatedVillager = forwardRef<Konva.Group, AnimatedVillagerProps>(
  ({ isSelected, task, x, y, targetX, targetY, onMoveEnd, hp, maxHp, ...groupProps }, ref) => {
    
    const nodeRef = useRef<Konva.Group>(null);
    const leftArmRef = useRef<Konva.Group>(null);
    const rightArmRef = useRef<Konva.Group>(null);
    const leftLegRef = useRef<Konva.Group>(null);
    const rightLegRef = useRef<Konva.Group>(null);
    const animRef = useRef<Konva.Animation | null>(null);

    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;

        if (task !== 'moving') {
            node.position({ x, y });
        }
    }, [x, y, task]);

    useEffect(() => {
        const node = nodeRef.current;
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
                const speed = 2; 

                const currentX = node.x();
                const currentY = node.y();
                const dx = targetX - currentX;
                const dy = targetY - currentY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < speed) {
                    node.position({ x: targetX, y: targetY });
                    onMoveEnd();
                    animRef.current?.stop();
                    resetToIdle();
                    return;
                }
                
                const angle = Math.atan2(dy, dx);
                node.x(currentX + Math.cos(angle) * speed);
                node.y(currentY + Math.sin(angle) * speed);

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

    }, [task, targetX, targetY, onMoveEnd]);

    return (
      <Group ref={nodeRef} {...groupProps} name="villager" visible={task !== 'dead' || (nodeRef.current?.opacity() || 0) > 0}>
        {/* HP Bar */}
         {task !== 'dead' && (
             <Group y={-80 * scale}>
                <Rect x={-50 * scale} y={-10 * scale} width={100 * scale} height={10 * scale} fill="#3c3836" cornerRadius={5 * scale} />
                <Rect x={-50 * scale} y={-10 * scale} width={(100 * scale * hp) / maxHp} height={10 * scale} fill="#98971a" cornerRadius={5 * scale} />
            </Group>
         )}


        {/* Selection Indicator */}
        {isSelected && (
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
