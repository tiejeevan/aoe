
'use client';

import React from 'react';
import { Group, Rect, Circle, Ellipse } from 'react-konva';
import type Konva from 'konva';

interface VillagerVisualsProps {
  scale: number;
  hp: number;
  maxHp: number;
  task: 'idle' | 'moving' | 'attacking' | 'dead';
  isSelected?: boolean;
  leftArmRef: React.RefObject<Konva.Group>;
  rightArmRef: React.RefObject<Konva.Group>;
  leftLegRef: React.RefObject<Konva.Group>;
  rightLegRef: React.RefObject<Konva.Group>;
}

export const VillagerVisuals: React.FC<VillagerVisualsProps> = ({
  scale,
  hp,
  maxHp,
  task,
  isSelected,
  leftArmRef,
  rightArmRef,
  leftLegRef,
  rightLegRef,
}) => {
  return (
    <>
      {/* HP Bar - Not listening for clicks */}
      {task !== 'dead' && (
        <Group y={-80 * scale} listening={false}>
          <Rect x={-50 * scale} y={-10 * scale} width={100 * scale} height={10 * scale} fill="#3c3836" cornerRadius={5 * scale} />
          <Rect x={-50 * scale} y={-10 * scale} width={(100 * scale * hp) / maxHp} height={10 * scale} fill="#fb4934" cornerRadius={5 * scale} />
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
    </>
  );
};
