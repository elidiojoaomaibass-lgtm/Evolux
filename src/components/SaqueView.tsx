import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, Clock, CheckCircle2,
    Smartphone, History, Loader2,
    ArrowDownLeft, ShieldAlert, BadgeDollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

// ─── Constants & Mock Data ──────────────────────────────────────────────────

const withdrawalsData: any[] = [];

// ─── SaqueView ──────────────────────────────────────────────────────────────

export const SaqueView = () => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<'M-Pesa' | 'e-Mola'>('M-Pesa');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Mock balances separated by wallet with "Total Coletado"
    const [balances] = useState({
        'M-Pesa': { available: 0.00, pending: 0.00, collected: 0.00 },
        'e-Mola': { available: 0.00, pending: 0.00, collected: 0.00 }
    });

    // Tracking pending withdrawals per wallet to enforce the "1 per wallet" rule
    const [pendingByWallet, setPendingByWallet] = useState({
        'M-Pesa': false,
        'e-Mola': false
    });

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);

        if (!amount || numAmount <= 0) {
            toast.error("Insira um valor válido para o saque.");
            return;
        }

        if (numAmount > balances[method].available) {
            toast.error(`Saldo insuficiente na carteira ${method}.`);
            return;
        }

        if (numAmount < 500) {
            toast.error("O valor mínimo para saque é de 500 MZN.");
            return;
        }

        if (pendingByWallet[method]) {
            toast.error(`Você já possui um saque pendente para ${method}. Aguarde a aprovação.`);
            return;
        }

        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        setLoading(false);
        setPendingByWallet(prev => ({ ...prev, [method]: true }));
        setShowSuccess(true);
        toast.success(`Solicitação de saque via ${method} enviada!`);
        setAmount('');
    };

    return (
        <div className="px-4 md:px-8 pt-2 md:pt-4 pb-20 space-y-6 w-full max-w-none mx-auto transition-all duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-violet-950 dark:text-white tracking-tight flex items-center gap-3">
                        Centro Financeiro
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse" />
                    </h2>
                    <p className="text-xs md:text-sm text-slate-400 dark:text-brand-400 font-medium mt-1 flex items-center gap-2">
                        <BadgeDollarSign size={16} className="text-violet-500" />
                        Gere as suas retiradas e acompanhe os seus lucros disponíveis.
                    </p>
                </div>


            </div>

            {/* TABELA DE VALORES DISPONÍVEIS */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-brand-900 border border-violet-100 dark:border-brand-800 rounded-3xl shadow-sm overflow-hidden"
            >
                <div className="p-4 md:p-6 border-b border-violet-50 dark:border-brand-800 flex items-center justify-between bg-white dark:bg-brand-900/50 backdrop-blur-sm sticky top-0 md:relative">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Wallet size={18} className="text-violet-600" />
                        Visão Geral de Saldos
                    </h3>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-brand-800 text-[9px] font-black text-violet-600 uppercase tracking-widest">
                        Ativo em Moçambique
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-brand-950/50 border-b border-slate-100 dark:border-brand-800">
                                <th className="px-6 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Carteira Móvel</th>
                                <th className="px-6 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status de Saque</th>
                                <th className="px-6 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo Retido</th>
                                <th className="px-6 py-2.5 text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest text-right">Saldo Coletado</th>
                                <th className="px-6 py-2.5 text-[9px] font-black text-violet-500 uppercase tracking-widest text-right bg-violet-50/30">Saldo Disponível</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-brand-800">
                            {[
                                { id: 'M-Pesa', color: 'bg-red-500' },
                                { id: 'e-Mola', color: 'bg-orange-500' }
                            ].map((wallet) => (
                                <tr key={wallet.id} className="group hover:bg-slate-50/50 dark:hover:bg-brand-800/10 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-white border border-slate-100 shadow-sm overflow-hidden p-1")}>
                                                <img 
                                                    src={wallet.id === 'M-Pesa' ? '/mpesa_logo.png' : '/emola_logo.png'} 
                                                    alt={wallet.id} 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 dark:text-white">{wallet.id}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest tracking-[0.1em]">Pagamentos Imediatos</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex justify-center">
                                            {pendingByWallet[wallet.id as 'M-Pesa' | 'e-Mola'] ? (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[8px] font-black uppercase tracking-wider animate-pulse">
                                                    <Clock size={10} /> Saque Pendente
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 text-[8px] font-black uppercase tracking-wider">
                                                    <CheckCircle2 size={10} /> Disponível
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <span className="text-xs font-bold text-slate-500 dark:text-brand-400">
                                            {balances[wallet.id as 'M-Pesa' | 'e-Mola'].pending.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                                            {balances[wallet.id as 'M-Pesa' | 'e-Mola'].collected.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right bg-violet-50/10 transition-colors group-hover:bg-violet-50/20">
                                        <span className="text-base font-black text-violet-600 dark:text-violet-400">
                                            {balances[wallet.id as 'M-Pesa' | 'e-Mola'].available.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-950 text-white font-black border-t border-violet-500">
                                <td colSpan={2} className="px-6 py-3 text-xs uppercase tracking-[0.2em] text-violet-400">Saldos Globais</td>
                                <td className="px-6 py-3 text-right text-xs text-slate-400">
                                    {(balances['M-Pesa'].pending + balances['e-Mola'].pending).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN
                                </td>
                                <td className="px-6 py-3 text-right text-xs text-teal-400">
                                    {(balances['M-Pesa'].collected + balances['e-Mola'].collected).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN
                                </td>
                                <td className="px-6 py-3 text-right text-base bg-violet-900 shadow-inner">
                                    {(balances['M-Pesa'].available + balances['e-Mola'].available).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Form Saque */}
                <div className="lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-brand-900 border border-violet-100 dark:border-brand-800 p-6 rounded-3xl shadow-sm h-full"
                    >
                        <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 border-b border-slate-50 dark:border-brand-800 pb-3">Retirada de Saldo</h3>

                        <form onSubmit={handleWithdraw} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Carteira Destino</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'M-Pesa', color: 'bg-red-500' },
                                        { id: 'e-Mola', color: 'bg-orange-500' }
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setMethod(m.id as any)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 relative",
                                                method === m.id
                                                    ? "border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-violet-600 shadow-inner"
                                                    : "border-slate-50 dark:border-brand-800 text-slate-400 opacity-60 grayscale"
                                            )}
                                        >
                                            <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 p-1 overflow-hidden">
                                                <img 
                                                    src={m.id === 'M-Pesa' ? '/mpesa_logo.png' : '/emola_logo.png'} 
                                                    alt={m.id} 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest">{m.id}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quanto deseja levantar?</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-brand-950 border border-violet-50 dark:border-brand-800 rounded-2xl text-2xl font-black outline-none focus:ring-4 focus:ring-violet-500/10 transition-all dark:text-white"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 tracking-widest uppercase">MZN</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAmount(balances[method].available.toString())}
                                    className="text-[9px] font-black text-violet-600 dark:text-brand-400 uppercase tracking-[0.1em] hover:underline ml-1"
                                >
                                    Sacar Total da {method}
                                </button>
                            </div>

                            {pendingByWallet[method] ? (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex gap-3 animate-in slide-in-from-top duration-300">
                                    <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 leading-relaxed italic">
                                        Limitação ativa: Você já possui um saque em analise para **{method}**.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-slate-50 dark:bg-brand-950 p-4 rounded-2xl border border-violet-50 dark:border-brand-800 space-y-3">
                                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Taxas</span>
                                        <span className="text-emerald-500">Gratuito</span>
                                    </div>
                                    <div className="flex justify-between items-center text-base font-black text-slate-900 dark:text-white pt-2.5 border-t border-slate-200/50 dark:border-brand-800">
                                        <span>Valor Líquido</span>
                                        <div className="text-right">
                                            <p className="text-violet-600">{amount ? parseFloat(amount).toLocaleString('pt-PT') : '0,00'} MZN</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || pendingByWallet[method]}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg",
                                    pendingByWallet[method]
                                        ? "bg-slate-100 dark:bg-brand-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-brand-700"
                                        : "bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:scale-[1.02] active:scale-95 shadow-black/10"
                                )}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                {pendingByWallet[method] ? "Aguardando" : "Solicitar Transferência"}
                            </button>
                        </form>
                    </motion.div>
                </div>

                {/* History Block */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-brand-900 border border-violet-100 dark:border-brand-800 rounded-3xl shadow-sm overflow-hidden h-fit">
                        <div className="p-4 md:p-6 border-b border-violet-50 dark:border-brand-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <History size={18} className="text-violet-600" />
                                    Últimos Levantamentos
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Histórico completo de transações.</p>
                            </div>
                            <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-violet-600 transition-colors border border-slate-100 dark:border-brand-800 px-3 py-1.5 rounded-lg">CSV</button>
                        </div>

                        <div className="overflow-x-auto px-4 pb-4">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-brand-950/50">
                                        <th className="px-6 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID / Referência</th>
                                        <th className="px-6 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Carteira</th>
                                        <th className="px-6 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                                        <th className="px-6 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-brand-800">
                                    {withdrawalsData.map((w) => (
                                        <tr key={w.id} className="hover:bg-violet-50/10 dark:hover:bg-brand-800/10 transition-all group">
                                            <td className="px-6 py-2.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-slate-100 dark:bg-brand-950 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-sm">
                                                        <ArrowDownLeft size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-800 dark:text-white tracking-widest uppercase">{w.id}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 italic">{w.date}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-2.5">
                                                <div className="flex flex-col items-center">
                                                    <div className={cn(
                                                        "px-2 py-0.5 rounded text-[8px] font-black text-white uppercase shadow-sm mb-0.5",
                                                        w.method === 'M-Pesa' ? "bg-red-500" : "bg-orange-500"
                                                    )}>
                                                        {w.method}
                                                    </div>
                                                    <span className="text-[9px] font-black opacity-40">{w.recipient}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-2.5 text-right font-black text-slate-950 dark:text-white text-sm">
                                                {w.amount.toLocaleString()} MZN
                                            </td>
                                            <td className="px-6 py-2.5 text-center">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5",
                                                    w.status === 'Concluído' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                                                )}>
                                                    {w.status === 'Concluído' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                                    {w.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            className="bg-white dark:bg-brand-900 w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl border border-violet-100 dark:border-brand-800"
                        >
                            <div className="h-24 w-24 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-500 mx-auto mb-8 shadow-inner ring-4 ring-green-50/50">
                                <CheckCircle2 size={48} className="animate-bounce" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Solicitação Recebida!</h3>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed mb-10 px-4">
                                Recebemos o seu pedido de levantamento. Em alguns instantes o valor será creditado na sua conta móvel.
                            </p>
                            <button
                                onClick={() => setShowSuccess(false)}
                                className="w-full py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2.5xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10"
                            >
                                Perfeito, entendi
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
