/**
 * src/lib/rlxgatewayWrapper.ts
 *
 * Wrapper de alto nível para o RLX Gateway SDK.
 * Interface idêntica à de processE2Payment para facilitar a troca de gateway.
 *
 * Docs: https://checkout.rlxl.ink/docs.php
 */

import { RLXGateway, type RLXPaymentRequest, type RLXStatusResponse } from './rlxgateway';

// ─── Tipos exportados ────────────────────────────────────────────────────────

export interface RLXPaymentPayload {
  /** Número do cliente (84/85 → M-Pesa, 86/87 → e-Mola) */
  phone: string;
  /** Valor em MZN (mínimo 50.00) */
  amount: number;
  /** Nome do cliente para relatórios */
  nome_cliente: string;
  /** Número M-Pesa de destino para payout (opcional) */
  payout_phone_mpesa?: string;
  /** Número e-Mola de destino para payout (opcional) */
  payout_phone_emola?: string;
  /** URL de webhook para notificação instantânea (opcional) */
  webhook_url?: string;
}

export interface RLXPaymentResult {
  success: boolean;
  /** ID da transação (ex: "RLX_99887766") */
  transactionId: string;
  /** Status inicial: 'pending' | 'success' */
  status: string;
  message: string;
  /** Dados brutos da resposta da API */
  raw: Record<string, unknown>;
}

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Inicia um pagamento STK Push via RLX Gateway.
 *
 * A rede (M-Pesa ou e-Mola) é determinada automaticamente pelo prefixo do número:
 *  - 84/85 → M-Pesa
 *  - 86/87 → e-Mola
 *
 * @throws Error se o token não estiver configurado ou a API retornar erro.
 *
 * @example
 * const result = await processRLXPayment({
 *   phone: '841234567',
 *   amount: 150,
 *   nome_cliente: 'Jorge Alexandre',
 * });
 * console.log(result.transactionId); // "RLX_99887766"
 */
export async function processRLXPayment(
  payload: RLXPaymentPayload
): Promise<RLXPaymentResult> {
  const gateway = new RLXGateway();

  // ── Payout automático da plataforma ───────────────────────────────────────
  const envPayoutMpesa =
    (typeof import.meta !== 'undefined'
      ? (import.meta as any).env?.VITE_RLX_PAYOUT_MPESA
      : undefined) ??
    (typeof process !== 'undefined'
      ? process.env?.VITE_RLX_PAYOUT_MPESA
      : undefined) ??
    '';

  const envPayoutEmola =
    (typeof import.meta !== 'undefined'
      ? (import.meta as any).env?.VITE_RLX_PAYOUT_EMOLA
      : undefined) ??
    (typeof process !== 'undefined'
      ? process.env?.VITE_RLX_PAYOUT_EMOLA
      : undefined) ??
    '';

  const finalPayoutMpesa = payload.payout_phone_mpesa || envPayoutMpesa;
  const finalPayoutEmola = payload.payout_phone_emola || envPayoutEmola;

  const request: RLXPaymentRequest = {
    phone: payload.phone,
    amount: payload.amount,
    nome_cliente: payload.nome_cliente,
    ...(finalPayoutMpesa && { payout_phone_mpesa: finalPayoutMpesa }),
    ...(finalPayoutEmola && { payout_phone_emola: finalPayoutEmola }),
    ...(payload.webhook_url && { webhook_url: payload.webhook_url }),
  };

  console.log('[RLX Payout] Números de payout injetados:', {
    mpesa: finalPayoutMpesa || '(nenhum)',
    emola: finalPayoutEmola || '(nenhum)',
  });

  const response = await gateway.pay(request);

  if (response.status === 'error') {
    throw new Error(response.msg || 'RLX Gateway: erro ao iniciar o pagamento.');
  }

  return {
    success: true,
    transactionId: response.partner_transaction_id ?? `RLX-${Date.now()}`,
    status: response.status,
    message:
      response.status === 'success'
        ? 'Pagamento confirmado com sucesso!'
        : 'STK Push enviado — o cliente deve confirmar com o PIN.',
    raw: response as Record<string, unknown>,
  };
}

/**
 * Verifica o status de uma transação RLX pelo txid.
 *
 * @example
 * const status = await checkRLXPaymentStatus('RLX_99887766');
 */
export async function checkRLXPaymentStatus(txid: string): Promise<RLXStatusResponse> {
  const gateway = new RLXGateway();
  return gateway.checkStatus(txid);
}

/**
 * Aguarda confirmação de pagamento por polling automático.
 * Resolve com os dados finais ou rejeita após timeout (padrão 120s).
 *
 * @example
 * const confirmed = await waitForRLXPayment('RLX_99887766', {
 *   intervalMs: 5000,
 *   onCheck: (res) => console.log('Status:', res.status),
 * });
 */
export async function waitForRLXPayment(
  txid: string,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
    onCheck?: (res: RLXStatusResponse, elapsedMs: number) => void;
  } = {}
): Promise<RLXStatusResponse> {
  const gateway = new RLXGateway();
  return gateway.waitForConfirmation(txid, options);
}
