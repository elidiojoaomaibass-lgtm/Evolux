import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Check,
    ShieldCheck, 
    Loader2,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { useTransactionsStore } from '../lib/store';
import { Logo } from './Logo';

export const CheckoutPage = () => {
    const { addTransaction } = useTransactionsStore();
    const [method, setMethod] = useState<'mpesa' | 'emola'>('mpesa');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [paymentPhone, setPaymentPhone] = useState('');

    // Parse product info from URL
    const searchParams = new URLSearchParams(window.location.search);
    const product = {
        id: searchParams.get('id') || 'PRD-MOCK',
        name: searchParams.get('name') || 'Produto sem Nome',
        price: Number(searchParams.get('price')) || 0,
        type: searchParams.get('type') || 'Digital',
        category: searchParams.get('category') || 'Outro',
        image: searchParams.get('image') || '',
        description: searchParams.get('description') || ''
    };

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!name) {
            setErrorMessage('Por favor, introduza o seu nome.');
            return;
        }
        if (!phone) {
            setErrorMessage('Por favor, introduza o seu número de contacto.');
            return;
        }
        if (!paymentPhone) {
            setErrorMessage('Por favor, introduza o número de telemóvel para o pagamento.');
            return;
        }

        setStatus('processing');

        try {
            // Check credentials from URL or localStorage
            const clientId = localStorage.getItem('evolux_e2_client_id');
            const clientSecret = localStorage.getItem('evolux_e2_client_secret');
            const walletMpesa = localStorage.getItem('evolux_e2_wallet_mpesa');
            const walletEmola = localStorage.getItem('evolux_e2_wallet_emola');

            const reference = `ORD${Date.now()}`;

            const response = await fetch('/api/e2payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: paymentPhone,
                    amount: product.price,
                    reference: reference,
                    client_id: (clientId || '').trim(),
                    client_secret: (clientSecret || '').trim(),
                    wallet_mpesa: (walletMpesa || '').trim(),
                    wallet_emola: (walletEmola || '').trim()
                })
            });

            // Handle API responses
            const contentType = response.headers.get("content-type");
            if (!response.ok) {
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || errorData.message || 'Erro ao processar pagamento.');
                } else {
                    const textError = await response.text();
                    console.error("Erro não-JSON recebido:", textError);
                    throw new Error('Não foi possível concluir o pagamento. Verifique os logs.');
                }
            }

            const data = await response.json();

            // Register transaction locally
            addTransaction({
                id: data.transactionId || reference,
                type: 'payment',
                amount: product.price,
                phone: paymentPhone,
                method: method === 'mpesa' ? 'M-Pesa' : 'e-Mola',
                status: 'Pendente',
                reference: reference,
                description: `Compra: ${product.name}`,
                customerName: name,
                customerEmail: email
            });

            setStatus('success');

            // Redirect to Thank You page
            const params = new URLSearchParams({
                name: name || '',
                email: email || '',
                product: product.name || '',
                amount: String(product.price),
                method: method === 'mpesa' ? 'M-Pesa' : 'e-Mola',
                reference: reference,
            });
            window.location.href = `/obrigado?${params.toString()}`;

        } catch (err: any) {
            setErrorMessage(err.message || 'Ocorreu um erro ao processar a compra. Tente novamente.');
            setStatus('idle');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Logo size={28} showText={true} textColor="text-slate-900" />
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] uppercase tracking-wider">Pagamento 100% Seguro</span>
                    </div>
                </div>
            </header>

            {/* Centered Single-Column Container */}
            <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:p-8">
                
                {/* Unified Form and Card */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-8">
                    
                    {/* Header Info */}
                    <div className="space-y-2 text-center pb-4 border-b border-slate-100">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Finalizar Compra 🚀</h2>
                        <p className="text-xs text-slate-400 font-semibold tracking-tight">Preencha os seus dados de facturação e pagamento para obter o acesso.</p>
                    </div>

                    <form onSubmit={handlePurchase} className="space-y-8">
                        
                        {/* Section 1: Customer Details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">1</span>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Dados Pessoais</h3>
                            </div>
                            
                            <div className="space-y-3.5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Nome Completo*</label>
                                    <input 
                                        type="text" 
                                        placeholder="Introduza o seu nome completo"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Contacto WhatsApp*</label>
                                        <div className="flex overflow-hidden">
                                            <div className="h-12 px-3.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-600 gap-1.5 shrink-0">
                                                <span className="text-[9px] opacity-60 uppercase font-black">MZ</span> +258
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="84 xxx xxxx"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                                className="flex-1 h-12 px-4 rounded-r-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">E-mail (opcional)</label>
                                        <input 
                                            type="email" 
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Resumo do Produto (PLACED IN THE MIDDLE) */}
                        <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">2</span>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Resumo da Encomenda</h3>
                            </div>

                            {/* Image and Basic Info */}
                            <div className="flex gap-4 pt-2">
                                <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-250 shrink-0 shadow-sm">
                                    <img 
                                        src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&fit=crop"} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="text-sm font-bold text-slate-950 leading-tight line-clamp-2">{product.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-slate-200 text-slate-650 rounded text-[9px] font-black uppercase tracking-wider">{product.type}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{product.category}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {product.description && (
                                <p className="text-xs text-slate-500 leading-relaxed pt-2 italic">
                                    "{product.description}"
                                </p>
                            )}

                            {/* Money Totals */}
                            <div className="space-y-2 pt-3 border-t border-slate-200">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold">Subtotal</span>
                                    <span className="text-slate-600 font-black">{product.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold">Taxas / IVA</span>
                                    <span className="text-emerald-500 font-black">0,00 MT</span>
                                </div>
                                <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                                    <span className="text-sm font-black text-slate-900">Total a pagar</span>
                                    <span className="text-base font-black text-slate-900 tabular-nums">{product.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Payment Provider */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">3</span>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Método de Pagamento</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* M-Pesa Option */}
                                <div 
                                    onClick={() => {
                                        setMethod('mpesa');
                                        setPaymentPhone('');
                                    }}
                                    className={cn(
                                        "rounded-2xl border-2 p-4 flex flex-col justify-between gap-4 cursor-pointer transition-all relative overflow-hidden",
                                        method === 'mpesa' ? "border-red-500 bg-red-50/5 shadow-md shadow-red-500/5" : "border-slate-100 hover:border-slate-200 bg-white"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="h-10 w-10 p-1 bg-white rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                            <img src="/mpesa_logo.png" alt="M-Pesa" className="w-full h-full object-cover" />
                                        </div>
                                        <div className={cn(
                                            "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                                            method === 'mpesa' ? "border-red-500" : "border-slate-300"
                                        )}>
                                            {method === 'mpesa' && <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-scale" />}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider">M-Pesa Vodafone</h4>
                                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Pagamento rápido via Push USSD.</p>
                                    </div>
                                </div>

                                {/* e-Mola Option */}
                                <div 
                                    onClick={() => {
                                        setMethod('emola');
                                        setPaymentPhone('');
                                    }}
                                    className={cn(
                                        "rounded-2xl border-2 p-4 flex flex-col justify-between gap-4 cursor-pointer transition-all relative overflow-hidden",
                                        method === 'emola' ? "border-orange-500 bg-orange-50/5 shadow-md shadow-orange-500/5" : "border-slate-100 hover:border-slate-200 bg-white"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="h-10 w-10 p-1 bg-white rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                            <img src="/emola_logo.png" alt="e-Mola" className="w-full h-full object-cover" />
                                        </div>
                                        <div className={cn(
                                            "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                                            method === 'emola' ? "border-orange-500" : "border-slate-300"
                                        )}>
                                            {method === 'emola' && <div className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-scale" />}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider">e-Mola Movitel</h4>
                                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Prompt imediato no seu telemóvel.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment phone input fields based on payment provider choice */}
                            <motion.div 
                                layout
                                className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 space-y-2 mt-4"
                            >
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none block">
                                    Número da Carteira {method === 'mpesa' ? 'M-Pesa' : 'e-Mola'}*
                                </label>
                                <div className="flex overflow-hidden">
                                    <div className="h-12 px-3.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-600 gap-1.5 shrink-0">
                                        <span className="text-[9px] opacity-60 uppercase font-black">MZ</span> +258
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder={method === 'mpesa' ? "84 xxx xxxx" : "86 xxx xxxx / 87 xxx xxxx"}
                                        value={paymentPhone}
                                        onChange={(e) => setPaymentPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                        className="flex-1 h-12 px-4 rounded-r-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                                        required
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium block">Após clicar em "Comprar agora", introduza o seu PIN de segurança no telemóvel quando solicitado.</span>
                            </motion.div>
                        </div>

                        {/* Error Displays inside checkout form */}
                        <AnimatePresence>
                            {errorMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3"
                                >
                                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-red-700">Pagamento não processado</p>
                                        <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{errorMessage}</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setErrorMessage(null)} 
                                        className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                                    >
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Button Purchase CTA */}
                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={status === 'processing'}
                                className={cn(
                                    "w-full h-14 bg-[#e11d24] text-white rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-red-500/10 disabled:opacity-70 cursor-pointer"
                                )}
                            >
                                {status === 'processing' ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span className="uppercase tracking-[0.1em]">Processando...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-5 w-5 rounded-full border-2 border-white flex items-center justify-center">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        <span className="uppercase tracking-[0.1em]">Comprar agora</span>
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed text-center max-w-md mx-auto">
                                Clicando acima, aceita os nossos Termos de Compra. Seus dados estão 100% protegidos.
                            </p>
                        </div>
                    </form>

                    {/* Features Badges */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-center items-center gap-4 text-slate-500 text-[11px] font-semibold">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                            <span>Acesso imediato no telemóvel/email</span>
                        </div>
                        <div className="hidden sm:block text-slate-350">•</div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                            <span>Ambiente de segurança garantido</span>
                        </div>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-6 px-6 mt-auto">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] text-slate-400 font-medium">
                        © {new Date().getFullYear()} InfroPay. Todos os direitos reservados.
                    </p>
                    <div className="flex gap-4 items-center opacity-60">
                        <ShieldCheck size={16} className="text-slate-400" />
                        <span className="text-[9px] uppercase tracking-widest font-black text-slate-400">Segurança SSL</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};
