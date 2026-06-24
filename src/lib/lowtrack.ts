// src/lib/lowtrack.ts
// Utility that returns a LowTrack token from environment variables.
// Checks multiple possible env var names for flexibility.

let cachedToken: string | null = null;

/**
 * Retrieves the LowTrack token.
 * Order of precedence:
 *   1. VITE_LOWTRAK_API_KEY (primary token)
 *   2. VITE_MERCHANT_LOWTRACK_TOKEN (legacy per‑merchant token)
 *   3. LOWTRAK_API_KEY (non‑prefixed fallback)
 *   4. MERCHANT_LOWTRACK_TOKEN (legacy fallback)
 */
export async function getLowtrackToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const token =
    process.env.VITE_LOWTRAK_API_KEY ||
    process.env.VITE_MERCHANT_LOWTRACK_TOKEN ||
    process.env.LOWTRAK_API_KEY ||
    process.env.MERCHANT_LOWTRACK_TOKEN;

  if (!token) {
    throw new Error(
      'LowTrack token not found. Define VITE_LOWTRAK_API_KEY (or related env vars) in .env.'
    );
  }
  cachedToken = token;
  return token;
}
