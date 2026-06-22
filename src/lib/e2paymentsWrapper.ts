import { E2Payments } from './e2payments';
import { E2_CLIENT_ID, E2_CLIENT_SECRET, E2_WALLET_MPESA, E2_WALLET_EMOLA } from '../config';

/**
 * Process a payment using the E2Payments SDK.
 * @param method 'mpesa' | 'emola'
 * @param payload payment details
 */
export async function processE2Payment(
  method: 'mpesa' | 'emola',
  payload: {
    phone: string;
    amount: number;
    reference: string;
    customerName?: string;
    merchant_user_email?: string;
  }
) {
  // Initialise SDK with client credentials (clientSecret may be undefined if not needed)
  const sdk = new E2Payments(E2_CLIENT_ID, E2_CLIENT_SECRET);

  // Ensure we have a token (SDK will handle authentication internally)
  // Choose the correct wallet based on method
  const walletId = method === 'mpesa' ? E2_WALLET_MPESA : E2_WALLET_EMOLA;

  if (!walletId) {
    throw new Error(`Wallet ID not configured for ${method}`);
  }

  const { phone, amount, reference } = payload;

  // Call the appropriate SDK method
  if (method === 'mpesa') {
    return sdk.c2bMpesaPayment(walletId, amount, phone, reference);
  } else {
    return sdk.c2bEmolaPayment(walletId, amount, phone, reference);
  }
}
