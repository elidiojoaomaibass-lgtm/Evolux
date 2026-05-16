import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeft, ShoppingBag } from 'lucide-react';

export const ThankYouPage = () => {
    const [details, setDetails] = useState<{
        name?: string;
        email?: string;
        product?: string;
        amount?: string;
        method?: string;
        reference?: string;
    }>({});

    useEffect(() => {
        // Ler parâmetros da URL
        const params = new URLSearchParams(window.location.search);
        setDetails({
            name: params.get('name') || '',
            email: params.get('email') || '',
            product: params.get('product') || '',
            amount: params.get('amount') || '',
            method: params.get('method') || '',
            reference: params.get('reference') || '',
        });

        // Confetti leve com emojis animados
        const emojis = ['🎉', '✅', '🙏', '💚', '⭐'];
        const container = document.getElementById('confetti-container');
        if (container) {
            for (let i = 0; i < 18; i++) {
                const el = document.createElement('div');
                el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
                el.style.cssText = `
                    position: absolute;
                    font-size: ${Math.random() * 20 + 14}px;
                    left: ${Math.random() * 100}%;
                    top: -30px;
                    animation: fall ${Math.random() * 3 + 2}s ease-in ${Math.random() * 2}s forwards;
                    opacity: 0;
                `;
                container.appendChild(el);
            }
        }
    }, []);

    const handleBack = () => {
        // Voltar para a loja (remover /obrigado da URL)
        window.location.href = window.location.origin;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Confetti container */}
            <div id="confetti-container" className="fixed inset-0 pointer-events-none z-0" />

            {/* Animated background circles */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-400/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-emerald-100 p-8 md:p-12 max-w-md w-full text-center border border-emerald-50"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 12 }}
                    className="flex items-center justify-center mb-6"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl scale-150" />
                        <CheckCircle2 size={80} className="text-emerald-500 relative" strokeWidth={1.5} />
                    </div>
                </motion.div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h1 className="text-3xl font-black text-slate-900 mb-2">
                        Pagamento Confirmado!
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6">
                        O seu pagamento foi processado com sucesso. Obrigado pela sua compra!
                    </p>
                </motion.div>

                {/* Order Details */}
                {(details.product || details.amount || details.reference) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-slate-50 rounded-2xl p-5 mb-6 text-left space-y-3 border border-slate-100"
                    >
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detalhes do Pedido</p>

                        {details.product && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-medium">Produto</span>
                                <span className="text-xs font-bold text-slate-800 max-w-[60%] text-right truncate">{details.product}</span>
                            </div>
                        )}
                        {details.amount && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-medium">Valor pago</span>
                                <span className="text-sm font-black text-emerald-600">{Number(details.amount).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</span>
                            </div>
                        )}
                        {details.method && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-medium">Método</span>
                                <span className="text-xs font-bold text-slate-800">{details.method}</span>
                            </div>
                        )}
                        {details.reference && (
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                <span className="text-xs text-slate-400 font-medium">Referência</span>
                                <span className="text-[10px] font-mono text-slate-400">{details.reference}</span>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Email notice */}
                {details.email && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-xs text-slate-400 mb-6"
                    >
                        📧 Uma confirmação foi enviada para <strong className="text-slate-600">{details.email}</strong>
                    </motion.p>
                )}

                {/* CTA Button */}
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    onClick={handleBack}
                    className="w-full h-13 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 py-4"
                >
                    <ShoppingBag size={18} />
                    Continuar a Comprar
                </motion.button>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={handleBack}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors py-2"
                >
                    <ArrowLeft size={12} />
                    Voltar à página inicial
                </motion.button>
            </motion.div>

            {/* CSS para a animação de confetti */}
            <style>{`
                @keyframes fall {
                    0%   { transform: translateY(-30px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
