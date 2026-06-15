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

    const [isAdmin, setIsAdmin] = useState(false);

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
            deliveryLink: params.get('deliveryLink') || '',
        });

        // Detect admin flag
        setIsAdmin(params.get('admin') === 'true');

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
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8"
                >

                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 whitespace-nowrap">
                        Pagamento Confirmado! 🎉
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                        {details.name ? <strong className="text-slate-700">{details.name.split(' ')[0]}</strong> : ""}{details.name ? ", o" : "O"} seu pedido foi processado com sucesso. Tudo está pronto para o seu acesso imediato.
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
                                <span className="text-sm font-black text-emerald-600">
                                    {(isNaN(Number(details.amount)) ? 0 : Number(details.amount)).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
                                </span>
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
{details.deliveryLink ? (
  <>
    <motion.p
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="text-sm text-slate-700 mb-2"
    >
      🎉 Seu produto está pronto! Clique no botão abaixo para resgatar o que você adquiriu.
    </motion.p>
    <button onClick={() => window.open(details.deliveryLink, "_blank", "noopener,noreferrer")}
      className="inline-block mt-2 px-6 py-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition"
    >
      Resgatar Produto
    </button>
  </>
) : (
  <motion.p
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.7 }}
    className="text-sm text-slate-600 mb-2"
  >
    Por favor, verifique seu e‑mail para obter instruções de acesso ao seu produto ou contacte o suporte.
  </motion.p>
)}
            {isAdmin && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-4"
                >
                    <button
                        onClick={() => window.location.href = '/admin/orders'}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                    >
                        Ver Todos os Pedidos
                    </button>
                </motion.div>
            )}
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
