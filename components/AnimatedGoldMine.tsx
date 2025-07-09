'use client';

import React, { useEffect, useRef } from "react";
import { Group, Rect, Circle, Star, Line } from "react-konva";
import type Konva from 'konva';

const scale = 0.2; // Scaled down to fit a tile

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

export default AnimatedGoldMine;
