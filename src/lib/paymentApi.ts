// src/lib/paymentApi.ts
/**
 * Helper functions for interacting with the payment API.
 * Uses the environment variable VITE_PAYMENT_API_URL defined in .env.
 */

type PaymentRequest = {
  // Adjust fields according to the API specification.
  amount: number;
  currency: string;
  reference: string;
  // Add any other required fields here.
};

type PaymentResponse = {
  success: boolean;
  transactionId?: string;
  message?: string;
  // Extend with additional response properties as needed.
};

/**
 * Sends a C2B payment request.
 * @param data - The payment payload.
 * @returns The parsed JSON response from the API.
 */
export async function postC2BPayment(data: PaymentRequest): Promise<PaymentResponse> {
  const baseUrl = import.meta.env.VITE_PAYMENT_API_URL;
  // Ensure the base URL ends with a slash.
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/c2b/pay/`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `ApiKey ${import.meta.env.VITE_PAYMENT_API_KEY}`,
      // Include any auth headers if required, e.g., Authorization.
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Payment request failed: ${response.status} ${errorText}`);
  }

  const result: PaymentResponse = await response.json();
  return result;
}

/**
 * Example usage:
 * const paymentData = { amount: 1000, currency: "USD", reference: "order-123" };
 * postC2BPayment(paymentData)
 *   .then(res => console.log("Payment result", res))
 *   .catch(err => console.error(err));
 */

export async function postEmolaC2BPayment(data: PaymentRequest): Promise<PaymentResponse> {
  const baseUrl = import.meta.env.VITE_PAYMENT_API_URL;
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/emola/c2b/pay/`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `ApiKey ${import.meta.env.VITE_PAYMENT_API_KEY}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Emola payment request failed: ${response.status} ${errorText}`);
  }
  const result: PaymentResponse = await response.json();
  return result;
}
