'use server';
/**
 * @fileOverview An AI agent that generates new, creative game resources.
 *
 * - generateResources - A function that generates a specified number of game resources.
 * - GenerateResourcesInput - The input type for the generateResources function.
 * - GenerateResourcesOutput - The return type for the generateResources function.
 */

import { ai } from '@/src/ai/genkit';
import { z } from 'zod';
import { resourceIconMap } from '../../../components/icons/iconRegistry';

const GenerateResourcesInputSchema = z.object({
  count: z.number().min(1).max(10).describe('The number of resources to generate.'),
  existingResourceNames: z.array(z.string()).describe('A list of existing resource names to avoid duplication.'),
});
export type GenerateResourcesInput = z.infer<typeof GenerateResourcesInputSchema>;

const ResourceRaritySchema = z.enum(['Abundant', 'Common', 'Uncommon', 'Rare', 'Strategic']);

const GeneratedResourceSchema = z.object({
    name: z.string().describe('A unique, creative name for a game resource (e.g., "Aetherium Shards", "Sunwood Logs", "Soul Essence").'),
    description: z.string().describe('A brief, flavorful description of the resource and its potential use in a strategy game.'),
    iconId: z.enum(Object.keys(resourceIconMap) as [string, ...string[]]).describe('The most appropriate icon ID for this resource from the provided list.'),
    rarity: ResourceRaritySchema.describe('The rarity of this resource.'),
});

const GenerateResourcesOutputSchema = z.object({
  resources: z.array(GeneratedResourceSchema).describe('An array of generated game resources.'),
});
export type GenerateResourcesOutput = z.infer<typeof GenerateResourcesOutputSchema>;

export async function generateResources(input: GenerateResourcesInput): Promise<GenerateResourcesOutput> {
  return generateResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateResourcesPrompt',
  input: { schema: GenerateResourcesInputSchema },
  output: { schema: GenerateResourcesOutputSchema },
  prompt: `You are a game designer creating new resources for a fantasy real-time strategy game. Your task is to generate {{count}} unique and creative resources.

Do not use any of the following existing resource names:
{{#each existingResourceNames}}
- {{this}}
{{/each}}

The available icons are: ${Object.keys(resourceIconMap).join(', ')}.

Please generate the resources now.`,
});

const generateResourcesFlow = ai.defineFlow(
  {
    name: 'generateResourcesFlow',
    inputSchema: GenerateResourcesInputSchema,
    outputSchema: GenerateResourcesOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
