/**
 * src/lib/rlxgatewayWrapper.ts
 *
 * Wrapper de alto nível para o RLX Gateway SDK.
 * Todas as chamadas passam pelo proxy backend (/api/rlx-pay)
 * para evitar problemas de CORS no browser.
 *
 * Docs: https://checkout.rlxl.ink/docs.php
 */

// ─── Tipos exportados ────────────────────────────────────────────────────────

export interface RLXPaymentPayload {
  /** Número do cliente (84/85 → M-Pesa, 86/87 → e-Mola) */
  phone: string;
  /** Valor em MZN (mínimo 50.00) */
  amount: number;
  /** Nome do cliente para relatórios */
  nome_cliente: string;
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

export interface RLXStatusResponse {
  status: 'pending' | 'success' | 'completed' | 'failed' | 'error';
  txid?: string;
  canal?: 'mpesa' | 'emola';
  pagador?: string;
  nome_pagador?: string;
  valor_bruto?: number;
  taxa_rlx?: number;
  valor_liquido?: number;
  data?: string;
  msg?: string;
  [key: string]: unknown;
}

// ─── Helper: chamada ao proxy backend ─────────────────────────────────────────

async function callRLXProxy(payload: Record<string, unknown>): Promise<any> {
  const proxyUrl = `${window.location.origin}/api/rlx-pay`;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    // Se a resposta não for JSON (ex: página HTML de erro do Cloudflare ou Gateway em baixo)
    throw new Error(`O provedor de pagamentos encontra-se temporariamente indisponível. Por favor, tente novamente mais tarde.`);
  }

  if (!response.ok) {
    throw new Error(data?.msg || data?.error || data?.message || `Erro HTTP ${response.status}`);
  }

  return data;
}

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Inicia um pagamento STK Push via RLX Gateway (através do proxy backend).
 *
 * A rede (M-Pesa ou e-Mola) é determinada automaticamente pelo prefixo do número:
 *  - 84/85 → M-Pesa
 *  - 86/87 → e-Mola
 *
 * @throws Error se a API retornar erro.
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

  const splits: any[] = [];
  
  if (payload.phone.startsWith('84') || payload.phone.startsWith('85')) {
      splits.push({
          phone: '856195186',
          method: 'mpesa',
          percent: 100
      });
  } else if (payload.phone.startsWith('86') || payload.phone.startsWith('87')) {
      splits.push({
          phone: '877575186',
          method: 'emola',
          percent: 100
      });
  }

  const requestBody: Record<string, unknown> = {
    action: 'pay',
    phone: payload.phone,
    amount: payload.amount,
    nome_cliente: payload.nome_cliente,
    ...(payload.webhook_url && { webhook_url: payload.webhook_url }),
    ...(splits.length > 0 && { splits }),
  };

  console.log('[RLX Payout] Splits injetados:', splits);

  const response = await callRLXProxy(requestBody);

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
  return callRLXProxy({ action: 'check', txid });
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
  const {
    intervalMs = 5_000,
    timeoutMs = 120_000,
    onCheck,
  } = options;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let timer: ReturnType<typeof setInterval>;

    const poll = async () => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= timeoutMs) {
        clearInterval(timer);
        reject(
          new Error(
            `RLX Gateway: timeout de ${timeoutMs}ms atingido. ` +
            `O pagamento (${txid}) não foi confirmado a tempo.`
          )
        );
        return;
      }

      try {
        const res = await checkRLXPaymentStatus(txid);
        onCheck?.(res, elapsed);

        if (res.status === 'success' || res.status === 'completed') {
          clearInterval(timer);
          resolve(res);
        } else if (res.status === 'failed') {
          clearInterval(timer);
          reject(new Error(`RLX Gateway: pagamento ${txid} falhou ou foi cancelado.`));
        }
        // 'pending' → continua a fazer polling
      } catch (err) {
        clearInterval(timer);
        reject(err);
      }
    };

    // Primeira verificação imediata, depois em intervalos
    poll();
    timer = setInterval(poll, intervalMs);
  });
}
