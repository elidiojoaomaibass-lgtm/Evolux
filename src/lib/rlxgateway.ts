/**
 * RLX Gateway TypeScript SDK
 * API v1.4.2 (Stable)
 * Documentação: https://checkout.rlxl.ink/docs.php
 *
 * Suporta pagamentos via STK Push (M-Pesa e e-Mola),
 * verificação de status por polling, splits de payout e webhooks.
 */

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface RLXSplitItem {
  /** Número de telefone destinatário (9 dígitos). Ex: "841112233" */
  phone: string;
  /** Rede para o envio do payout: "mpesa" | "emola" */
  method: 'mpesa' | 'emola';
  /**
   * Percentagem do valor líquido a transferir (0 a 100).
   * Mutualmente exclusivo com `value`.
   */
  percent?: number;
  /**
   * Valor fixo em Meticais a transferir.
   * Mutualmente exclusivo com `percent`.
   */
  value?: number;
}

export interface RLXPaymentRequest {
  /** Número do cliente que irá pagar (84/85 para M-Pesa, 86/87 para e-Mola) */
  phone: string;
  /** Valor total bruto do pagamento (Mínimo: 50.00 MT) */
  amount: number | string;
  /** Nome do pagador para fins de controle e relatórios */
  nome_cliente: string;
  /** Número M-Pesa para recebimento do Payout Comerciante (9 dígitos) — Opcional */
  payout_phone_mpesa?: string;
  /** Número e-Mola para recebimento do Payout Comerciante (9 dígitos) — Opcional */
  payout_phone_emola?: string;
  /** URL para notificação instantânea ao confirmar pagamento — Opcional */
  webhook_url?: string;
  /** Array de splits customizados de payout — Opcional */
  splits?: RLXSplitItem[];
}

export interface RLXPaymentResponse {
  status: 'pending' | 'success' | 'error';
  /** ID da transação gerado pelo gateway */
  partner_transaction_id?: string;
  msg?: string;
  [key: string]: unknown;
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

export interface RLXWebhookPayload {
  event: 'payment.success' | 'payment.failed' | 'payment.pending';
  txid: string;
  canal: 'mpesa' | 'emola';
  status: string;
  pagador: string;
  nome_pagador: string;
  valor_bruto: number;
  taxa_rlx: number;
  valor_liquido: number;
  comerciante: string;
  payout_phone_mpesa?: string;
  payout_phone_emola?: string;
  splits?: RLXSplitItem[];
  data: string;
}

export interface RLXPollingOptions {
  /** Intervalo entre consultas em milissegundos (padrão: 5000ms = 5s) */
  intervalMs?: number;
  /** Tempo máximo de espera em milissegundos (padrão: 120000ms = 120s) */
  timeoutMs?: number;
  /** Callback executado a cada verificação de status */
  onCheck?: (response: RLXStatusResponse, elapsedMs: number) => void;
}

// ─── Classe principal ─────────────────────────────────────────────────────────

export class RLXGateway {
  private readonly apiUrl: string = 'https://checkout.rlxl.ink/api.php';
  private readonly token: string;

  /**
   * @param token  Token Bearer privado do painel RLX Holdings.
   *               Lido de `import.meta.env.VITE_RLX_API_TOKEN` por padrão.
   */
  constructor(token?: string) {
    const resolved =
      token ??
      (typeof import.meta !== 'undefined'
        ? (import.meta as any).env?.VITE_RLX_API_TOKEN
        : undefined) ??
      (typeof process !== 'undefined'
        ? process.env?.RLX_API_TOKEN
        : undefined);

    if (!resolved) {
      throw new Error(
        'RLX Gateway: token não encontrado. ' +
        'Defina VITE_RLX_API_TOKEN no .env ou passe o token no construtor.'
      );
    }
    this.token = resolved;
  }

  // ─── Requests internos ──────────────────────────────────────────────────────

  private async post<T>(payload: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let data: T;
    try {
      data = await response.json();
    } catch {
      const text = await response.text();
      throw new Error(`RLX Gateway: resposta inválida (${response.status}): ${text}`);
    }

    if (!response.ok) {
      const err = data as any;
      throw new Error(err?.msg || err?.message || `Erro HTTP ${response.status}`);
    }

    return data;
  }

  // ─── Métodos públicos ────────────────────────────────────────────────────────

  /**
   * Inicia um pagamento STK Push (C2B) para M-Pesa ou e-Mola.
   *
   * O número `phone` determina automaticamente a rede:
   *  - 84/85 → M-Pesa
   *  - 86/87 → e-Mola
   *
   * @example
   * const gateway = new RLXGateway();
   * const res = await gateway.pay({
   *   phone: '841234567',
   *   amount: 100,
   *   nome_cliente: 'Jorge Alexandre',
   *   webhook_url: 'https://meu-site.com/webhook',
   * });
   * console.log(res.partner_transaction_id);
   */
  public async pay(data: RLXPaymentRequest): Promise<RLXPaymentResponse> {
    return this.post<RLXPaymentResponse>({
      action: 'pay',
      ...data,
    });
  }

  /**
   * Verifica o status de uma transação pelo `txid`.
   * Recomendado fazer polling a cada 5 segundos.
   *
   * @param txid  ID da transação retornado por `pay()` (ex: "RLX_99887766")
   */
  public async checkStatus(txid: string): Promise<RLXStatusResponse> {
    return this.post<RLXStatusResponse>({ action: 'check', txid });
  }

  /**
   * Aguarda a confirmação de um pagamento por polling automático.
   * Resolve quando o status for `success`/`completed` ou rejeita após timeout ou falha.
   *
   * @param txid     ID da transação a monitorizar
   * @param options  Configurações de polling (intervalo, timeout, callback)
   *
   * @example
   * const result = await gateway.waitForConfirmation('RLX_99887766', {
   *   intervalMs: 5000,
   *   timeoutMs: 120000,
   *   onCheck: (res, elapsed) => console.log(`[${elapsed}ms] status:`, res.status),
   * });
   */
  public waitForConfirmation(
    txid: string,
    options: RLXPollingOptions = {}
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
          const res = await this.checkStatus(txid);
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
}

// ─── Instância singleton (usa env var automaticamente) ────────────────────────

let _instance: RLXGateway | null = null;

/**
 * Retorna a instância partilhada do RLXGateway.
 * A primeira chamada inicializa o singleton; chamadas subsequentes reutilizam-no.
 *
 * @example
 * import { getRLXGateway } from '@/lib/rlxgateway';
 *
 * const gateway = getRLXGateway();
 * const res = await gateway.pay({ phone: '841234567', amount: 100, nome_cliente: 'Cliente' });
 */
export function getRLXGateway(): RLXGateway {
  if (!_instance) {
    _instance = new RLXGateway();
  }
  return _instance;
}
