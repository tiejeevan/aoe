
'use client';

import React, { forwardRef, useEffect, useRef } from 'react';
import { Group, Rect, Circle, Line, Ellipse } from 'react-konva';
import Konva from 'konva';

const scale = 0.07;

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

interface AnimatedVillagerProps extends Konva.GroupConfig {
  isMoving: boolean;
  isSelected: boolean;
  isMining: boolean;
  isBuilding: boolean;
  isAttacking: boolean;
  isDead?: boolean;
}

const AnimatedVillager = forwardRef<Konva.Group, AnimatedVillagerProps>(
  ({ isMoving, isSelected, isMining, isBuilding, isAttacking, isDead, ...groupProps }, ref) => {
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
    
    // Tool refs
    const pickaxeRef = useRef<Konva.Group>(null);
    const hammerRef = useRef<Konva.Group>(null);
    const knifeRef = useRef<Konva.Group>(null);
    const bloodPoolRef = useRef<Konva.Ellipse>(null);

    const animationRequestRef = useRef<number>();
    const startTimeRef = useRef<number>(0);
    
    useEffect(() => {
        if(typeof window !== 'undefined'){
            startTimeRef.current = performance.now();
        }
    }, []);

    const resetToIdle = (showTools: {pickaxe?: boolean, hammer?: boolean, knife?: boolean} = {}) => {
        const allLimbRefs = [leftUpperArm, rightUpperArm, leftUpperLeg, rightUpperLeg, leftLowerArm, rightLowerArm, leftLowerLeg, rightLowerLeg, headGroup];
        allLimbRefs.forEach(limbRef => {
            if(limbRef.current) limbRef.current.rotation(0);
        });
        if (torso.current) torso.current.y(-50 * scale);
        if (headGroup.current) headGroup.current.y(-70 * scale);
        
        if (pickaxeRef.current) pickaxeRef.current.visible(!!showTools.pickaxe);
        if (hammerRef.current) hammerRef.current.visible(!!showTools.hammer);
        if (knifeRef.current) knifeRef.current.visible(!!showTools.knife);

        // Gentle head sway for idle
        const now = performance.now();
        const elapsed = (now - startTimeRef.current) / 1000;
        if (headGroup.current) {
            headGroup.current.rotation(Math.sin(elapsed * 1.5) * 2);
        }
    };

    useEffect(() => {
      const node = (ref as React.RefObject<Konva.Group>)?.current;
      if (!node) return;

      if (isDead) {
          if (animationRequestRef.current) cancelAnimationFrame(animationRequestRef.current);
          resetToIdle();
          node.rotation(90);
          node.opacity(0.6);
          if (bloodPoolRef.current) bloodPoolRef.current.visible(true);
          node.filters([Konva.Filters.Grayscale]);
          node.cache();
          return;
      }
      
      // If not dead, reset the main group's state
      node.rotation(0);
      node.opacity(1);
      node.filters([]);
      if (bloodPoolRef.current) bloodPoolRef.current.visible(false);
      node.cache();

      const animate = () => {
          const now = performance.now();
          const elapsed = (now - startTimeRef.current) / 1000;

          if (isMoving) {
            resetToIdle();
            const cycle = elapsed % 1;
            const progress = cycle;
            const easedProgress = easeInOutQuad(progress < 0.5 ? progress * 2 : 2 - progress * 2);
            const swing = 35;

            if (leftUpperArm.current) leftUpperArm.current.rotation(swing * easedProgress);
            if (rightUpperArm.current) rightUpperArm.current.rotation(-swing * easedProgress);
            if (leftUpperLeg.current) leftUpperLeg.current.rotation(-swing * easedProgress);
            if (rightUpperLeg.current) rightUpperLeg.current.rotation(swing * easedProgress);

            if (torso.current) torso.current.y(-50 * scale + Math.sin(elapsed * 10) * 1.5 * scale);

          } else if (isMining) {
             resetToIdle({ pickaxe: true });
             const swing = easeInOutQuad((Math.sin(elapsed * 5) + 1) / 2) * 90 - 45;
             if(rightUpperArm.current) rightUpperArm.current.rotation(swing);
             if(leftUpperArm.current) leftUpperArm.current.rotation(swing);
             if(rightLowerArm.current) rightLowerArm.current.rotation(25);
             if(leftLowerArm.current) leftLowerArm.current.rotation(25);
          } else if (isBuilding) {
             resetToIdle({ hammer: true });
             const swing = easeInOutQuad((Math.sin(elapsed * 6) + 1) / 2) * 70 - 20;
             if(rightUpperArm.current) rightUpperArm.current.rotation(swing);
             if(leftUpperArm.current) leftUpperArm.current.rotation(swing);
             if(rightLowerArm.current) rightLowerArm.current.rotation(15);
             if(leftLowerArm.current) leftLowerArm.current.rotation(15);
          } else if (isAttacking) {
             resetToIdle({ knife: true });
             const swing = easeInOutQuad((Math.sin(elapsed * 12) + 1) / 2) * 45 - 10;
             if(rightUpperArm.current) rightUpperArm.current.rotation(swing);
             if(leftUpperArm.current) leftUpperArm.current.rotation(swing / 2); // Other hand more stable
          } else { // Idle state
            resetToIdle();
          }

          animationRequestRef.current = requestAnimationFrame(animate);
      };
      
      animationRequestRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRequestRef.current) cancelAnimationFrame(animationRequestRef.current);
      };
    }, [isMoving, isMining, isBuilding, isAttacking, isDead, ref]);

    return (
      <Group ref={ref} {...groupProps}>
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

        {/* Blood Pool (for death) */}
        <Ellipse
            ref={bloodPoolRef}
            y={100 * scale}
            radiusX={80 * scale}
            radiusY={30 * scale}
            fill="#8b0000"
            visible={false}
            opacity={0.7}
        />
        
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

        {/* Left Leg Group */}
        <Group>
          <Rect
            ref={leftUpperLeg}
            x={-35 * scale} y={90 * scale} width={30 * scale} height={80 * scale}
            fill="#3c3836" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}
            offsetX={15 * scale} offsetY={0}
          />
          <Rect
            ref={leftLowerLeg}
            x={-35 * scale} y={170 * scale} width={25 * scale} height={60 * scale}
            fill="#201c1a" stroke="black" strokeWidth={2 * scale} cornerRadius={12 * scale}
            offsetX={12.5 * scale} offsetY={0}
          />
        </Group>

        {/* Right Leg Group */}
        <Group>
          <Rect
            ref={rightUpperLeg}
            x={15 * scale} y={90 * scale} width={30 * scale} height={80 * scale}
            fill="#3c3836" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}
            offsetX={15 * scale} offsetY={0}
          />
          <Rect
            ref={rightLowerLeg}
            x={20 * scale} y={170 * scale} width={25 * scale} height={60 * scale}
            fill="#201c1a" stroke="black" strokeWidth={2 * scale} cornerRadius={12 * scale}
            offsetX={12.5 * scale} offsetY={0}
          />
        </Group>

        {/* Left Arm Group */}
        <Group>
          <Rect
            ref={leftUpperArm}
            x={-90 * scale} y={-45 * scale} width={30 * scale} height={70 * scale}
            fill="#f5d6b4" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}
            offsetX={15 * scale} offsetY={-5 * scale}
          />
          <Rect
            ref={leftLowerArm}
            x={-100 * scale} y={25 * scale} width={25 * scale} height={50 * scale}
            fill="#a07a56" stroke="black" strokeWidth={2 * scale} cornerRadius={12 * scale}
            offsetX={12.5 * scale} offsetY={0}
          />
        </Group>

        {/* Right Arm Group with Tools */}
        <Group>
          <Rect
            ref={rightUpperArm}
            x={60 * scale} y={-45 * scale} width={30 * scale} height={70 * scale}
            fill="#f5d6b4" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}
            offsetX={15 * scale} offsetY={-5 * scale}
          />
          <Group>
              <Rect
                ref={rightLowerArm}
                x={70 * scale} y={25 * scale} width={25 * scale} height={50 * scale}
                fill="#a07a56" stroke="black" strokeWidth={2 * scale} cornerRadius={12 * scale}
                offsetX={12.5 * scale} offsetY={0}
              />
              <Group x={80*scale} y={50*scale} rotation={45}>
                  {/* Pickaxe */}
                  <Group ref={pickaxeRef} visible={false}>
                      <Rect x={0} y={-80*scale} width={8*scale} height={120*scale} fill="#8B4513" cornerRadius={2*scale} />
                      <Rect x={-20*scale} y={-90*scale} width={40*scale} height={20*scale} fill="#6c757d" cornerRadius={4*scale}/>
                  </Group>
                  {/* Hammer */}
                  <Group ref={hammerRef} visible={false}>
                      <Rect x={0} y={-60*scale} width={8*scale} height={90*scale} fill="#a16207" cornerRadius={2*scale} />
                      <Rect x={-15*scale} y={-80*scale} width={30*scale} height={30*scale} fill="#495057" cornerRadius={6*scale}/>
                  </Group>
                  {/* Knife */}
                  <Group ref={knifeRef} visible={false}>
                      <Rect x={0} y={-30*scale} width={6*scale} height={20*scale} fill="#4a2c2a" cornerRadius={2*scale} />
                      <Line points={[3*scale, -30*scale, 3*scale, -80*scale, 0, -90*scale, -3*scale, -80*scale, -3*scale, -30*scale]} closed fill="#adb5bd" stroke="#6c757d" strokeWidth={1} />
                  </Group>
              </Group>
          </Group>
        </Group>

        {/* Head Group */}
        <Group ref={headGroup} y={-70 * scale}>
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
