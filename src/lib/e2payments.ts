export class E2Payments {
    private clientId: string;
    private clientSecret: string;
    private token: string | null = null;
    private baseUrl = 'https://mpesaemolatech.com';

    constructor(clientId?: string, clientSecret?: string) {
        this.clientId = clientId || import.meta.env.VITE_E2P_CLIENT_ID || import.meta.env.VITE_MPESA_API_KEY || '';
        this.clientSecret = clientSecret || import.meta.env.VITE_E2P_CLIENT_SECRET || import.meta.env.MPESA_API_KEY || '';

        if (!this.clientId || !this.clientSecret) {
            console.warn("E2Payments SDK missing credentials.");
        }
    }

    async authenticate(): Promise<string> {
        if (this.token) return this.token;

        const response = await fetch(`${this.baseUrl}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Auth failed: ${err}`);
        }

        const data = await response.json();
        this.token = data.access_token;
        return data.access_token;
    }

    async c2bPayment(method: 'mpesa' | 'emola', walletId: string, amount: number, phone: string, reference: string) {
        await this.authenticate();

        const endpoint = method === 'mpesa' ? 'mpesa-payment' : 'emola-payment';
        const url = `${this.baseUrl}/v1/c2b/${endpoint}/${walletId}`;

        const payload = {
            client_id: this.clientId,
            amount: amount,
            phone: phone,
            reference: reference
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

        const data = await response.json();

        // The API returns status 200 or 201 for success, or an error payload
        if (!response.ok) {
            // Check if we have specific M-Pesa or e-Mola response codes to map
            if (data.mpesa_server_response || data.emola_server_response) {
                throw data;
            }
            throw new Error(data.message || data.error || 'Payment request failed');
        }

        return data;
    }
}
