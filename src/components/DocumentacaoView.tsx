import { 
    Terminal, 
    Copy, Check, ExternalLink, Shield, 
    Smartphone, Zap, Server, Key
} from 'lucide-react';
import { useState } from 'react';

export const DocumentacaoView = () => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const codeSnippets = {
        token: `// 1. Gerar Token de Acesso
axios.post('https://e2payments.explicador.co.mz/oauth/token', {
  grant_type: 'client_credentials',
  client_id: 'SUA_CLIENT_ID',
  client_secret: 'SUA_CLIENT_SECRET'
}).then(response => {
  const token = response.data.access_token;
  console.log('Bearer ' + token);
});`,
        c2b: `// 2. Realizar Pagamento C2B (M-Pesa)
const wallet_id = 'SUA_CARTEIRA_ID'; // ID da carteira no painel e2Payments
const url = \`https://e2payments.explicador.co.mz/v1/c2b/mpesa-payment/\${wallet_id}\`;

const payload = {
  client_id: 'SUA_CLIENT_ID',
  amount: 100,             // Valor em MZN
  phone: "841234567",      // Número do cliente (9 dígitos)
  reference: "Pagamento01" // Sem espaços
};

const headers = {
  'Authorization': 'Bearer ' + access_token,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

axios.post(url, payload, { headers });`,
        webhook: `// Exemplo de resposta de sucesso (Status 200)
{
  "status": "success",
  "message": "Transaction initiated successfully",
  "transaction_id": "e2p_abc123...",
  "reference": "Pagamento01"
}`
    };

    return (
        <div className="px-4 md:px-8 pt-2 md:pt-4 pb-20 space-y-8 md:space-y-12 max-w-5xl mx-auto w-full">
            {/* Header */}
            <header className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Zap size={22} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Oficial e2Payments Docs</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    Integração <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">e2Payments</span>
                </h1>
                <p className="text-sm md:text-base text-slate-500 dark:text-brand-400 font-medium max-w-2xl">
                    Documentação oficial para integração de pagamentos M-Pesa e e-Mola via gateway <b className="text-slate-900 dark:text-white">e2Payments (Explicador Inc)</b>.
                </p>
            </header>

            {/* API Credentials Alert */}
            <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
                    <Key size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight mb-1">Onde encontrar suas chaves?</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                        Acesse o painel em <a href="https://mpesaemolatech.com/admin/credentials" target="_blank" className="underline font-bold">mpesaemolatech.com/admin/credentials</a> para obter seu <b>Client ID</b> e <b>Client Secret</b>. 
                        O <b>ID da Carteira (Wallet ID)</b> pode ser encontrado na seção de <a href="https://mpesaemolatech.com/admin/mpesa" target="_blank" className="underline font-bold">Carteiras</a>.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    
                    {/* Step-by-Step Integration */}
                    <div className="space-y-6">
                        <div className="p-5 md:p-8 rounded-2xl md:rounded-3xl bg-slate-50 dark:bg-brand-950 border border-slate-100 dark:border-brand-800">
                            <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">1</span>
                                Obter Wallet ID
                            </h4>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-brand-400 leading-relaxed mb-4 italic">
                                O erro mais comum é usar o número de telefone. Você deve usar o <b>ID Numérico</b> da sua carteira.
                            </p>
                            <ol className="text-[11px] md:text-xs text-slate-600 dark:text-brand-300 space-y-2 list-decimal list-inside mb-4">
                                <li>Aceda ao seu painel em <a href="https://mpesaemolatech.com/admin/mpesa" target="_blank" className="text-violet-600 underline font-bold">mpesaemolatech.com/admin/mpesa</a>.</li>
                                <li>Na lista de carteiras, procure a coluna <b>ID</b>.</li>
                                <li>Copie esse número (Ex: 12345) e cole nas suas configurações.</li>
                            </ol>
                        </div>

                        <div className="p-5 md:p-8 rounded-2xl md:rounded-3xl bg-slate-50 dark:bg-brand-950 border border-slate-100 dark:border-brand-800">
                            <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">2</span>
                                Autenticação (OAuth2)
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-brand-300 font-medium">
                                Todas as requisições (exceto a de token) exigem um <b>Bearer Token</b> no cabeçalho. O token tem validade estendida, mas recomendamos renovar conforme necessário.
                            </p>
                        </div>

                        <div className="relative group">
                            <div className="absolute top-4 right-4 z-20">
                                <button 
                                    onClick={() => copyToClipboard(codeSnippets.token, 'token')}
                                    className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white/50 hover:text-white transition-colors border border-white/10"
                                >
                                    {copiedId === 'token' ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                            <pre className="p-6 rounded-3xl bg-slate-950 text-slate-300 overflow-x-auto text-[11px] md:text-xs font-mono leading-relaxed border border-white/5 shadow-2xl">
                                {codeSnippets.token}
                            </pre>
                        </div>
                    </section>

                    {/* C2B Section */}
                    <section id="c2b" className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Terminal className="text-emerald-500" size={20} />
                                2. Pagamento C2B (M-Pesa)
                            </h2>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded uppercase">POST</span>
                                <code className="text-[11px] font-bold text-slate-500 dark:text-brand-400 bg-slate-100 dark:bg-brand-800 px-2 py-0.5 rounded">/v1/c2b/mpesa-payment/{"{wallet_id}"}</code>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute top-4 right-4 z-20">
                                <button 
                                    onClick={() => copyToClipboard(codeSnippets.c2b, 'c2b')}
                                    className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white/50 hover:text-white transition-colors border border-white/10"
                                >
                                    {copiedId === 'c2b' ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                            <pre className="p-6 rounded-3xl bg-slate-950 text-slate-300 overflow-x-auto text-[11px] md:text-xs font-mono leading-relaxed border border-white/5 shadow-2xl">
                                {codeSnippets.c2b}
                            </pre>
                        </div>

                        <div className="rounded-2xl border border-slate-100 dark:border-brand-800 overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-brand-950 border-b border-slate-100 dark:border-brand-800">
                                    <tr>
                                        <th className="px-4 py-3 font-black text-slate-900 dark:text-white uppercase tracking-wider">Campo</th>
                                        <th className="px-4 py-3 font-black text-slate-900 dark:text-white uppercase tracking-wider">Descrição</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-brand-800 dark:bg-brand-900">
                                    {[
                                        { name: "amount", desc: "Valor da transação (MZN). Ex: 50" },
                                        { name: "phone", desc: "Número Vodacom de 9 dígitos (Ex: 841234567)" },
                                        { name: "reference", desc: "Identificador sem espaços (Ex: Pedido123)" },
                                        { name: "client_id", desc: "Seu Client ID público" },
                                    ].map((param, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{param.name}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-brand-300 font-medium">{param.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Endpoints List */}
                    <section id="endpoints" className="space-y-4">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Server className="text-violet-500" size={20} />
                            Outros Endpoints
                        </h2>
                        <div className="space-y-3">
                            {[
                                { method: "POST", path: "/v1/wallets/mpesa/get/all", desc: "Listar todas as carteiras" },
                                { method: "POST", path: "/v1/payments/mpesa/get/all", desc: "Histórico total de pagamentos" },
                                { method: "POST", path: "/v1/payments/mpesa/get/all/paginate/10", desc: "Histórico paginado" },
                            ].map((ep, i) => (
                                <div key={i} className="p-4 rounded-2xl bg-white dark:bg-brand-900 border border-slate-100 dark:border-brand-800 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-brand-800 text-slate-500 text-[9px] font-black rounded uppercase">{ep.method}</span>
                                        <code className="text-[10px] font-bold text-slate-700 dark:text-brand-200">{ep.path}</code>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-violet-500 transition-colors">{ep.desc}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sticky Sidebar */}
                <div className="hidden lg:block">
                    <div className="sticky top-8 space-y-6">
                        <div className="p-6 rounded-3xl bg-white dark:bg-brand-900 border border-slate-100 dark:border-brand-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                            <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4">Navegação</h4>
                            <nav className="space-y-4">
                                {[
                                    { id: "auth", label: "1. Autenticação", icon: Shield },
                                    { id: "c2b", label: "2. Pagamento C2B", icon: Smartphone },
                                    { id: "endpoints", label: "3. Endpoints", icon: Server },
                                ].map((item) => (
                                    <a 
                                        key={item.id}
                                        href={`#\${item.id}`}
                                        className="flex items-center gap-3 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-brand-400 dark:hover:text-white transition-all group"
                                    >
                                        <item.icon size={14} className="group-hover:scale-110 transition-transform" />
                                        {item.label}
                                    </a>
                                ))}
                            </nav>
                        </div>

                        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white space-y-4 shadow-xl shadow-emerald-500/20">
                            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <ExternalLink size={20} />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-tight">Recursos Oficiais</h4>
                            <div className="space-y-2">
                                <a href="https://mpesaemolatech.com/docs" target="_blank" className="flex items-center justify-between text-[10px] font-bold bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-all">
                                    Documentação Completa
                                    <ExternalLink size={12} />
                                </a>
                                <a href="https://mpesaemolatech.com/admin" target="_blank" className="flex items-center justify-between text-[10px] font-bold bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-all">
                                    Painel Administrativo
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
