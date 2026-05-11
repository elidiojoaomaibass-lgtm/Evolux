import crypto from 'crypto';

export default async function handler(req, res) {
  // Apenas aceita requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const { phone, amount, reference } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ error: 'Telefone e valor são obrigatórios.' });
    }

    // 1. Variáveis de Ambiente (SÃO SECRETAS, FICAM NA VERCEL E NO .ENV)
    const MPESA_API_KEY = process.env.MPESA_API_KEY;
    const MPESA_PUBLIC_KEY = process.env.MPESA_PUBLIC_KEY;
    const MPESA_SERVICE_PROVIDER_CODE = process.env.MPESA_SERVICE_PROVIDER_CODE || '171717'; // Exemplo padrão do M-Pesa
    const MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox'; // 'sandbox' ou 'production'

    if (!MPESA_API_KEY || !MPESA_PUBLIC_KEY) {
      return res.status(500).json({ error: 'Configuração da API do M-Pesa não encontrada no servidor.' });
    }

    // 2. Gerar o Bearer Token (Criptografia RSA exigida pela Vodacom)
    // O M-Pesa exige que a API_KEY seja criptografada com a PUBLIC_KEY
    const publicKeyBuffer = Buffer.from(
      `-----BEGIN PUBLIC KEY-----\n${MPESA_PUBLIC_KEY}\n-----END PUBLIC KEY-----`
    );
    
    const encryptedAPIKey = crypto.publicEncrypt(
      {
        key: publicKeyBuffer,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(MPESA_API_KEY)
    );
    
    const bearerToken = encryptedAPIKey.toString('base64');

    // 3. Configurar a URL (Produção ou Testes)
    const baseUrl = MPESA_ENVIRONMENT === 'sandbox' 
      ? 'https://api.sandbox.vm.co.mz' 
      : 'https://api.vm.co.mz';

    // Formatar telefone para o padrão moçambicano exigido pela API (258...)
    let formattedPhone = String(phone).replace(/\D/g, '');
    if (formattedPhone.length === 9) formattedPhone = `258${formattedPhone}`;

    // Payload de cobrança (Customer 2 Business)
    const payload = {
      input_TransactionReference: `TRX-${Date.now()}`,
      input_CustomerMSISDN: formattedPhone,
      input_Amount: String(amount),
      input_ThirdPartyReference: reference || `REF-${Date.now()}`,
      input_ServiceProviderCode: MPESA_SERVICE_PROVIDER_CODE,
    };

    // 4. Enviar a requisição para a Vodacom Moçambique
    const response = await fetch(`${baseUrl}/ipg/v1x/c2bPayment/singleStage/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
        'Origin': 'developer.vodacom.co.mz', // Campo de cabeçalho exigido pelo M-Pesa
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // INS-0 é o código de sucesso da Vodacom
    if (!response.ok || data.output_ResponseCode !== 'INS-0') {
      console.error("ERRO M-PESA API:", data);
      return res.status(400).json({ 
        error: 'A operadora recusou ou falhou na cobrança.', 
        details: data.output_ResponseDesc || data 
      });
    }

    // 5. Sucesso!
    return res.status(200).json({
      success: true,
      transactionId: data.output_TransactionID,
      conversationId: data.output_ConversationID,
      message: 'Aviso enviado para o celular do cliente! Aguardando o PIN.'
    });

  } catch (error) {
    console.error("Erro interno M-Pesa Serverless:", error);
    return res.status(500).json({ error: 'Erro grave no servidor ao contactar o M-Pesa.' });
  }
}
