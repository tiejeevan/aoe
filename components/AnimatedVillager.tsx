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
}

const AnimatedVillager = forwardRef<Konva.Group, AnimatedVillagerProps>(
  ({ isMoving, isSelected, ...groupProps }, ref) => {
    const leftUpperArm = useRef<Konva.Rect>(null);
    const leftLowerArm = useRef<Konva.Rect>(null);
    const rightUpperArm = useRef<Konva.Rect>(null);
    const rightLowerArm = useRef<Konva.Rect>(null);
    const leftUpperLeg = useRef<Konva.Rect>(null);
    const leftLowerLeg = useRef<Konva.Rect>(null);
    const rightUpperLeg = useRef<Konva.Rect>(null);
    const rightLowerLeg = useRef<Konva.Rect>(null);
    const torso = useRef<Konva.Rect>(null);
    const head = useRef<Konva.Circle>(null);

    const animationRequestRef = useRef<number>();
    const startTimeRef = useRef<number>(0);
    
    useEffect(() => {
        if(typeof window !== 'undefined'){
            startTimeRef.current = performance.now();
        }
    }, [])


    useEffect(() => {
      if (isMoving) {
        const animate = () => {
          const now = performance.now();
          if (startTimeRef.current === 0) {
            startTimeRef.current = now;
          }
          const elapsed = (now - startTimeRef.current) / 1000;
          const cycle = elapsed % 2;
          const progress = cycle / 2;
          const easedProgress = easeInOutQuad(progress < 0.5 ? progress * 2 : 2 - progress * 2);
          const maxArmSwing = 30;
          const maxLegSwing = 30;
          const leftArmAngle = maxArmSwing * easedProgress;
          const rightArmAngle = -maxArmSwing * easedProgress;
          const leftLegAngle = -maxLegSwing * easedProgress;
          const rightLegAngle = maxLegSwing * easedProgress;

          if (leftUpperArm.current) leftUpperArm.current.rotation(leftArmAngle);
          if (rightUpperArm.current) rightUpperArm.current.rotation(rightArmAngle);
          if (leftUpperLeg.current) leftUpperLeg.current.rotation(leftLegAngle);
          if (rightUpperLeg.current) rightUpperLeg.current.rotation(rightLegAngle);

          const elbowBend = 15 * Math.sin(elapsed * 5);
          const kneeBend = 20 * Math.sin(elapsed * 4);

          if (leftLowerArm.current) leftLowerArm.current.rotation(elbowBend);
          if (rightLowerArm.current) rightLowerArm.current.rotation(-elbowBend);
          if (leftLowerLeg.current) leftLowerLeg.current.rotation(kneeBend);
          if (rightLowerLeg.current) rightLowerLeg.current.rotation(-kneeBend);

          if (torso.current) torso.current.y(-50 * scale + Math.sin(elapsed * 6) * 3 * scale);
          if (head.current) head.current.y(-120 * scale + Math.sin(elapsed * 6) * 3 * scale);

          animationRequestRef.current = requestAnimationFrame(animate);
        };
        animationRequestRef.current = requestAnimationFrame(animate);
      } else {
        if (animationRequestRef.current) {
          cancelAnimationFrame(animationRequestRef.current);
        }
        // Reset to idle pose
        const allRefs = [leftUpperArm, rightUpperArm, leftUpperLeg, rightUpperLeg, leftLowerArm, rightLowerArm, leftLowerLeg, rightLowerLeg];
        allRefs.forEach(limbRef => {
            if(limbRef.current) limbRef.current.rotation(0);
        });
        if (torso.current) torso.current.y(-50 * scale);
        if (head.current) head.current.y(-120 * scale);
      }

      return () => {
        if (animationRequestRef.current) {
          cancelAnimationFrame(animationRequestRef.current);
        }
      };
    }, [isMoving]);

    return (
      <Group ref={ref} {...groupProps}>
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
            offsetY={0}
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

        {/* Right Arm Group */}
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
            offsetY={0}
          />
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

        {/* Head */}
        <Group>
          <Circle
            ref={head}
            x={0}
            y={-120 * scale}
            radius={40 * scale}
            fillLinearGradientStartPoint={{ x: 0, y: -160 * scale }}
            fillLinearGradientEndPoint={{ x: 0, y: -80 * scale }}
            fillLinearGradientColorStops={[0, "#f5d6b4", 1, "#c49a6c"]}
            stroke="black"
            strokeWidth={2 * scale}
          />
          <Circle x={-15 * scale} y={-130 * scale} radius={6 * scale} fill="black" />
          <Circle x={15 * scale} y={-130 * scale} radius={6 * scale} fill="black" />
          <Line
            points={[-25 * scale, -145 * scale, -5 * scale, -140 * scale]}
            stroke="black"
            strokeWidth={2 * scale}
            lineCap="round"
            tension={0.5}
          />
          <Line
            points={[5 * scale, -140 * scale, 25 * scale, -145 * scale]}
            stroke="black"
            strokeWidth={2 * scale}
            lineCap="round"
            tension={0.5}
          />
          <Line
            points={[0, -120 * scale, 0, -110 * scale]}
            stroke="#9c7b53"
            strokeWidth={1.5 * scale}
            lineCap="round"
          />
          <Line
            points={[-15 * scale, -100 * scale, 0, -90 * scale, 15 * scale, -100 * scale]}
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
