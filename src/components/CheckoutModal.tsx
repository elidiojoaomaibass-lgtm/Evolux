import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ShoppingCart, ShieldCheck, 
    Smartphone, CreditCard, ArrowRight,
    CheckCircle2, Loader2, Lock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import type { Product } from '../lib/store';

interface CheckoutModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export const CheckoutModal = ({ product, isOpen, onClose }: CheckoutModalProps) => {
    const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success'>('details');
    const [method, setMethod] = useState<'mpesa' | 'emola'>('mpesa');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal closes
            setTimeout(() => {
                setStep('details');
                setEmail('');
                setName('');
                setPhone('');
            }, 500);
        }
    }, [isOpen]);

    if (!product) return null;

    const handlePay = () => {
        setStep('processing');
        // Simulate payment processing
        setTimeout(() => {
            setStep('success');
        }, 3000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-[1000px] aspect-video md:aspect-auto md:h-[600px] bg-white dark:bg-[#0a0a0f] rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden border border-white/20 dark:border-white/5 flex flex-col md:flex-row"
                    >
                        {/* Left Side: Product Info (Desktop) */}
                        <div className="hidden md:flex flex-col w-[38%] bg-slate-50 dark:bg-brand-950/50 p-10 border-r border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-8">
                                <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center text-white">
                                    <ShoppingCart size={18} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-brand-400">Checkout Seguro</span>
                            </div>

                            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl mb-8 group">
                                <img 
                                    src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop"} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest leading-none">{product.category}</span>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mt-1">{product.name}</h2>
                                </div>
                                
                                <p className="text-xs text-slate-500 dark:text-brand-500 font-medium leading-relaxed line-clamp-3">
                                    {product.description || "Acesse agora este conteúdo exclusivo e transforme seus resultados com nossa metodologia testada."}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/5">
                                    <span className="text-sm font-bold text-slate-400">Valor Total</span>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-violet-600 dark:text-white tabular-nums tracking-tighter">
                                            {product.price.toLocaleString()} <span className="text-sm opacity-60">MZN</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                <ShieldCheck className="text-emerald-500" size={20} />
                                <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest leading-tight">
                                    Compra Protegida &<br />Ambiente Criptografado
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Form / Payment */}
                        <div className="flex-1 flex flex-col relative overflow-hidden h-full">
                            {/* Close Button */}
                            <button 
                                onClick={onClose}
                                className="absolute top-6 right-6 z-50 h-10 w-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white hover:rotate-90 transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                            >
                                <X size={20} />
                            </button>

                            {/* Main Content Area */}
                            <div className="flex-1 p-6 md:p-12 overflow-y-auto scrollbar-hide">
                                <AnimatePresence mode="wait">
                                    {step === 'details' && (
                                        <motion.div
                                            key="details"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                            <div className="space-y-2">
                                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Informações do <span className="text-gradient">Cliente</span> 👤</h3>
                                                <p className="text-xs md:text-sm text-slate-400 font-medium">Preencha seus dados para receber o acesso.</p>
                                            </div>

                                            <div className="space-y-5">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                                    <input 
                                                        type="text" 
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        placeholder="João Maria Pedro"
                                                        className="w-full h-14 px-6 rounded-2xl bg-slate-100 dark:bg-white/5 border border-transparent focus:border-violet-500/50 focus:bg-white dark:focus:bg-[#11111a] text-sm font-bold text-slate-900 dark:text-white transition-all outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                                                    <input 
                                                        type="email" 
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder="seu@email.com"
                                                        className="w-full h-14 px-6 rounded-2xl bg-slate-100 dark:bg-white/5 border border-transparent focus:border-violet-500/50 focus:bg-white dark:focus:bg-[#11111a] text-sm font-bold text-slate-900 dark:text-white transition-all outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Celular (WhatsApp)</label>
                                                    <div className="flex gap-2">
                                                        <div className="h-14 px-4 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-xs font-black text-slate-400">+258</div>
                                                        <input 
                                                            type="text" 
                                                            value={phone}
                                                            onChange={(e) => setPhone(e.target.value)}
                                                            placeholder="84 000 0000"
                                                            className="flex-1 h-14 px-6 rounded-2xl bg-slate-100 dark:bg-white/5 border border-transparent focus:border-violet-500/50 focus:bg-white dark:focus:bg-[#11111a] text-sm font-bold text-slate-900 dark:text-white transition-all outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => setStep('payment')}
                                                className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 group hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                                            >
                                                Próximo Passo
                                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </motion.div>
                                    )}

                                    {step === 'payment' && (
                                        <motion.div
                                            key="payment"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                            <div className="space-y-2">
                                                <button onClick={() => setStep('details')} className="text-[9px] font-black text-violet-500 uppercase tracking-[0.2em] hover:text-violet-400">← Voltar para dados</button>
                                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Método de <span className="text-gradient">Pagamento</span> 💳</h3>
                                                <p className="text-xs md:text-sm text-slate-400 font-medium">O pagamento é processado instantaneamente.</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <button 
                                                    onClick={() => setMethod('mpesa')}
                                                    className={cn(
                                                        "p-6 rounded-3xl border-2 transition-all flex flex-col gap-4 text-left group",
                                                        method === 'mpesa' ? "border-red-500 bg-red-500/5 shadow-[0_10px_40px_-5px_rgba(239,68,68,0.2)]" : "border-slate-100 dark:border-white/5 hover:border-red-500/30"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                                        method === 'mpesa' ? "bg-red-500 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-400"
                                                    )}>
                                                        <Smartphone size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pagar via</p>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white">M-Pesa</p>
                                                    </div>
                                                </button>

                                                <button 
                                                    onClick={() => setMethod('emola')}
                                                    className={cn(
                                                        "p-6 rounded-3xl border-2 transition-all flex flex-col gap-4 text-left group",
                                                        method === 'emola' ? "border-orange-500 bg-orange-500/5 shadow-[0_10px_40px_-5px_rgba(249,115,22,0.2)]" : "border-slate-100 dark:border-white/5 hover:border-orange-500/30"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                                        method === 'emola' ? "bg-orange-500 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-400"
                                                    )}>
                                                        <Smartphone size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pagar via</p>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white">e-Mola</p>
                                                    </div>
                                                </button>
                                            </div>

                                            <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Lock size={14} className="text-indigo-400" />
                                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Instruções</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-brand-400 font-medium leading-relaxed">
                                                    Após clicar em finalizar, você receberá um prompt em seu celular {phone || '(DDD) +258'} para confirmar a transação com seu PIN secreto.
                                                </p>
                                            </div>

                                            <button 
                                                onClick={handlePay}
                                                className="w-full h-16 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(139,92,246,0.5)]"
                                            >
                                                Finalizar Pagamento
                                                <ArrowRight size={18} />
                                            </button>
                                        </motion.div>
                                    )}

                                    {step === 'processing' && (
                                        <motion.div
                                            key="processing"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20"
                                        >
                                            <div className="relative">
                                                <div className="h-24 w-24 rounded-full border-4 border-violet-600/20 border-t-violet-600 animate-spin" />
                                                <Loader2 className="absolute inset-0 m-auto text-violet-600 animate-pulse" size={32} />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Processando...</h3>
                                                <p className="text-xs text-slate-400 font-medium max-w-xs">Aguardando confirmação do {method === 'mpesa' ? 'M-Pesa' : 'e-Mola'} no seu celular.</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 'success' && (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12"
                                        >
                                            <motion.div 
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", damping: 10, stiffness: 100 }}
                                                className="h-24 w-24 rounded-full bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] flex items-center justify-center text-white"
                                            >
                                                <CheckCircle2 size={48} />
                                            </motion.div>
                                            <div className="space-y-2 hover:scale-105 transition-transform duration-500">
                                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Pagamento <span className="text-emerald-500 italic">Concluido!</span> 🎉</h3>
                                                <p className="text-sm text-slate-400 font-medium max-w-sm">O link de acesso ao seu produto foi enviado para <b>{email}</b> e via WhatsApp.</p>
                                            </div>
                                            
                                            <div className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col gap-3">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                    <span>Protocolo:</span>
                                                    <span className="text-slate-900 dark:text-white">#TRX-{Math.floor(Math.random() * 900000 + 100000)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                    <span>Produto:</span>
                                                    <span className="text-slate-900 dark:text-white truncate max-w-[150px]">{product.name}</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={onClose}
                                                className="px-10 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all"
                                            >
                                                Voltar ao Inicio
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer: Secure Badges */}
                            <div className="p-8 border-t border-slate-50 dark:border-white/5 flex items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded bg-slate-200 dark:bg-white/10" />
                                    <span className="text-[9px] font-black text-slate-400 dark:text-white uppercase tracking-widest">PCI Compliance</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded bg-slate-200 dark:bg-white/10" />
                                    <span className="text-[9px] font-black text-slate-400 dark:text-white uppercase tracking-widest">SSL Secure</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
