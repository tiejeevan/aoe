
'use client';

import React from 'react';
import { Group, Rect, Circle, Ellipse, Line, Text, Path, Star, Ring, Wedge, Arc, Image, Sprite, Shape } from 'react-konva';
import Konva from 'konva';

// A mapping from string identifiers to the actual Konva components
const componentMap: { [key: string]: React.ComponentType<any> } = {
  Group,
  Rect,
  Circle,
  Ellipse,
  Line,
  Text,
  Path,
  Star,
  Ring,
  Wedge,
  Arc,
  Image,
  Sprite,
  Shape,
  Layer: Group // Layer is a special case, we'll render it as a Group within the parent Layer
};

interface NodeConfig extends Konva.NodeConfig {
  className: string;
  children?: NodeConfig[];
}

interface KonvaRendererProps {
  node: NodeConfig;
}

const KonvaRenderer: React.FC<KonvaRendererProps> = ({ node }) => {
  const Component = componentMap[node.className];

  if (!Component) {
    console.warn(`Konva component "${node.className}" not found. Skipping.`);
    return null;
  }

  // Filter out children from props passed to the component itself
  const { children, ...restOfProps } = node;

  return (
    <Component {...restOfProps.attrs}>
      {children && children.map((childNode, index) => (
        <KonvaRenderer key={index} node={childNode} />
      ))}
    </Component>
  );
};

export default KonvaRenderer;
