// src/lib/lowtrack.ts
// Simple utility that returns the LowTrack API token from environment variables.
// The token is expected to be stored in VITE_LOWTRAK_API_KEY (or LOWTRAK_API_KEY).

let cachedToken: string | null = null;

/**
 * Returns the LowTrack token from environment variables.
 * Caches the token after the first read.
 * Throws an error if the token is not defined.
 */
export async function getLowtrackToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const token = process.env.VITE_LOWTRAK_API_KEY || process.env.LOWTRAK_API_KEY;
  if (!token) {
    throw new Error(
      'LowTrack token not found. Define VITE_LOWTRAK_API_KEY (or LOWTRAK_API_KEY) in .env.'
    );
  }
  cachedToken = token;
  return token;
}
