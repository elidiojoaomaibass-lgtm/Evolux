import { motion } from 'framer-motion';
import {
    Plus, Send, Clock,
    ArrowRight, Loader2
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { processE2Payment } from '../lib/e2paymentsWrapper';
import { E2_CLIENT_ID, E2_CLIENT_SECRET, E2_WALLET_MPESA, E2_WALLET_EMOLA } from '../config';

import { useTransactionsStore } from '../lib/store';

export const PagamentosView = () => {
    const { addTransaction } = useTransactionsStore();
    const [method, setMethod] = useState<'mpesa' | 'emola'>('mpesa');
    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);


    const handleSendRequest = async () => {
        if (!amount || !phone) {
            toast.error('Por favor, preencha o valor e o número do cliente.');
            return;
        }

        setLoading(true);
        try {
            const reference = description || `PAG-${Date.now()}`;
            const paymentResult = await processE2Payment(method, {
                phone,
                amount: parseFloat(amount),
                reference,
                // optional additional fields can be added here
            });

            // Assuming paymentResult contains transactionId and message
            addTransaction({
                id: paymentResult.transactionId || `TX-${Date.now()}`,
                type: 'payment',
                amount: parseFloat(amount),
                phone: phone,
                method: method === 'mpesa' ? 'M-Pesa' : 'e-Mola',
                status: 'Pendente',
                reference: reference,
                description: description,
            });

            toast.success(paymentResult.message || 'Solicitação enviada com sucesso!');
            setAmount('');
            setPhone('');
            setDescription('');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 md:px-8 pt-2 md:pt-4 pb-20 space-y-6 md:space-y-8 w-full max-w-none mx-auto transition-all duration-700">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 xl:gap-16">
                <div className="space-y-1 md:space-y-3 mt-3 md:mt-2">
                    <h2 className="text-xl md:text-3xl font-black text-violet-950 dark:text-white tracking-tighter leading-none pl-[3.5rem] md:pl-0 flex items-center min-h-[2rem] md:min-h-0">
                        <span>Pagamentos</span>
                    </h2>
                    <p className="text-[10px] md:text-xs text-slate-400 dark:text-brand-400 font-medium tracking-tight pl-[3.5rem] md:pl-0 leading-snug">Receba pagamentos dos clientes via M-Pesa ou e-Mola.</p>
                </div>
            </div>


            {/* Payment Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl md:rounded-3xl border border-violet-100 dark:border-brand-800 bg-white dark:bg-brand-900 p-5 md:p-8 shadow-sm"
            >
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-brand-800 flex items-center justify-center text-violet-600">
                        <Plus size={16} />
                    </div>
                    <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight">Iniciar Pagamento</h3>
                </div>

                <p className="text-[11px] md:text-xs font-bold text-slate-400 dark:text-brand-400 mb-6 md:mb-8 max-w-2xl text-pretty">
                    Insira o número do cliente para enviar a solicitação de pagamento. O cliente receberá uma notificação para confirmar com o PIN.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-3 md:space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] md:text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider ml-1">Valor (MZN)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full h-11 md:h-12 px-4 rounded-xl border border-slate-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-950 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-300 text-xs md:text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] md:text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider ml-1">Descrição (opcional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex: Pagamento do curso..."
                                className="w-full h-11 md:h-12 px-4 rounded-xl border border-slate-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-950 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-300 text-xs md:text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] md:text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider ml-1">Número do Cliente</label>
                            <div className="flex gap-2">
                                <div className="h-11 md:h-12 px-3 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-brand-800 font-black text-slate-400 border border-slate-100 dark:border-brand-700 text-[10px] md:text-xs">
                                    +258
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                    placeholder="84 123 4567"
                                    className="flex-1 h-11 md:h-12 px-4 rounded-xl border border-slate-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-950 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-300 text-xs md:text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] md:text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider ml-1">Método de Pagamento</label>
                            <div className="flex flex-wrap gap-4 pt-1.5">
                                <button
                                    onClick={() => setMethod('mpesa')}
                                    className="flex items-center gap-2 cursor-pointer group"
                                >
                                    <div className={cn(
                                        "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                                        method === 'mpesa' ? "border-violet-600 bg-violet-600" : "border-slate-200 dark:border-brand-700"
                                    )}>
                                        {method === 'mpesa' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-6 w-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                                            <img src="/mpesa_logo.png" alt="M-Pesa" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-[11px] font-black text-slate-700 dark:text-brand-100">M-Pesa</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setMethod('emola')}
                                    className="flex items-center gap-2 cursor-pointer group"
                                >
                                    <div className={cn(
                                        "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                                        method === 'emola' ? "border-violet-600 bg-violet-600" : "border-slate-200 dark:border-brand-700"
                                    )}>
                                        {method === 'emola' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-6 w-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                                            <img src="/emola_logo.png" alt="e-Mola" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-[11px] font-black text-slate-700 dark:text-brand-100">e-Mola</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 md:mt-8">
                    <button 
                        onClick={handleSendRequest}
                        disabled={loading}
                        className="w-full h-11 md:h-12 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-xs md:text-sm disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                        {loading ? 'Processando...' : 'Enviar Solicitação'}
                    </button>
                </div>
            </motion.div>

            {/* History Link */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-[1.5rem] md:rounded-[2rem] border border-violet-100 dark:border-brand-800 bg-white/50 dark:bg-brand-900/50 p-4 md:p-6 flex items-center justify-between group cursor-pointer hover:bg-white dark:hover:bg-brand-900 transition-all"
            >
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-brand-800 flex items-center justify-center text-slate-400 group-hover:text-violet-600 transition-colors">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h4 className="text-xs md:text-sm font-black text-slate-800 dark:text-white leading-tight">Histórico de Pagamentos</h4>
                        <p className="text-[10px] md:text-[11px] font-bold text-slate-400 leading-tight mt-0.5">Todos os pagamentos recebidos</p>
                    </div>
                </div>
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all">
                    <ArrowRight size={20} />
                </div>
            </motion.div>
        </div>
    );
};
