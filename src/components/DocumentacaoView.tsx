import {
    Terminal,
    Copy, Check, ExternalLink, Shield,
    Smartphone, Zap, Server, Key, Target, Globe, FileCode
} from 'lucide-react';
import { useState } from 'react';

type Lang = 'php' | 'curl' | 'js' | 'python';

const LANG_LABELS: Record<Lang, string> = {
    php: 'ðŸ˜ PHP',
    curl: 'cURL',
    js: 'JS (Fetch)',
    python: 'ðŸ Python',
};

export const DocumentacaoView = () => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [activeLang, setActiveLang] = useState<Lang>('js');

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // â”€â”€ Credentials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const CLIENT_ID     = import.meta.env.VITE_KWIKPAY_CLIENT_ID || import.meta.env.VITE_E2_CLIENT_ID || '';
    const CLIENT_SECRET = import.meta.env.VITE_KWIKPAY_CLIENT_SECRET || import.meta.env.VITE_E2_CLIENT_SECRET || '';
    const WALLET_UUID   = import.meta.env.VITE_KWIKPAY_WALLET_ID || import.meta.env.VITE_E2_WALLET_MPESA || '';
    const PHONE         = '856195186'; // Joao Maibass
    const BASE          = 'https://kwikpay.web.tr';

    // â”€â”€ Token snippets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const tokenSnippets: Record<Lang, string> = {
        php: `<?php\n$ch = curl_init('${BASE}/oauth/token');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([\n    'grant_type'    => 'client_credentials',\n    'client_id'     => '${CLIENT_ID}',\n    'client_secret' => '${CLIENT_SECRET}'\n]));\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);\n$data  = json_decode(curl_exec($ch), true);\n$token = $data['access_token'];\ncurl_close($ch);`,
        curl: `curl -X POST ${BASE}/oauth/token \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "grant_type":    "client_credentials",\n    "client_id":     "${CLIENT_ID}",\n    "client_secret": "${CLIENT_SECRET}"\n  }'`,
        js:   `const res = await fetch('${BASE}/oauth/token', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    grant_type:    'client_credentials',\n    client_id:     '${CLIENT_ID}',\n    client_secret: '${CLIENT_SECRET}'\n  })\n});\nconst { access_token: token } = await res.json();`,
        python: `import requests\n\nres = requests.post('${BASE}/oauth/token', json={\n    'grant_type':    'client_credentials',\n    'client_id':     '${CLIENT_ID}',\n    'client_secret': '${CLIENT_SECRET}'\n})\ntoken = res.json()['access_token']`,
    };

    // â”€â”€ C2B snippets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const c2bSnippets: Record<Lang, string> = {
        php: `<?php\n// ApÃ³s obter o tokenâ€¦\n$ch = curl_init('${BASE}/api/v1/c2b/mpesa-payment/${WALLET_UUID}');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([\n    'amount'    => 10,\n    'phone'     => '${PHONE}',   // Joao Maibass\n    'reference' => 'PAG_' . time()\n]));\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    'Authorization: Bearer ' . $token,\n    'Content-Type: application/json'\n]);\n$result = json_decode(curl_exec($ch), true);\ncurl_close($ch);\nprint_r($result);`,
        curl: `curl -X POST ${BASE}/api/v1/c2b/mpesa-payment/${WALLET_UUID} \\\n  -H "Authorization: Bearer SEU_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "amount":    10,\n    "phone":     "${PHONE}",\n    "reference": "PAG_001"\n  }'`,
        js: `const payment = await fetch(\n  '${BASE}/api/v1/c2b/mpesa-payment/${WALLET_UUID}',\n  {\n    method: 'POST',\n    headers: {\n      'Authorization': \`Bearer \${token}\`,\n      'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({\n      amount:    10,\n      phone:     '${PHONE}',   // Joao Maibass\n      reference: 'PAG_' + Date.now()\n    })\n  }\n);\nconst result = await payment.json();\nconsole.log('Pagamento:', result);`,
        python: `headers = {\n    'Authorization': f'Bearer {token}',\n    'Content-Type':  'application/json'\n}\nres = requests.post(\n    '${BASE}/api/v1/c2b/mpesa-payment/${WALLET_UUID}',\n    json={\n        'amount':    10,\n        'phone':     '${PHONE}',   # Joao Maibass\n        'reference': 'PAG_001'\n    },\n    headers=headers\n)\nprint(res.json())`,
    };

    // â”€â”€ Balance snippets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const balanceSnippets: Record<Lang, string> = {
        curl: `curl -X GET ${BASE}/api/v1/wallet/${WALLET_UUID}/balance \\\n  -H "Authorization: Bearer SEU_TOKEN" \\\n  -H "Accept: application/json"`,
        js: `const res = await fetch(\n  '${BASE}/api/v1/wallet/${WALLET_UUID}/balance',\n  { headers: { 'Authorization': \`Bearer \${token}\`, 'Accept': 'application/json' } }\n);\nconst { data } = await res.json();\nconsole.log('Saldo:', data.balance, data.currency);`,
        php: `<?php\n$ch = curl_init('${BASE}/api/v1/wallet/${WALLET_UUID}/balance');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    'Authorization: Bearer ' . $token,\n    'Accept: application/json'\n]);\n$balance = json_decode(curl_exec($ch), true);\ncurl_close($ch);\nprint_r($balance);`,
        python: `res = requests.get(\n    '${BASE}/api/v1/wallet/${WALLET_UUID}/balance',\n    headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'}\n)\nprint(res.json())`,
    };

    // â”€â”€ Transactions snippets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const txSnippets: Record<Lang, string> = {
        curl: `curl -X GET "${BASE}/api/v1/transactions?per_page=5" \\\n  -H "Authorization: Bearer SEU_TOKEN" \\\n  -H "Accept: application/json"`,
        js: `const res = await fetch(\n  '${BASE}/api/v1/transactions?per_page=5',\n  { headers: { 'Authorization': \`Bearer \${token}\`, 'Accept': 'application/json' } }\n);\nconst transactions = await res.json();`,
        php: `<?php\n$ch = curl_init('${BASE}/api/v1/transactions?per_page=5');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    'Authorization: Bearer ' . $token,\n    'Accept: application/json'\n]);\n$txs = json_decode(curl_exec($ch), true);\ncurl_close($ch);`,
        python: `res = requests.get(\n    '${BASE}/api/v1/transactions',\n    params={'per_page': 5},\n    headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'}\n)\nprint(res.json())`,
    };

    const successResponse = `{\n  "success": true,\n  "data": {\n    "transaction_id":       "9575e249-65cf-4b66-b8ff-4771fb5caef1",\n    "mpesa_transaction_id": "921hiyazhq45",\n    "conversation_id":      "01e0a9ddcb014181944bb6b6aaa5310b",\n    "reference":            "PAG_001",\n    "amount":               10,\n    "phone":                "258${PHONE}",\n    "status":               "success",\n    "fees": {\n      "amount":              10,\n      "mpesa_fee_percent":   3,\n      "mpesa_fee_amount":    0.3,\n      "kwikpay_fee_percent": 4,\n      "kwikpay_fee_amount":  0.4,\n      "total_fees":          0.7,\n      "net_amount":          9.3\n    },\n    "timestamp": "2026-03-28T06:15:35+00:00"\n  },\n  "message": "Pagamento processado com sucesso"\n}`;

    // â”€â”€ Shared Code Block â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const CodeBlock = ({ code, id }: { code: string; id: string }) => (
        <div className="relative">
            <div className="absolute top-3 right-3 z-20">
                <button
                    onClick={() => copyToClipboard(code, id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg text-white/60 hover:text-white transition-all border border-white/10 text-[10px] font-bold"
                >
                    {copiedId === id ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === id ? 'Copiado!' : 'Copiar'}
                </button>
            </div>
            <pre className="p-5 pt-10 rounded-2xl bg-slate-950 text-slate-300 overflow-x-auto text-[11px] md:text-xs font-mono leading-relaxed border border-white/5 shadow-2xl">
                {code}
            </pre>
        </div>
    );

    // â”€â”€ Language Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const LangTabs = () => (
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-brand-950 border border-slate-200 dark:border-brand-800 w-fit flex-wrap">
            {(Object.keys(LANG_LABELS) as Lang[]).map((lang) => (
                <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        activeLang === lang
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                            : 'text-slate-500 dark:text-brand-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                >
                    {LANG_LABELS[lang]}
                </button>
            ))}
        </div>
    );

    return (
        <div className="px-4 md:px-8 pt-2 md:pt-4 pb-20 space-y-6 md:space-y-8 w-full max-w-none mx-auto transition-all duration-700">

            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 xl:gap-16">
                <div className="space-y-1 md:space-y-3 mt-3 md:mt-2">
                    <div className="flex items-center gap-3 mb-1 pl-[3.5rem] md:pl-0">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <Zap size={18} className="md:w-[22px] md:h-[22px]" />
                        </div>
                        <span className="text-[9px] md:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">KwikPay Â· Docs Oficiais</span>
                    </div>
                    <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none pl-[3.5rem] md:pl-0">
                        IntegraÃ§Ã£o <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">KwikPay</span>
                    </h2>
                    <p className="text-[10px] md:text-xs text-slate-400 dark:text-brand-400 font-medium tracking-tight pl-[3.5rem] md:pl-0 leading-snug max-w-2xl">
                        DocumentaÃ§Ã£o oficial de integraÃ§Ã£o de pagamentos M-Pesa via gateway <b className="text-slate-900 dark:text-white">KwikPay</b>. Exemplos em PHP, cURL, JavaScript e Python.
                    </p>
                </div>
                <div className="hidden xl:block shrink-0">
                    <LangTabs />
                </div>
            </div>

            {/* Credentials Alert */}
            <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
                    <Key size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight mb-2">Credenciais â€” Joao Maibass</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        {[
                            { label: 'Base URL',       value: BASE },
                            { label: 'Client ID',      value: CLIENT_ID },
                            { label: 'Client Secret',  value: CLIENT_SECRET },
                            { label: 'Wallet UUID',    value: WALLET_UUID },
                            { label: 'Telefone (C2B)', value: PHONE + ' Â· Joao Maibass' },
                        ].map((r) => (
                            <div key={r.label} className="flex items-center justify-between bg-amber-100/60 dark:bg-amber-900/20 rounded-lg px-3 py-2 gap-2">
                                <span className="text-amber-700 dark:text-amber-400 font-bold text-[10px] shrink-0">{r.label}</span>
                                <span className="text-amber-900 dark:text-amber-200 truncate flex-1">{r.value}</span>
                                <button
                                    onClick={() => copyToClipboard(r.value, 'cred-' + r.label)}
                                    className="shrink-0 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                                >
                                    {copiedId === 'cred-' + r.label ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Language Selector mobile */}
            <div className="xl:hidden">
                <LangTabs />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-12">

                    {/* 1. Auth */}
                    <section id="auth" className="space-y-4">
                        <div className="space-y-2 pl-14 lg:pl-0">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Shield className="text-violet-500" size={20} />
                                1. AutenticaÃ§Ã£o (OAuth2)
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-brand-300 font-medium">
                                Todas as requisiÃ§Ãµes exigem um <b>Bearer Token</b>. Gere-o com as credenciais abaixo.
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded uppercase">POST</span>
                                <code className="text-[11px] font-bold text-slate-500 dark:text-brand-400 bg-slate-100 dark:bg-brand-800 px-2 py-0.5 rounded">/oauth/token</code>
                            </div>
                        </div>
                        <CodeBlock code={tokenSnippets[activeLang]} id={`token-${activeLang}`} />
                    </section>

                    {/* 2. C2B */}
                    <section id="c2b" className="space-y-4">
                        <div className="space-y-2 pl-14 lg:pl-0">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Terminal className="text-emerald-500" size={20} />
                                2. Pagamento C2B â€” <span className="text-emerald-500">{PHONE}</span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-brand-400 font-medium">
                                CobranÃ§a ao cliente <b>Joao Maibass</b> pelo nÃºmero <b className="text-emerald-600 dark:text-emerald-400">{PHONE}</b> via M-Pesa.
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded uppercase">POST</span>
                                <code className="text-[11px] font-bold text-slate-500 dark:text-brand-400 bg-slate-100 dark:bg-brand-800 px-2 py-0.5 rounded">/api/v1/c2b/mpesa-payment/{'{wallet_uuid}'}</code>
                            </div>
                        </div>
                        <CodeBlock code={c2bSnippets[activeLang]} id={`c2b-${activeLang}`} />
                        {/* Parameters table */}
                        <div className="rounded-2xl border border-slate-100 dark:border-brand-800 overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-brand-950 border-b border-slate-100 dark:border-brand-800">
                                    <tr>
                                        <th className="px-4 py-3 font-black text-slate-900 dark:text-white uppercase tracking-wider">Campo</th>
                                        <th className="px-4 py-3 font-black text-slate-900 dark:text-white uppercase tracking-wider">Tipo</th>
                                        <th className="px-4 py-3 font-black text-slate-900 dark:text-white uppercase tracking-wider">DescriÃ§Ã£o</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-brand-800 dark:bg-brand-900">
                                    {[
                                        { name: 'amount',    type: 'number', desc: 'Valor da transaÃ§Ã£o em MZN (Ex: 10)' },
                                        { name: 'phone',     type: 'string', desc: `NÃºmero M-Pesa 9 dÃ­gitos (Ex: ${PHONE})` },
                                        { name: 'reference', type: 'string', desc: 'Identificador Ãºnico sem espaÃ§os (Ex: PAG_001)' },
                                    ].map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{p.name}</td>
                                            <td className="px-4 py-3 font-mono text-violet-500 text-[10px]">{p.type}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-brand-300 font-medium">{p.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 3. Balance */}
                    <section id="balance" className="space-y-4">
                        <div className="space-y-2 pl-14 lg:pl-0">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Globe className="text-blue-500" size={20} />
                                3. Consultar Saldo
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded uppercase">GET</span>
                                <code className="text-[11px] font-bold text-slate-500 dark:text-brand-400 bg-slate-100 dark:bg-brand-800 px-2 py-0.5 rounded">/api/v1/wallet/{'{wallet_uuid}'}/balance</code>
                            </div>
                        </div>
                        <CodeBlock code={balanceSnippets[activeLang]} id={`balance-${activeLang}`} />
                    </section>

                    {/* 4. Transactions */}
                    <section id="transactions" className="space-y-4">
                        <div className="space-y-2 pl-14 lg:pl-0">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Server className="text-violet-500" size={20} />
                                4. Listar TransaÃ§Ãµes
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded uppercase">GET</span>
                                <code className="text-[11px] font-bold text-slate-500 dark:text-brand-400 bg-slate-100 dark:bg-brand-800 px-2 py-0.5 rounded">/api/v1/transactions?per_page=5</code>
                            </div>
                        </div>
                        <CodeBlock code={txSnippets[activeLang]} id={`txs-${activeLang}`} />
                    </section>

                    {/* 5. Success Response */}
                    <section id="response" className="space-y-4">
                        <div className="space-y-2 pl-14 lg:pl-0">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <FileCode className="text-teal-500" size={20} />
                                5. Resposta de Sucesso (C2B)
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-brand-400">
                                Exemplo de resposta ao processar pagamento do cliente <b className="text-emerald-500">{PHONE}</b> (Joao Maibass).
                            </p>
                        </div>
                        <CodeBlock code={successResponse} id="response" />
                        {/* Fees breakdown */}
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                            <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-tight mb-3">Estrutura de Taxas</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'M-Pesa Fee',    value: '3%',      sub: '0.30 MZN' },
                                    { label: 'KwikPay Fee',   value: '4%',      sub: '0.40 MZN' },
                                    { label: 'Total Taxas',   value: '7%',      sub: '0.70 MZN' },
                                    { label: 'Valor LÃ­quido', value: '9.30 MZN', sub: 'de 10 MZN' },
                                ].map((f) => (
                                    <div key={f.label} className="bg-white dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                                        <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">{f.value}</div>
                                        <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">{f.label}</div>
                                        <div className="text-[9px] text-slate-400 mt-0.5">{f.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* 6. Meta Pixel */}
                    <section id="meta-pixel" className="space-y-4 pt-8 border-t border-slate-100 dark:border-brand-800">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Target className="text-violet-500" size={20} />
                            6. Meta Pixel (Facebook)
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-brand-300 font-medium leading-relaxed">
                            O rastreamento de conversÃµes via Meta Pixel estÃ¡ integrado. Ao adicionar o ID na aba de IntegraÃ§Ãµes, o sistema irÃ¡ automaticamente:
                        </p>
                        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-brand-300 space-y-2 ml-2">
                            <li>Disparar o evento <b>PageView</b> em todas as pÃ¡ginas do produto.</li>
                            <li>Disparar o evento <b>InitiateCheckout</b> quando o cliente aceder Ã  pÃ¡gina de compra.</li>
                            <li>Disparar o evento <b>Purchase</b> (com valor de conversÃ£o) na pÃ¡gina "Obrigado".</li>
                        </ul>
                        <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/20">
                            <h4 className="text-xs font-black text-violet-900 dark:text-violet-200 uppercase tracking-tight mb-2">Como Ativar?</h4>
                            <p className="text-xs text-violet-700 dark:text-violet-400">
                                VÃ¡ Ã  aba de{' '}
                                <b className="cursor-pointer underline" onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: 'IntegraÃ§Ãµes' }))}>
                                    IntegraÃ§Ãµes
                                </b>
                                , localize o bloco do Meta Ads e insira o ID do seu Pixel (apenas nÃºmeros).
                            </p>
                        </div>
                    </section>
                </div>

                {/* Sticky Sidebar */}
                <div className="hidden lg:block">
                    <div className="sticky top-8 space-y-6">
                        <div className="p-6 rounded-3xl bg-white dark:bg-brand-900 border border-slate-100 dark:border-brand-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                            <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4">NavegaÃ§Ã£o</h4>
                            <nav className="space-y-4">
                                {[
                                    { id: 'auth',         label: '1. AutenticaÃ§Ã£o',   icon: Shield },
                                    { id: 'c2b',          label: `2. C2B Â· ${PHONE}`, icon: Smartphone },
                                    { id: 'balance',      label: '3. Saldo',          icon: Globe },
                                    { id: 'transactions', label: '4. TransaÃ§Ãµes',     icon: Server },
                                    { id: 'response',     label: '5. Resposta',       icon: FileCode },
                                    { id: 'meta-pixel',   label: '6. Meta Pixel',     icon: Target },
                                ].map((item) => (
                                    <a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        className="flex items-center gap-3 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-brand-400 dark:hover:text-white transition-all group"
                                    >
                                        <item.icon size={14} className="group-hover:scale-110 transition-transform" />
                                        {item.label}
                                    </a>
                                ))}
                            </nav>
                        </div>

                        {/* Language Switcher */}
                        <div className="p-5 rounded-3xl bg-white dark:bg-brand-900 border border-slate-100 dark:border-brand-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                            <h4 className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-3">Linguagem</h4>
                            <div className="flex flex-col gap-1.5">
                                {(Object.keys(LANG_LABELS) as Lang[]).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setActiveLang(lang)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                            activeLang === lang
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                                : 'text-slate-500 dark:text-brand-400 hover:bg-slate-50 dark:hover:bg-brand-800'
                                        }`}
                                    >
                                        {LANG_LABELS[lang]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Official Links */}
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white space-y-4 shadow-xl shadow-emerald-500/20">
                            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <ExternalLink size={20} />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-tight">Recursos Oficiais</h4>
                            <div className="space-y-2">
                                <a href={`${BASE}/docs`} target="_blank" rel="noreferrer" className="flex items-center justify-between text-[10px] font-bold bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-all">
                                    DocumentaÃ§Ã£o KwikPay <ExternalLink size={12} />
                                </a>
                                <a href={`${BASE}/admin`} target="_blank" rel="noreferrer" className="flex items-center justify-between text-[10px] font-bold bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-all">
                                    Painel Administrativo <ExternalLink size={12} />
                                </a>
                                <a href="https://mpesa.co.mz" target="_blank" rel="noreferrer" className="flex items-center justify-between text-[10px] font-bold bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-all">
                                    M-Pesa MoÃ§ambique <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

