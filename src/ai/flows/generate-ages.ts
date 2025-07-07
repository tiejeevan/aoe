'use server';
/**
 * @fileOverview An AI agent that generates a sequence of thematic game ages.
 *
 * - generateAges - A function that generates a specified number of game ages.
 * - GenerateAgesInput - The input type for the generateAges function.
 * - GenerateAgesOutput - The return type for the generateAges function.
 */

import { ai } from '@/src/ai/genkit';
import { z } from 'zod';

const GenerateAgesInputSchema = z.object({
  count: z.number().min(1).max(10).describe('The number of ages to generate.'),
  existingAgeNames: z.array(z.string()).describe('A list of existing age names to avoid duplication and provide context.'),
});
export type GenerateAgesInput = z.infer<typeof GenerateAgesInputSchema>;

const GeneratedAgeSchema = z.object({
    name: z.string().describe('A unique, thematic name for a game age that implies progression (e.g., "Age of Bronze", "Imperial Age", "Age of Heroes").'),
    description: z.string().describe('A brief, flavorful description of the age, capturing its essence.'),
});

const GenerateAgesOutputSchema = z.object({
  ages: z.array(GeneratedAgeSchema).describe('An array of generated game ages, in logical progression.'),
});
export type GenerateAgesOutput = z.infer<typeof GenerateAgesOutputSchema>;

export async function generateAges(input: GenerateAgesInput): Promise<GenerateAgesOutput> {
  return generateAgesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAgesPrompt',
  input: { schema: GenerateAgesInputSchema },
  output: { schema: GenerateAgesOutputSchema },
  prompt: `You are a world-building expert for a fantasy real-time strategy game. Your task is to generate {{count}} unique and thematic game ages that imply a clear sense of progression.

The game already has the following ages, so your new ages should feel like a natural extension or an alternative path. Do not repeat these names:
{{#if existingAgeNames}}
{{#each existingAgeNames}}
- {{this}}
{{/each}}
{{else}}
(No existing ages)
{{/if}}

Generate the sequence of {{count}} new ages now.`,
});

const generateAgesFlow = ai.defineFlow(
  {
    name: 'generateAgesFlow',
    inputSchema: GenerateAgesInputSchema,
    outputSchema: GenerateAgesOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
