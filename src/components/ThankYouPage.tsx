import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const ThankYouPage = () => {
    const [details, setDetails] = useState<{
        name?: string;
        email?: string;
        product?: string;
        amount?: string;
        method?: string;
        reference?: string;
        deliveryLink?: string;
    }>({});

    const [clicked, setClicked] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setDetails({
            name: params.get('name') || '',
            email: params.get('email') || '',
            product: params.get('product') || '',
            amount: params.get('amount') || '',
            method: params.get('method') || '',
            reference: params.get('reference') || '',
            deliveryLink: params.get('deliveryLink') || '',
        });
        const emojis = ['🎉', '✅', '🙏', '💜', '⭐', '🚀'];
        const container = document.getElementById('confetti-container');
        if (container) {
            for (let i = 0; i < 22; i++) {
                const el = document.createElement('div');
                el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
                el.style.cssText = `
                    position: absolute;
                    font-size: ${Math.random() * 22 + 14}px;
                    left: ${Math.random() * 100}%;
                    top: -30px;
                    animation: fall ${Math.random() * 3 + 2}s ease-in ${Math.random() * 2}s forwards;
                    opacity: 0;
                `;
                container.appendChild(el);
            }
        }
    }, []);

    const firstName = details.name ? details.name.split(' ')[0] : 'Cliente';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Confetti */}
            <div id="confetti-container" className="fixed inset-0 pointer-events-none z-0" />

            {/* Animated glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-slate-500/10 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-slate-400/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-slate-400/5 rounded-full blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.93 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-lg"
            >
                {/* Main Card */}
                <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_0_80px_rgba(255,255,255,0.05)] overflow-hidden">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-white/5 to-white/10 px-8 pt-10 pb-6 text-center border-b border-white/5">
                        <motion.div
                            initial={{ scale: 0, rotate: -15 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                            className="text-6xl mb-4"
                        >
                            ✅
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2"
                        >
                            Pagamento Confirmado!
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.55 }}
                            className="text-white/60 text-sm font-medium"
                        >
                            Obrigado pela sua compra, <span className="text-white font-bold">{firstName}</span>! 🎉
                        </motion.p>
                    </div>

                    {/* Order Details */}
                    <div className="px-8 py-6 space-y-3">
                        {(details.product || details.amount || details.reference) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                className="bg-white/5 rounded-2xl p-5 space-y-3 border border-white/5"
                            >
                                <p className="text-[9px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1">Resumo da Compra</p>
                                {details.product && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-white/50 font-medium">Produto</span>
                                        <span className="text-xs font-bold text-white max-w-[60%] text-right truncate">{details.product}</span>
                                    </div>
                                )}
                                {details.amount && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-white/50 font-medium">Valor Pago</span>
                                        <span className="text-sm font-black text-violet-400">
                                            {(isNaN(Number(details.amount)) ? 0 : Number(details.amount)).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
                                        </span>
                                    </div>
                                )}
                                {details.method && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-white/50 font-medium">Método</span>
                                        <span className="text-xs font-bold text-white">{details.method}</span>
                                    </div>
                                )}
                                {details.reference && (
                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                        <span className="text-[10px] text-white/30">Referência</span>
                                        <span className="text-[10px] font-mono text-white/30">{details.reference}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Access Product Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.65 }}
                        >
                            {details.deliveryLink ? (
                                <div className="space-y-3">
                                    {/* Message to client */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center">
                                        <p className="text-white/70 text-sm font-medium leading-relaxed">
                                            🎁 <span className="font-bold text-white">{firstName}</span>, o seu produto está pronto!<br />
                                            <span className="text-white/50 text-xs">Clique no botão abaixo para aceder ao que adquiriu.</span>
                                        </p>
                                    </div>

                                    {/* Premium CTA Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => {
                                            setClicked(true);
                                            setTimeout(() => window.open(details.deliveryLink, '_blank', 'noopener,noreferrer'), 200);
                                        }}
                                        className="w-full relative overflow-hidden group rounded-2xl"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-2xl" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="relative flex items-center justify-center gap-3 px-6 py-4">
                                            <span className="text-2xl">{clicked ? '🚀' : '🔓'}</span>
                                            <div className="text-left">
                                                <p className="text-white font-black text-base leading-tight">Aceder ao Produto</p>
                                                <p className="text-violet-100/80 text-xs font-medium">Clique para abrir o seu conteúdo</p>
                                            </div>
                                            <div className="ml-auto text-white/60 group-hover:translate-x-1 transition-transform duration-200">→</div>
                                        </div>
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center">
                                    <p className="text-white/70 text-sm leading-relaxed">
                                        📧 <span className="font-bold text-white">{firstName}</span>, verifique o seu email para receber as instruções de acesso ao produto.
                                    </p>
                                    {details.email && (
                                        <p className="text-white/30 text-xs mt-2">Enviado para: <span className="text-white/50">{details.email}</span></p>
                                    )}
                                </div>
                            )}
                        </motion.div>

                        {/* Support message */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-center text-white/25 text-[10px] pt-2"
                        >
                            Algum problema? Entre em contacto com o suporte.
                        </motion.p>
                    </div>
                </div>

                {/* Powered by */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center text-white/20 text-[10px] mt-4 tracking-widest uppercase"
                >
                    Powered by Evolux Pay
                </motion.p>
            </motion.div>

            <style>{`
                @keyframes fall {
                    0%   { transform: translateY(-30px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
