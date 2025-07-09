
'use client';

import React, { forwardRef } from 'react';
import { Group, Rect, Circle, Line, Ellipse } from 'react-konva';
import Konva from 'konva';

const scale = 0.07;

// No animation props for now. Just the basic Konva group props.
interface AnimatedVillagerProps extends Konva.GroupConfig {
    isSelected?: boolean;
}

const AnimatedVillager = forwardRef<Konva.Group, AnimatedVillagerProps>(
  ({ isSelected, ...groupProps }, ref) => {

    // No refs, no useEffect, no animation. Just static rendering.

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
            x={-35 * scale} y={90 * scale} width={30 * scale} height={80 * scale}
            fill="#3c3836" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}
            offsetX={15 * scale} offsetY={0}
          />
          <Rect
            x={-35 * scale} y={170 * scale} width={25 * scale} height={60 * scale}
            fill="#201c1a" stroke="black" strokeWidth={2 * scale} cornerRadius={12 * scale}
            offsetX={12.5 * scale} offsetY={0}
          />
        </Group>

        {/* Right Leg Group */}
        <Group>
          <Rect
            x={15 * scale} y={90 * scale} width={30 * scale} height={80 * scale}
            fill="#3c3836" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}
            offsetX={15 * scale} offsetY={0}
          />
          <Rect
            x={20 * scale} y={170 * scale} width={25 * scale} height={60 * scale}
            fill="#201c1a" stroke="black" strokeWidth={2 * scale} cornerRadius={12 * scale}
            offsetX={12.5 * scale} offsetY={0}
          />
        </Group>

        {/* Left Arm Group */}
        <Group>
          <Rect
            x={-90 * scale} y={-45 * scale} width={30 * scale} height={70 * scale}
            fill="#f5d6b4" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}
            offsetX={15 * scale} offsetY={-5 * scale}
          />
          <Rect
            x={-100 * scale} y={25 * scale} width={25 * scale} height={50 * scale}
            fill="#a07a56" stroke="black" strokeWidth={2 * scale} cornerRadius={12 * scale}
            offsetX={12.5 * scale} offsetY={0}
          />
        </Group>

        {/* Right Arm Group */}
        <Group>
          <Rect
            x={60 * scale} y={-45 * scale} width={30 * scale} height={70 * scale}
            fill="#f5d6b4" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}
            offsetX={15 * scale} offsetY={-5 * scale}
          />
          <Rect
            x={70 * scale} y={25 * scale} width={25 * scale} height={50 * scale}
            fill="#a07a56" stroke="black" strokeWidth={2 * scale} cornerRadius={12 * scale}
            offsetX={12.5 * scale} offsetY={0}
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
