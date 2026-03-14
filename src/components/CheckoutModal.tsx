import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ChevronDown, Check,
    Smartphone, ShieldCheck, 
    Lock, Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import type { Product } from '../lib/store';
import { Logo } from './Logo';

interface CheckoutModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export const CheckoutModal = ({ product, isOpen, onClose }: CheckoutModalProps) => {
    const [method, setMethod] = useState<'mpesa' | 'emola'>('mpesa');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [paymentPhone, setPaymentPhone] = useState('');
    const [showSummary, setShowSummary] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStatus('idle');
                setName('');
                setPhone('');
                setEmail('');
                setPaymentPhone('');
                setMethod('mpesa');
            }, 500);
        }
    }, [isOpen]);

    if (!product) return null;

    const handlePurchase = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('processing');
        // Simulate payment wait
        setTimeout(() => {
            setStatus('success');
        }, 3000);
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
                        className="relative w-full max-w-[600px] bg-[#f8f9fa] md:rounded-3xl shadow-2xl overflow-hidden min-h-screen md:min-h-0 flex flex-col"
                    >
                        {/* Branding Header */}
                        <div className="bg-white px-8 py-8 md:py-10 flex items-center justify-between z-30 shadow-sm">
                            <Logo size={32} showText={true} textColor="text-slate-900" />
                            <button 
                                onClick={onClose}
                                className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-100 shadow-sm"
                            >
                                <X size={20} />
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
                                className="flex items-center gap-2 text-slate-600 text-sm font-medium hover:text-slate-900 transition-colors"
                            >
                                <ShoppingCartIcon />
                                <span>Mostrar resumo do pedido</span>
                                <ChevronDown size={16} className={cn("transition-transform duration-300", showSummary && "rotate-180")} />
                            </button>
                            <span className="text-slate-900 font-black text-base">{product.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                        </div>

                        {/* Order Summary Collapsible */}
                        <AnimatePresence>
                            {showSummary && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-white border-b border-slate-100 overflow-hidden"
                                >
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                                                <img src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&fit=crop"} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-900 line-clamp-1">{product.name}</p>
                                                <p className="text-xs text-slate-400 font-medium">{product.category}</p>
                                            </div>
                                            <span className="text-sm font-black text-slate-900">{product.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form Body */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 bg-white shadow-inner">
                            {/* Client Info */}
                            <section className="space-y-6">
                                <h3 className="text-xl font-bold text-slate-900 items-center flex gap-3">
                                    Informações do Cliente
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Nome*</label>
                                        <input 
                                            type="text" 
                                            placeholder="Seu nome completo"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Telefone*</label>
                                        <div className="flex overflow-hidden">
                                            <div className="h-12 px-4 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 flex items-center justify-center text-sm font-medium text-slate-600 gap-2 shrink-0">
                                                <span className="text-xs opacity-60">MZ</span> +258
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="84 xxx xxxx"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                                className="flex-1 h-12 px-4 rounded-r-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">E-mail (opcional)</label>
                                        <input 
                                            type="email" 
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Order Summary (Static) */}
                            <section className="space-y-6 pt-4 border-t border-slate-100">
                                <h3 className="text-xl font-bold text-slate-900">Resumo do Pedido</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm shrink-0">
                                            <img src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&fit=crop"} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600 flex-1">{product.name}</span>
                                        <span className="text-sm font-black text-slate-900">{product.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                                    </div>

                                    <div className="space-y-3 pt-6 border-t border-slate-100">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400 font-medium">Subtotal</span>
                                            <span className="text-slate-600 font-bold">{product.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-slate-900">Total</span>
                                            <span className="text-lg font-black text-slate-900">{product.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Payment Section */}
                            <section className="space-y-6 pt-4 border-t border-slate-100 pb-10">
                                <h3 className="text-xl font-bold text-slate-900">Pagamento</h3>
                                
                                <div className="space-y-4">
                                    {/* M-Pesa */}
                                    <div 
                                        onClick={() => setMethod('mpesa')}
                                        className={cn(
                                            "rounded-2xl border transition-all cursor-pointer overflow-hidden",
                                            method === 'mpesa' ? "border-red-500 ring-1 ring-red-500 bg-red-50/10" : "border-slate-200 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        <div className="p-5 flex items-center gap-4">
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                method === 'mpesa' ? "border-red-500" : "border-slate-300"
                                            )}>
                                                {method === 'mpesa' && <div className="h-2.5 w-2.5 rounded-full bg-red-500" />}
                                            </div>
                                            <div className="h-10 w-10 p-1 bg-white rounded-lg border border-slate-100 flex items-center justify-center shadow-sm">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/M-pesa_logo.png" alt="M-Pesa" className="h-full object-contain" />
                                            </div>
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">M-Pesa</span>
                                        </div>

                                        <AnimatePresence>
                                            {method === 'mpesa' && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="px-5 pb-5 space-y-3"
                                                >
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">Número de celular*</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="84 xxx xxxx"
                                                        value={paymentPhone}
                                                        onChange={(e) => setPaymentPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-300"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* e-Mola */}
                                    <div 
                                        onClick={() => setMethod('emola')}
                                        className={cn(
                                            "rounded-2xl border transition-all cursor-pointer overflow-hidden",
                                            method === 'emola' ? "border-orange-500 ring-1 ring-orange-500 bg-orange-50/10" : "border-slate-200 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        <div className="p-5 flex items-center gap-4">
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                method === 'emola' ? "border-orange-500" : "border-slate-300"
                                            )}>
                                                {method === 'emola' && <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />}
                                            </div>
                                            <div className="h-10 w-10 p-1 bg-white rounded-lg border border-slate-100 flex items-center justify-center shadow-sm">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/E-mola_logo.png/640px-E-mola_logo.png" alt="e-Mola" className="h-full object-contain" />
                                            </div>
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">e-Mola</span>
                                        </div>
                                        <AnimatePresence>
                                            {method === 'emola' && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="px-5 pb-5 space-y-3"
                                                >
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">Número de celular*</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="87 xxx xxxx"
                                                        value={paymentPhone}
                                                        onChange={(e) => setPaymentPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer / Button Area */}
                        <div className="bg-white border-t border-slate-100 p-6 md:p-10 space-y-6">
                            <p className="text-[10px] md:text-xs text-slate-400 font-medium leading-relaxed">
                                Os seus dados pessoais serão utilizados para processar a sua compra, apoiar a sua experiência em todo este site e para outros fins descritos na nossa <a href="#" className="underline text-red-500">política de privacidade</a>.
                            </p>

                            <button 
                                onClick={handlePurchase}
                                disabled={status === 'processing'}
                                className="w-full h-16 bg-[#e11d24] text-white rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-red-500/10 disabled:opacity-70"
                            >
                                {status === 'processing' ? (
                                    <>
                                        <Loader2 className="animate-spin" size={24} />
                                        <span>Processando...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                        <span>Comprar agora</span>
                                    </>
                                )}
                            </button>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 opacity-60">
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <ShieldCheck size={16} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Segurança ao nível do banco de bits</span>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <Check size={16} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">100% Pagamentos Seguros</span>
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
