function formatGatewayError(data: any): string {
    const raw = data?.data?.response_description 
        || data?.message 
        || data?.error 
        || (data?.errors ? JSON.stringify(data.errors) : '');
    const code = data?.data?.response_code || '';

    if (code === 'INS-9' || raw.toLowerCase().includes('timeout')) {
        return 'O tempo para digitar o PIN no telemóvel expirou (Request timeout). Por favor, tente novamente e digite o PIN assim que a notificação surgir no telemóvel.';
    }
    if (code === 'INS-6' || raw.toLowerCase().includes('cancelled') || raw.toLowerCase().includes('cancelada')) {
        return 'Transação cancelada ou recusada no telemóvel.';
    }
    if (code === 'INS-2006' || code === 'INS-2001' || raw.toLowerCase().includes('insufficient')) {
        return 'Saldo insuficiente na sua conta M-Pesa/e-Mola.';
    }
    if (code === 'KWK-BLOCKED') {
        return 'Comunicação temporariamente bloqueada pela Vodacom. Tente novamente em instantes.';
    }
    return raw || 'Erro no processamento do pagamento.';
}

export class E2Payments {
    private clientId: string;
    private clientSecret: string;
    private token: string | null = null;
    private baseUrl: string;

    constructor(clientId?: string, clientSecret?: string) {
        // Credentials come from env vars or KwikPay defaults
        this.clientId     = clientId     || import.meta.env.VITE_KWIKPAY_CLIENT_ID     || import.meta.env.VITE_E2_CLIENT_ID     || '5';
        this.clientSecret = clientSecret || import.meta.env.VITE_KWIKPAY_CLIENT_SECRET || import.meta.env.VITE_E2_CLIENT_SECRET || 'tZi6BmjOLmuVOuJb1rVx9FynoJXYxgcyGqJlmEvz';

        // In browser, use the same-origin proxy (/api/kwikpay-proxy) to bypass CORS blocks
        this.baseUrl = typeof window !== 'undefined' ? '/api/kwikpay-proxy' : 'https://kwikpay.web.tr';
    }

    async authenticate(): Promise<string> {
        if (this.token) return this.token;

        const response = await fetch(`${this.baseUrl}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret
            })
        });

        if (!response.ok) {
            const err = await response.text();
            let parsedErr = err;
            try {
                const jsonErr = JSON.parse(err);
                parsedErr = jsonErr.message || jsonErr.error_description || jsonErr.error || err;
            } catch {}
            throw new Error(`Auth failed: ${parsedErr}`);
        }

        const data = await response.json();
        this.token = data.access_token;
        return data.access_token;
    }

    async c2bPayment(method: 'mpesa' | 'emola', walletId: string, amount: number, phone: string, reference: string) {
        // Reference must not exceed 20 characters in KwikPay
        const cleanRef = String(reference || `ORD${Date.now()}`).slice(0, 20);

        // Sanitize phone to 9 digits (e.g. 856195186)
        let cleanPhone = String(phone).replace(/\D/g, '');
        if (cleanPhone.startsWith('258') && cleanPhone.length > 9) {
            cleanPhone = cleanPhone.substring(3);
        }
        cleanPhone = cleanPhone.slice(-9);

        // 1. Try via direct proxy (/api/kwikpay-proxy)
        try {
            await this.authenticate();

            const endpoint = method === 'mpesa' ? 'mpesa-payment' : 'emola-payment';
            const url = `${this.baseUrl}/api/v1/c2b/${endpoint}/${walletId}`;

            const payload = {
                amount: Number(amount),
                phone: cleanPhone,
                reference: cleanRef
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || (data && data.success === false)) {
                throw new Error(formatGatewayError(data));
            }

            return data;
        } catch (proxyErr: any) {
            // If proxy failed due to network / CORS, fallback to serverless function /api/kwikpay
            if (proxyErr.message?.includes('fetch') || proxyErr.message?.includes('NetworkError') || proxyErr.name === 'TypeError') {
                console.warn('Proxy request failed, falling back to /api/kwikpay serverless endpoint...');
                const fallbackRes = await fetch('/api/kwikpay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        method,
                        walletId,
                        amount: Number(amount),
                        phone: cleanPhone,
                        reference: cleanRef
                    })
                });

                const fallbackData = await fallbackRes.json().catch(() => null);

                if (!fallbackRes.ok || (fallbackData && fallbackData.success === false)) {
                    throw new Error(formatGatewayError(fallbackData));
                }

                return fallbackData;
            }

            throw proxyErr;
        }
    }
}
