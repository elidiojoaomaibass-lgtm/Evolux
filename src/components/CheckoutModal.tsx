import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ChevronDown, Check,
    ShieldCheck, 
    Loader2,
    AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import type { Product } from '../lib/store';
import { useTransactionsStore } from '../lib/store';
import { Logo } from './Logo';

interface CheckoutModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export const CheckoutModal = ({ product, isOpen, onClose }: CheckoutModalProps) => {
    const { addTransaction } = useTransactionsStore();
    const [method, setMethod] = useState<'mpesa' | 'emola'>('mpesa');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [paymentPhone, setPaymentPhone] = useState('');
    const [showSummary, setShowSummary] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStatus('idle');
                setErrorMessage(null);
                setName('');
                setPhone('');
                setEmail('');
                setPaymentPhone('');
                setMethod('mpesa');
            }, 500);
        }
    }, [isOpen]);

    if (!product) return null;

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setErrorMessage(null);

        if (!paymentPhone) {
            setErrorMessage('Por favor, introduza o número de telefone para pagamento.');
            return;
        }

        setStatus('processing');

        const reference = `ORD${Date.now()}`;
        
        try {
            // Pegar credenciais guardadas no localStorage
            const clientId = localStorage.getItem('evolux_e2_client_id');
            const clientSecret = localStorage.getItem('evolux_e2_client_secret');
            const walletMpesa = localStorage.getItem('evolux_e2_wallet_mpesa');
            const walletEmola = localStorage.getItem('evolux_e2_wallet_emola');

            if ((!clientId || !clientSecret) && import.meta.env.MODE !== 'development') {
                // Em produção ou caso o .env não esteja acessível ao cliente, se usarmos o env do Vercel, o backend tratará disso.
                // Mas alertaremos no console do frontend:
                console.log('Credenciais E2Payments não encontradas no localStorage. As variáveis de ambiente do backend (.env) serão usadas.');
            }

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

            // Verificar se a resposta é JSON antes de ler
            const contentType = response.headers.get("content-type");
            if (!response.ok) {
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    // Usar diretamente a mensagem amigável vinda do backend
                    throw new Error(errorData.error || errorData.message || 'Não foi possível processar o pagamento. Tente novamente.');
                } else {
                    const textError = await response.text();
                    console.error("Erro não-JSON recebido:", textError);
                    if (response.status === 404) {
                        throw new Error('Endpoint não encontrado (404). Se estiver em Localhost, certifique-se de que está a usar "vercel dev" em vez de "npm run dev".');
                    }
                    throw new Error(`Erro do Servidor (${response.status}). Verifique os logs do backend.`);
                }
            }

            const data = await response.json();
            
            // Registrar transação no store local
            addTransaction({
                id: data.transactionId || reference,
                type: 'payment',
                amount: product.price,
                phone: paymentPhone,
                method: method === 'mpesa' ? 'M-Pesa' : 'e-Mola',
                status: 'Pendente', // Começa como pendente até confirmação do PIN
                reference: reference,
                description: `Compra: ${product.name}`,
                customerName: name,
                customerEmail: email
            });

            setStatus('success');
            
            // Redirecionar para a página de obrigado com detalhes da compra
            const params = new URLSearchParams({
                name: name || '',
                email: email || '',
                product: product.name || '',
                amount: String(product.price),
                method: method === 'mpesa' ? 'M-Pesa' : 'e-Mola',
                reference: reference,
            });
            window.location.href = `/obrigado?${params.toString()}`;
            
            // Aqui podes disparar o Pixel de Meta Ads (Purchase)
            if ((window as any).fbq) {
                (window as any).fbq('track', 'Purchase', {
                    value: product.price,
                    currency: 'MZN',
                    content_name: product.name
                });
            }

        } catch (err: any) {
            // A mensagem já vem tratada do backend — mostrar diretamente
            setErrorMessage(err.message || 'Ocorreu um erro. Tente novamente.');
            setStatus('idle');

            // Registrar falha imediatamente no Supabase para contabilizar nos relatórios
            try {
                addTransaction({
                    id: `ERR${Date.now()}`,
                    type: 'payment',
                    amount: product.price,
                    phone: paymentPhone,
                    method: method === 'mpesa' ? 'M-Pesa' : 'e-Mola',
                    status: 'Falhou',
                    reference: reference,
                    description: `Compra: ${product.name} (Rejeitado/Erro: ${err.message || 'Erro'})`,
                    customerName: name || 'Cliente',
                    customerEmail: email || ''
                });
            } catch (dbErr) {
                console.error("Erro ao salvar falha de transação no Supabase:", dbErr);
            }
        }
    };

    if (status === 'success') {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-md bg-white rounded-3xl p-10 text-center shadow-2xl"
                        >
                            <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                                <Check size={40} strokeWidth={3} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Pedido Realizado!</h3>
                            <p className="text-sm text-slate-500 font-medium mb-8">
                                O seu acesso foi enviado para <b>{email || 'seu e-mail'}</b>. Verifique também a pasta de spam.
                            </p>
                            <button 
                                onClick={onClose}
                                className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                            >
                                Fechar
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 overflow-y-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="relative w-full max-w-[500px] bg-[#f8f9fa] md:rounded-[2rem] shadow-2xl overflow-hidden min-h-screen md:min-h-0 md:max-h-[95vh] flex flex-col"
                    >
                        {/* Branding Header */}
                        <div className="bg-white px-6 py-4 md:py-6 flex items-center justify-between z-30 shadow-sm">
                            <Logo size={28} showText={true} textColor="text-slate-900" />
                            <button 
                                onClick={onClose}
                                className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Order Progress (Optional) */}
                        <div className="w-full h-1 bg-slate-100 overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 0.8 }}
                                className="h-full bg-red-600"
                            />
                        </div>

                        {/* Header Summary (Sticky-ish) */}
                        <div className="bg-[#fcfcfc] border-y border-slate-100 p-4 flex items-center justify-between z-20">
                            <button 
                                onClick={() => setShowSummary(!showSummary)}
                                className="flex items-center gap-2 text-slate-600 text-[13px] font-medium hover:text-slate-900 transition-colors"
                            >
                                <ShoppingCartIcon />
                                <span>Resumo do pedido</span>
                                <ChevronDown size={14} className={cn("transition-transform duration-300", showSummary && "rotate-180")} />
                            </button>
                            <span className="text-slate-900 font-black text-sm">{product.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                        </div>

                        {/* Order Summary Collapsible */}
                        <AnimatePresence>
                            {showSummary && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-slate-50 border-b border-slate-100 overflow-hidden"
                                >
                                    <div className="p-6 space-y-4">
                                        <div className="flex gap-4">
                                            <div className="h-20 w-20 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-sm">
                                                <img src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&fit=crop"} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className="text-sm font-bold text-slate-900 leading-tight">{product.name}</p>
                                                    <span className="text-sm font-black text-slate-900 shrink-0">{product.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">{product.type}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{product.category}</span>
                                                </div>
                                                {product.description && (
                                                    <p className="text-xs text-slate-500 line-clamp-2 md:line-clamp-3 leading-relaxed pt-1 italic">
                                                        "{product.description}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form Body */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white shadow-inner">
                            {/* Client Info */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 items-center flex gap-3">
                                    Informações do Cliente
                                </h3>
                                
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Nome*</label>
                                        <input 
                                            type="text" 
                                            placeholder="Seu nome completo"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Telefone*</label>
                                        <div className="flex overflow-hidden">
                                            <div className="h-11 px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 flex items-center justify-center text-xs font-medium text-slate-600 gap-1.5 shrink-0">
                                                <span className="text-[10px] opacity-60 uppercase font-black">MZ</span> +258
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="84 xxx xxxx"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                                className="flex-1 h-11 px-4 rounded-r-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">E-mail (opcional)</label>
                                        <input 
                                            type="email" 
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Order Summary (Static) */}
                            <section className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900">Resumo do Pedido</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 shadow-sm shrink-0">
                                            <img src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&fit=crop"} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 flex-1 truncate">{product.name}</span>
                                        <span className="text-xs font-black text-slate-900">{product.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                                    </div>

                                    <div className="space-y-2 pt-4 border-t border-slate-100">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-medium">Subtotal</span>
                                            <span className="text-slate-600 font-bold">{product.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-bold text-slate-900">Total</span>
                                            <span className="text-base font-black text-slate-900">{product.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Payment Section */}
                            <section className="space-y-4 pt-4 border-t border-slate-100 pb-2">
                                <h3 className="text-lg font-bold text-slate-900">Pagamento</h3>
                                
                                <div className="space-y-3">
                                    {/* M-Pesa */}
                                    <div 
                                        onClick={() => setMethod('mpesa')}
                                        className={cn(
                                            "rounded-xl border transition-all cursor-pointer overflow-hidden",
                                            method === 'mpesa' ? "border-red-500 ring-1 ring-red-500 bg-red-50/10" : "border-slate-200 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        <div className="p-4 flex items-center gap-3">
                                            <div className={cn(
                                                "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                                                method === 'mpesa' ? "border-red-500" : "border-slate-300"
                                            )}>
                                                {method === 'mpesa' && <div className="h-2 w-2 rounded-full bg-red-500" />}
                                            </div>
                                            <div className="h-8 w-8 p-0.5 bg-white rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden">
                                                <img src="/mpesa_logo.png" alt="M-Pesa" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">M-Pesa</span>
                                        </div>

                                        <AnimatePresence>
                                            {method === 'mpesa' && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="px-4 pb-4 space-y-2"
                                                >
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Número de celular*</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="84 xxx xxxx"
                                                        value={paymentPhone}
                                                        onChange={(e) => setPaymentPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* e-Mola */}
                                    <div 
                                        onClick={() => setMethod('emola')}
                                        className={cn(
                                            "rounded-xl border transition-all cursor-pointer overflow-hidden",
                                            method === 'emola' ? "border-orange-500 ring-1 ring-orange-500 bg-orange-50/10" : "border-slate-200 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        <div className="p-4 flex items-center gap-3">
                                            <div className={cn(
                                                "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                                                method === 'emola' ? "border-orange-500" : "border-slate-300"
                                            )}>
                                                {method === 'emola' && <div className="h-2 w-2 rounded-full bg-orange-500" />}
                                            </div>
                                            <div className="h-8 w-8 p-0.5 bg-white rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden">
                                                <img src="/emola_logo.png" alt="e-Mola" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">e-Mola</span>
                                        </div>
                                        <AnimatePresence>
                                            {method === 'emola' && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="px-4 pb-4 space-y-2"
                                                >
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Número de celular*</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="87 xxx xxxx"
                                                        value={paymentPhone}
                                                        onChange={(e) => setPaymentPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {errorMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mx-6 mb-0 rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3"
                                >
                                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-red-700">Pagamento não processado</p>
                                        <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{errorMessage}</p>
                                    </div>
                                    <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Footer / Button Area */}
                        <div className="bg-white border-t border-slate-100 p-6 md:p-8 space-y-4">
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed text-center">
                                Os seus dados serão processados de acordo com a nossa <a href="#" className="underline text-red-500">política de privacidade</a>.
                            </p>

                            <button 
                                onClick={handlePurchase}
                                disabled={status === 'processing'}
                                className="w-full h-14 bg-[#e11d24] text-white rounded-xl font-black text-sm md:text-base flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-red-500/10 disabled:opacity-70"
                            >
                                {status === 'processing' ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Processando...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-5 w-5 rounded-full border-2 border-white flex items-center justify-center">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        <span>Comprar agora</span>
                                    </>
                                )}
                            </button>

                            <div className="flex flex-row items-center justify-center gap-4 opacity-70">
                                <div className="flex items-center gap-1.5 text-emerald-600">
                                    <ShieldCheck size={14} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Seguro</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-emerald-600">
                                    <Check size={14} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">100% Protegido</span>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Processing Overlay */}
                        <AnimatePresence>
                            {status === 'processing' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 z-50 bg-white/20 backdrop-blur-[2px] pointer-events-none"
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const ShoppingCartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.783 20.9391 21 20.4304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
