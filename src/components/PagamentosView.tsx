
import { motion } from 'framer-motion';
import {
    Wallet, CreditCard, Smartphone,
    Plus, Send, History,
    ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export const PagamentosView = () => {
    const [method, setMethod] = useState<'mpesa' | 'emola'>('mpesa');

    return (
        <div className="px-4 md:px-8 pt-2 md:pt-4 pb-20 space-y-6 md:space-y-8 max-w-none mx-auto w-full">
            {/* Header */}
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-violet-950 dark:text-white tracking-tight leading-none mb-2">Pagamentos</h2>
                <p className="text-xs md:text-sm text-slate-400 dark:text-brand-400 font-medium italic">Receba pagamentos dos clientes via M-Pesa ou e-Mola</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 md:gap-6 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-green-50/50 dark:bg-green-950/10 border border-green-100/50 dark:border-green-800/20"
                >
                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                        <Wallet size={28} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs font-black text-green-600/60 uppercase tracking-widest mb-1">Total Recebido</p>
                        <h3 className="text-2xl md:text-3xl font-black text-green-700 dark:text-green-400 leading-tight">0 MZN</h3>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-4 md:gap-6 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-violet-50/50 dark:bg-brand-950/10 border border-violet-100/50 dark:border-brand-800/20"
                >
                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-violet-100 dark:bg-brand-800 flex items-center justify-center text-violet-600">
                        <CreditCard size={28} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs font-black text-violet-600/60 uppercase tracking-widest mb-1">Pagamentos Recebidos</p>
                        <h3 className="text-2xl md:text-3xl font-black text-violet-700 dark:text-brand-300 leading-tight">0</h3>
                    </div>
                </motion.div>
            </div>

            {/* Payment Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-[2rem] md:rounded-[2.5rem] border border-violet-100 dark:border-brand-800 bg-white dark:bg-brand-900 p-6 md:p-10 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-brand-800 flex items-center justify-center text-violet-600">
                        <Plus size={18} />
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">Iniciar Pagamento</h3>
                </div>

                <p className="text-[11px] md:text-xs font-bold text-slate-400 dark:text-brand-400 mb-6 md:mb-8 max-w-2xl text-pretty">
                    Insira o número do cliente para enviar a solicitação de pagamento. O cliente receberá uma notificação para confirmar com o PIN.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-4 md:space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] md:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider ml-1">Valor (MZN)</label>
                            <input
                                type="text"
                                placeholder="0.00"
                                className="w-full h-12 md:h-14 px-4 md:px-6 rounded-2xl border border-slate-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-950 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-300 text-sm md:text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] md:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider ml-1">Descrição (opcional)</label>
                            <input
                                type="text"
                                placeholder="Ex: Pagamento do curso de marketing"
                                className="w-full h-12 md:h-14 px-4 md:px-6 rounded-2xl border border-slate-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-950 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-300 text-sm md:text-base"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] md:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider ml-1">Número do Cliente</label>
                            <div className="flex gap-2">
                                <div className="h-12 md:h-14 px-3 md:px-4 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-brand-800 font-black text-slate-400 border border-slate-100 dark:border-brand-700 text-xs md:text-sm">
                                    +258
                                </div>
                                <input
                                    type="text"
                                    placeholder="84 123 4567"
                                    className="flex-1 h-12 md:h-14 px-4 md:px-6 rounded-2xl border border-slate-100 dark:border-brand-800 bg-slate-50 dark:bg-brand-950 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-300 text-sm md:text-base"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] md:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider ml-1">Método de Pagamento</label>
                            <div className="flex flex-wrap gap-4 md:gap-6 pt-2">
                                <button
                                    onClick={() => setMethod('mpesa')}
                                    className="flex items-center gap-3 cursor-pointer group"
                                >
                                    <div className={cn(
                                        "h-5 w-5 md:h-6 md:w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        method === 'mpesa' ? "border-violet-600 bg-violet-600 shadow-lg shadow-violet-500/20" : "border-slate-200 dark:border-brand-700"
                                    )}>
                                        {method === 'mpesa' && <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-white" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-red-100 flex items-center justify-center">
                                            <Smartphone size={14} className="text-red-500 md:w-4 md:h-4" />
                                        </div>
                                        <span className="text-xs md:text-sm font-black text-slate-700 dark:text-brand-100">M-Pesa</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setMethod('emola')}
                                    className="flex items-center gap-3 cursor-pointer group"
                                >
                                    <div className={cn(
                                        "h-5 w-5 md:h-6 md:w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        method === 'emola' ? "border-violet-600 bg-violet-600 shadow-lg shadow-violet-500/20" : "border-slate-200 dark:border-brand-700"
                                    )}>
                                        {method === 'emola' && <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-white" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                            <Smartphone size={14} className="text-orange-500 md:w-4 md:h-4" />
                                        </div>
                                        <span className="text-xs md:text-sm font-black text-slate-700 dark:text-brand-100">e-Mola</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 md:mt-12">
                    <button className="w-full h-12 md:h-14 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-[1rem] md:rounded-[1.2rem] font-black flex items-center justify-center gap-2 md:gap-3 shadow-xl shadow-violet-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm md:text-base">
                        <Send size={18} className="md:w-5 md:h-5" />
                        Enviar Solicitação
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
                        <History size={20} />
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
