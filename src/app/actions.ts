
'use server';

import { suggestPalette, type SuggestPaletteInput } from '@/ai/flows/suggest-palette';

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
