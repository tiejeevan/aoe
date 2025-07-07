'use server';

import { suggestPalette, type SuggestPaletteInput } from '@/src/ai/flows/suggest-palette';
import { generateResources, type GenerateResourcesInput, type GenerateResourcesOutput } from '@/src/ai/flows/generate-resources';

export async function suggestPaletteAction(input: SuggestPaletteInput) {
  try {
    const result = await suggestPalette(input);
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { data: null, error: `Failed to suggest a palette. ${errorMessage}` };
  }
}

export async function generateResourcesAction(input: GenerateResourcesInput): Promise<{ data: GenerateResourcesOutput | null; error: string | null; }> {
  try {
    const result = await generateResources(input);
    return { data: result, error: null };
  } catch (error) {
    console.error("Error in generateResourcesAction:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown AI error occurred.';
    return { data: null, error: `Failed to generate resources. ${errorMessage}` };
  }
}
