/** LinkedIn/Instagram post → structured event fields. Implemented later. */
export async function extractEventFromText(text: string): Promise<never> {
  throw new Error(
    `AI extraction is not implemented yet (${text.length} characters received)`,
  );
}
