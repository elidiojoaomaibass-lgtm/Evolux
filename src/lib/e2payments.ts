/**
 * e2Payments Javascript/TypeScript SDK
 * Baseado na documentação oficial: https://mpesaemolatech.com/docs/api
 */

export class E2Payments {
  private clientId: string;
  private clientSecret: string | undefined;
  private baseURL: string = 'https://e2payments.explicador.co.mz';
  private token: string | null = null;

  constructor(clientId: string, clientSecret?: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Armazena o token no navegador (Cookies)
   * Válido por 'days' dias
   */
  public storeTokenInBrowser(token: string, days: number = 10) {
    if (typeof document !== 'undefined') {
      const date = new Date();
      date.setDate(date.getDate() + days);
      document.cookie = `e2payment_token=Bearer ${token}; expires=${date.toUTCString()}; path=/`;
    }
  }

  /**
   * Recupera o token do navegador (Cookies)
   */
  public getTokenFromBrowser(): string | null {
    if (typeof document !== 'undefined') {
      const nameEQ = "e2payment_token=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length).replace('Bearer ', '');
      }
    }
    return null;
  }

  /**
   * Autenticação e geração de token
   */
  public async authenticate(): Promise<string> {
    if (!this.clientSecret) {
      throw new Error('client_secret é necessário para gerar um token.');
    }

    const response = await fetch(`${this.baseURL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Falha na autenticação');
    }

    this.token = data.access_token;
    return this.token as string;
  }

  public setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, payload: any = {}) {
    if (!this.token) {
      this.token = this.getTokenFromBrowser();
      if (!this.token) {
        if (this.clientSecret) {
           await this.authenticate();
        } else {
           throw new Error('Não há token disponível e client_secret não foi fornecido.');
        }
      }
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        ...payload
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw data;
    }
    return data;
  }

  /**
   * Transação C2B (M-Pesa)
   * @param walletId ID da carteira de destino
   * @param amount Valor a cobrar
   * @param phone Número do cliente (ex: 841234567)
   * @param reference Referência da transação
   */
  public async c2bMpesaPayment(walletId: string | number, amount: string | number, phone: string, reference: string) {
    return this.request(`/v1/c2b/mpesa-payment/${walletId}`, { amount, phone, reference });
  }

  /**
   * Transação C2B (e-Mola)
   * @param walletId ID da carteira de destino
   * @param amount Valor a cobrar
   * @param phone Número do cliente (ex: 861234567)
   * @param reference Referência da transação
   */
  public async c2bEmolaPayment(walletId: string | number, amount: string | number, phone: string, reference: string) {
    return this.request(`/v1/c2b/emola-payment/${walletId}`, { amount, phone, reference });
  }

  /**
   * Listar todas as carteiras
   */
  public async getWallets() {
    return this.request('/v1/wallets/mpesa/get/all');
  }

  /**
   * Detalhes de uma carteira
   * @param walletId ID da carteira
   */
  public async getWalletDetails(walletId: string | number) {
    return this.request(`/v1/wallets/mpesa/get/${walletId}`);
  }

  /**
   * Histórico de todos os pagamentos
   */
  public async getPaymentsHistory() {
    return this.request('/v1/payments/mpesa/get/all');
  }

  /**
   * Histórico paginado de pagamentos
   * @param itemsPerPage Quantidade de itens por página
   */
  public async getPaymentsHistoryPaginated(itemsPerPage: number) {
    return this.request(`/v1/payments/mpesa/get/all/paginate/${itemsPerPage}`);
  }
}
