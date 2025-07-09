
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

      if (isDead) {
          if (animationRequestRef.current) cancelAnimationFrame(animationRequestRef.current);
          resetToIdle();
          node.rotation(90);
          node.opacity(0.6);
          node.filters([Konva.Filters.Grayscale]);
          node.cache();
          return;
      }
      
      // If not dead, reset the main group's state
      node.rotation(0);
      node.opacity(1);
      node.filters([]);
      node.cache();

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
export default AnimatedVillager;
