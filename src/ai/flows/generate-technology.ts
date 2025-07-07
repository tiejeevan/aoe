
'use server';
/**
 * @fileOverview An AI agent that generates a new, creative game technology.
 *
 * - generateTechnology - A function that generates a single game technology.
 * - GenerateTechnologyInput - The input type for the generateTechnology function.
 * - GenerateTechnologyOutput - The return type for the generateTechnology function.
 */

import { ai } from '@/src/ai/genkit';
import { z } from 'zod';
import { researchIconMap, resourceIconMap } from '../../../components/icons/iconRegistry';

const researchTrees = ['Core Economy', 'Core Military', 'Advanced Economy', 'Advanced Military', 'Defensive', 'Culture'];

const GenerateTechnologyInputSchema = z.object({
  theme: z.string().describe('A theme or category for the new technology (e.g., "Naval Combat", "Advanced Farming", "Siege Tactics").'),
  existingTechNames: z.array(z.string()).describe('A list of existing technology names to avoid duplication.'),
});
export type GenerateTechnologyInput = z.infer<typeof GenerateTechnologyInputSchema>;

// This is a simplified version for generation. The full effects array is too complex for reliable generation.
const GeneratedTechnologySchema = z.object({
    name: z.string().describe('A unique, creative name for a game technology.'),
    description: z.string().describe('A brief, flavorful description of the technology.'),
    iconId: z.enum(Object.keys(researchIconMap) as [string, ...string[]]).describe('The most appropriate icon ID for this technology from the provided list.'),
    treeId: z.string().describe('A suitable tree ID for this technology, can be a new one or based on the theme. e.g. military_tech, economy_tech'),
    treeName: z.enum(researchTrees as [string, ...string[]]).describe('The display name of the technology tree.'),
    cost: z.object({
        food: z.number().optional(),
        wood: z.number().optional(),
        gold: z.number().optional(),
        stone: z.number().optional(),
    }).describe('A plausible resource cost for this technology. Should be balanced based on the description.'),
    researchTime: z.number().describe('A plausible research time in seconds.'),
});
export type GeneratedTechnologyOutput = z.infer<typeof GeneratedTechnologySchema>;


export async function generateTechnology(input: GenerateTechnologyInput): Promise<GeneratedTechnologyOutput> {
  return generateTechnologyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTechnologyPrompt',
  input: { schema: GenerateTechnologyInputSchema },
  output: { schema: GeneratedTechnologySchema },
  prompt: `You are a game designer creating a new technology for a fantasy real-time strategy game. The technology should fit the theme of '{{theme}}'.

Do not use any of the following existing technology names:
{{#each existingTechNames}}
- {{this}}
{{/each}}

The available icons are: ${Object.keys(researchIconMap).join(', ')}.
The available resource types for costs are: ${Object.keys(resourceIconMap).join(', ')}.
The available technology trees are: ${researchTrees.join(', ')}.

Please generate a single, well-balanced technology now.`,
});

const generateTechnologyFlow = ai.defineFlow(
  {
    name: 'generateTechnologyFlow',
    inputSchema: GenerateTechnologyInputSchema,
    outputSchema: GeneratedTechnologySchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
