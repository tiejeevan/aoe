
'use server';
/**
 * @fileOverview An AI agent that suggests complementary color palettes based on a shade of white.
 *
 * - suggestPalette - A function that suggests a color palette based on a white shade.
 * - SuggestPaletteInput - The input type for the suggestPalette function.
 * - SuggestPaletteOutput - The return type for the suggestPalette function.
 */

import { ai } from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPaletteInputSchema = z.object({
  whiteShade: z
    .string()
    .describe('The hexadecimal color code of the white shade.'),
});
export type SuggestPaletteInput = z.infer<typeof SuggestPaletteInputSchema>;

const SuggestPaletteOutputSchema = z.object({
  palette: z.array(z.string()).describe('An array of complementary color palettes in hexadecimal color codes.'),
});
export type SuggestPaletteOutput = z.infer<typeof SuggestPaletteOutputSchema>;

export async function suggestPalette(input: SuggestPaletteInput): Promise<SuggestPaletteOutput> {
  return suggestPaletteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPalettePrompt',
  input: {schema: SuggestPaletteInputSchema},
  output: {schema: SuggestPaletteOutputSchema},
  prompt: `You are a color palette expert. Given a shade of white, suggest a complementary color palette consisting of 5 hexadecimal color codes.

Shade of white: {{{whiteShade}}}

Complementary color palette:`,
});

const suggestPaletteFlow = ai.defineFlow(
  {
    name: 'suggestPaletteFlow',
    inputSchema: SuggestPaletteInputSchema,
    outputSchema: SuggestPaletteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
