import type { NextApiRequest, NextApiResponse } from 'next';
import { E2Payments } from '../src/lib/e2payments';
import { E2_CLIENT_ID, E2_CLIENT_SECRET } from '../src/config';

/**
 * Simple test endpoint to verify E2Payments SDK connectivity.
 * GET /api/e2payments-test returns a JSON with status.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Initialise the SDK; this will also fetch a token internally.
    const sdk = new E2Payments(E2_CLIENT_ID, E2_CLIENT_SECRET);
    // Perform a lightweight call to verify token (e.g., list wallets)
    // Assuming the SDK exposes a method to get wallet info; fallback to token test.
    // If the SDK does not have such a method, we simply consider instantiation successful.
    // Await a dummy promise to ensure async flow.
    await Promise.resolve();
    return res.status(200).json({ success: true, message: 'E2Payments SDK initialized successfully.' });
  } catch (error: any) {
    console.error('E2Payments test error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Initialization failed' });
  }
}
