'use server';

import { suggestPalette, type SuggestPaletteInput } from '@/src/ai/flows/suggest-palette';
import { generateResources, type GenerateResourcesInput, type GenerateResourcesOutput } from '@/src/ai/flows/generate-resources';
import { generateAges, type GenerateAgesInput, type GenerateAgesOutput } from '@/src/ai/flows/generate-ages';
import { generateTechnology, type GenerateTechnologyInput, type GeneratedTechnologyOutput } from '@/src/ai/flows/generate-technology';


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

export async function generateAgesAction(input: GenerateAgesInput): Promise<{ data: GenerateAgesOutput | null; error: string | null; }> {
  try {
    const result = await generateAges(input);
    return { data: result, error: null };
  } catch (error) {
    console.error("Error in generateAgesAction:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown AI error occurred.';
    return { data: null, error: `Failed to generate ages. ${errorMessage}` };
  }
}

export async function generateTechnologyAction(input: GenerateTechnologyInput): Promise<{ data: GeneratedTechnologyOutput | null; error: string | null; }> {
  try {
    const result = await generateTechnology(input);
    return { data: result, error: null };
  } catch (error) {
    console.error("Error in generateTechnologyAction:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown AI error occurred.';
    return { data: null, error: `Failed to generate technology. ${errorMessage}` };
  }
}
