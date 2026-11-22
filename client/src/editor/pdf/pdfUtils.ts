import { Font } from "@react-pdf/renderer";

// Disable hyphenation so that each word is returned whole.
Font.registerHyphenationCallback((word) => [word]);

/**
 * For any single word longer than 45 characters (a very rare case),
 * split it into 45 character chunks joined by a zero-width space (\u200B).
 */
export function splitLongWords(text: string): string {
  if (!text) return text;
  return text.replace(/\S{46,}/g, (match) => {
    const chunks: string[] = [];
    for (let i = 0; i < match.length; i += 45) {
      chunks.push(match.slice(i, i + 45));
    }
    return chunks.join("\u200B");
  });
}
