import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUpRight, ArrowDownRight, Search, Calendar, X, BarChart3, MoreHorizontal,
    ExternalLink, Copy, MessageCircle, Mail
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { User } from '@supabase/supabase-js';
import { useTransactionsStore } from '../lib/store';
import { cleanProductName } from '../lib/descriptionUtils';

type PeriodType = 'Hoje' | 'Ontem' | '7d' | '30d' | '90d' | 'Todo' | 'custom';

interface VendasViewProps {
    user: User;
}

export const VendasView = ({ user: _user }: VendasViewProps) => {
    const { transactions } = useTransactionsStore();
    const [period, setPeriod] = useState<PeriodType>('Hoje');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todas');
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startParts, setStartParts] = useState({ d: '', m: '', y: '' });
    const [endParts, setEndParts] = useState({ d: '', m: '', y: '' });

    // Refs for auto-focus
    const startDRef = useRef<HTMLInputElement>(null);
    const startMRef = useRef<HTMLInputElement>(null);
    const startYRef = useRef<HTMLInputElement>(null);
    const endDRef = useRef<HTMLInputElement>(null);
    const endMRef = useRef<HTMLInputElement>(null);
    const endYRef = useRef<HTMLInputElement>(null);
    const datePickerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
                setShowDatePicker(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Sync parts when startDate changes
    useEffect(() => {
        if (startDate) {
            const [y, m, d] = startDate.split('-');
            setStartParts({ d, m, y });
        }
    }, [startDate]);

    // Sync parts when endDate changes
    useEffect(() => {
        if (endDate) {
            const [y, m, d] = endDate.split('-');
            setEndParts({ d, m, y });
        }
    }, [endDate]);

    // Helper to update date from parts with auto-focus
    const updateFromParts = (type: 'start' | 'end', key: 'd' | 'm' | 'y', val: string) => {
        const numericVal = val.replace(/\D/g, '');

        if (type === 'start') {
            const newParts = { ...startParts, [key]: numericVal };
            setStartParts(newParts);
            if (key === 'd' && numericVal.length === 2) startMRef.current?.focus();
            if (key === 'm' && numericVal.length === 2) startYRef.current?.focus();
            if (key === 'y' && numericVal.length === 4) endDRef.current?.focus();
            if (newParts.d.length === 2 && newParts.m.length === 2 && newParts.y.length === 4) {
                setStartDate(`${newParts.y}-${newParts.m}-${newParts.d}`);
            }
        } else {
            const newParts = { ...endParts, [key]: numericVal };
            setEndParts(newParts);
            if (key === 'd' && numericVal.length === 2) endMRef.current?.focus();
            if (key === 'm' && numericVal.length === 2) endYRef.current?.focus();
            if (newParts.d.length === 2 && newParts.m.length === 2 && newParts.y.length === 4) {
                setEndDate(`${newParts.y}-${newParts.m}-${newParts.d}`);
            }
        }
    };

    // Filter transactions by type and date
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        return transactions.filter(trx => {
            if (trx.type !== 'payment') return false;

            const txDate = new Date(trx.createdAt);
            
            // Period filtering
            let matchesPeriod = true;
            if (period === 'Hoje') matchesPeriod = txDate.toDateString() === now.toDateString();
            else if (period === 'Ontem') {
                const yesterday = new Date();
                yesterday.setDate(now.getDate() - 1);
                matchesPeriod = txDate.toDateString() === yesterday.toDateString();
            } else if (period === '7d') {
                const limit = new Date();
                limit.setDate(now.getDate() - 7);
                matchesPeriod = txDate >= limit;
            } else if (period === '30d') {
                const limit = new Date();
                limit.setDate(now.getDate() - 30);
                matchesPeriod = txDate >= limit;
            } else if (period === '90d') {
                const limit = new Date();
                limit.setDate(now.getDate() - 90);
                matchesPeriod = txDate >= limit;
            } else if (period === 'custom' && startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59);
                matchesPeriod = txDate >= start && txDate <= end;
            }

            // Status filtering
            const matchesStatus = statusFilter === 'Todas' || trx.status === statusFilter;

            // Search term filtering
            const search = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                trx.id.toLowerCase().includes(search) ||
                (trx.description || '').toLowerCase().includes(search) ||
                (trx.customerName || '').toLowerCase().includes(search) ||
                (trx.customerEmail || '').toLowerCase().includes(search) ||
                trx.phone.includes(search);

            return matchesPeriod && matchesStatus && matchesSearch;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [transactions, period, startDate, endDate, statusFilter, searchTerm]);

    const stats = useMemo(() => {
        const approved = filteredTransactions.filter(t => t.status === 'Concluído');
        const pending = filteredTransactions.filter(t => t.status === 'Pendente');
        const cancelled = filteredTransactions.filter(t => t.status === 'Falhou');

        return {
            total: approved.reduce((acc, t) => acc + t.amount, 0),
            approvedCount: approved.length,
            pendingCount: pending.length,
            cancelledCount: cancelled.length
        };
    }, [filteredTransactions]);

    return (
        <div className="px-4 md:px-8 pt-2 md:pt-4 pb-20 space-y-6 md:space-y-8 w-full max-w-none mx-auto transition-all duration-700">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 xl:gap-16">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-1 md:space-y-3 mt-3 md:mt-2"
                >
                    <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none pl-[3.5rem] md:pl-0 flex items-center min-h-[2rem] md:min-h-0">
                        <span>Protocolo de <span className="text-gradient">Vendas</span> 🧾</span>
                    </h2>
                    <p className="text-[10px] md:text-xs text-slate-400 dark:text-brand-400 font-medium tracking-tight pl-[3.5rem] md:pl-0 leading-snug">Registro imutável e auditoria em tempo real de todas as transações da rede.</p>
                </motion.div>

                <div className="flex flex-row items-center gap-2 bg-white dark:bg-brand-900 border border-slate-100 dark:border-white/5 p-1.5 rounded-3xl shadow-xl relative" ref={datePickerRef}>
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
                        {(['Hoje', 'Ontem', '7d', '30d', '90d', 'Todo'] as PeriodType[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => {
                                    setPeriod(p);
                                    setShowDatePicker(false);
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    period === p && !showDatePicker
                                        ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                                        : "text-slate-500 hover:text-slate-800 dark:text-brand-400 dark:hover:text-white"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            const newState = !showDatePicker;
                            setShowDatePicker(newState);
                            if (newState) {
                                setTimeout(() => startDRef.current?.focus(), 100);
                            }
                        }}
                        className={cn(
                            "h-8 px-3.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shrink-0 ring-1 ring-inset",
                            showDatePicker || period === 'custom'
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-white/20"
                                : "text-slate-500 hover:text-slate-800 dark:text-brand-400 dark:hover:text-white ring-transparent"
                        )}
                    >
                        <Calendar size={14} />
                        <span className="hidden sm:inline">{period === 'custom' && startDate ? startDate.split('-').reverse().join('/') : 'Personalizar'}</span>
                        {(showDatePicker || period === 'custom') && (
                            <div className="h-1.5 w-1.5 bg-violet-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(139,92,246,1)]" />
                        )}
                    </button>

                    <AnimatePresence>
                        {showDatePicker && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowDatePicker(false)}
                                    className="fixed inset-0 bg-slate-900/10 dark:bg-black/40 z-[50]"
                                />

                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.95, rotateX: -10 }}
                                    animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.95, rotateX: -10 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="absolute right-0 top-full mt-10 w-[340px] md:w-[380px] bg-white dark:bg-brand-950 border border-white/20 dark:border-white/5 rounded-[2rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.5)] z-[100] p-5 md:p-6 space-y-4"
                                >
                                    <div className="absolute -top-32 -right-32 h-96 w-96 bg-violet-600/10 rounded-full blur-[100px]" />
                                    <div className="absolute -bottom-32 -left-32 h-96 w-96 bg-fuchsia-600/10 rounded-full blur-[100px]" />

                                    <div className="relative z-10 space-y-4">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                            <div>
                                                <h4 className="text-sm font-black uppercase text-white tracking-[0.2em] flex items-center gap-3">
                                                    <Calendar size={20} className="text-violet-500" /> Filtro de Datas
                                                </h4>
                                                <p className="text-[9px] text-brand-500 font-black uppercase tracking-widest mt-0.5 ml-8">Sistema de filtragem avançado</p>
                                            </div>
                                            <button
                                                onClick={() => setShowDatePicker(false)}
                                                className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all hover:rotate-90 transition-transform duration-500"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 relative">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400">
                                                        <ArrowUpRight size={20} />
                                                    </div>
                                                    <span className="text-xs font-black uppercase text-white tracking-widest">Data de Início</span>
                                                </div>
                                                <div className="flex gap-2 items-center bg-brand-950/50 p-3 rounded-2xl border border-white/5">
                                                    <input ref={startDRef} type="text" placeholder="DD" maxLength={2} value={startParts.d} onChange={(e) => updateFromParts('start', 'd', e.target.value)} className="w-12 bg-transparent text-lg font-black text-white text-center outline-none" />
                                                    <span className="text-white/10 text-2xl font-light">/</span>
                                                    <input ref={startMRef} type="text" placeholder="MM" maxLength={2} value={startParts.m} onChange={(e) => updateFromParts('start', 'm', e.target.value)} className="w-12 bg-transparent text-lg font-black text-white text-center outline-none" />
                                                    <span className="text-white/10 text-2xl font-light">/</span>
                                                    <input ref={startYRef} type="text" placeholder="YYYY" maxLength={4} value={startParts.y} onChange={(e) => updateFromParts('start', 'y', e.target.value)} className="w-20 bg-transparent text-lg font-black text-white text-center outline-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-fuchsia-600/20 flex items-center justify-center text-fuchsia-400">
                                                        <ArrowDownRight size={20} />
                                                    </div>
                                                    <span className="text-xs font-black uppercase text-white tracking-widest">Data de Fim</span>
                                                </div>
                                                <div className="flex gap-2 items-center bg-brand-950/50 p-3 rounded-2xl border border-white/5">
                                                    <input ref={endDRef} type="text" placeholder="DD" maxLength={2} value={endParts.d} onChange={(e) => updateFromParts('end', 'd', e.target.value)} className="w-12 bg-transparent text-lg font-black text-white text-center outline-none" />
                                                    <span className="text-white/10 text-2xl font-light">/</span>
                                                    <input ref={endMRef} type="text" placeholder="MM" maxLength={2} value={endParts.m} onChange={(e) => updateFromParts('end', 'm', e.target.value)} className="w-12 bg-transparent text-lg font-black text-white text-center outline-none" />
                                                    <span className="text-white/10 text-2xl font-light">/</span>
                                                    <input ref={endYRef} type="text" placeholder="YYYY" maxLength={4} value={endParts.y} onChange={(e) => updateFromParts('end', 'y', e.target.value)} className="w-20 bg-transparent text-lg font-black text-white text-center outline-none" />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (startDate && endDate) {
                                                    setPeriod('custom');
                                                    setShowDatePicker(false);
                                                }
                                            }}
                                            className="w-full h-14 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-lg active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center gap-6"
                                        >
                                            <BarChart3 size={18} />
                                            Aplicar Filtro
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Sales Summary Plates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {[
                    { label: 'Receita Total', value: `${stats.total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN`, borderColor: 'border-l-emerald-400', textColor: 'text-emerald-500', labelColor: 'text-emerald-400' },
                    { label: 'Aprovadas', value: stats.approvedCount.toString(), borderColor: 'border-l-emerald-400', textColor: 'text-emerald-500', labelColor: 'text-emerald-400' },
                    { label: 'Pendentes', value: stats.pendingCount.toString(), borderColor: 'border-l-amber-400', textColor: 'text-amber-500', labelColor: 'text-amber-400' },
                    { label: 'Falhas', value: stats.cancelledCount.toString(), borderColor: 'border-l-red-400', textColor: 'text-red-500', labelColor: 'text-red-400' },
                ].map((item, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08, type: 'spring', stiffness: 120 }}
                        key={item.label}
                        className={cn("bg-white dark:bg-brand-900/60 rounded-2xl p-5 border border-slate-100 dark:border-white/5 shadow-sm border-l-4", item.borderColor)}
                    >
                        <p className={cn("text-xs font-semibold uppercase tracking-wide mb-2", item.labelColor)}>{item.label}</p>
                        <p className={cn("text-2xl font-black tracking-tight", item.textColor)}>{item.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Search and Table Area */}
            <div className="space-y-8">
                <div className="flex flex-col lg:flex-row gap-6 items-center justify-between px-2">
                    <div className="relative w-full lg:max-w-xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Pesquisar por cliente, e-mail ou referência..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-6 rounded-xl border border-white/20 dark:border-white/5 bg-white/50 dark:bg-brand-900/40 backdrop-blur-3xl text-sm font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-violet-500/10 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                        />
                    </div>
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-brand-900/60 rounded-3xl border border-white/10 overflow-x-auto w-full lg:w-auto scrollbar-hide">
                        {['Todas', 'Concluído', 'Pendente', 'Falhou'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    statusFilter === filter
                                        ? "bg-white dark:bg-white text-slate-900 dark:text-slate-900 shadow-xl"
                                        : "text-slate-500 hover:text-slate-800 dark:text-brand-400 dark:hover:text-white"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Container */}
                <div className="glass dark:bg-brand-900/60 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 opacity-30" />

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5">
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em]">Cliente</th>
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em]">Produto</th>
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em] text-center">Valor</th>
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em] text-center">Estado</th>
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em] text-center">Método</th>
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em]">ID Transação</th>
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em]">Data / Hora</th>
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em] text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {filteredTransactions.length > 0 ? filteredTransactions.map((trx) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={trx.id}
                                            className="group/row hover:bg-violet-600/[0.03] dark:hover:bg-white/[0.02] transition-all"
                                        >
                                            <td className="px-10 py-2.5">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">{trx.customerName || 'Unknown Customer'}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-2.5">
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-black text-slate-500 dark:text-brand-500">{cleanProductName(trx.description)}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-2.5">
                                                <div className="flex flex-col items-center text-center">
                                                    <span className="text-[15px] font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{trx.amount.toLocaleString()} <span className="text-[10px] text-slate-900 dark:text-white font-medium">MZN</span></span>
                                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Processed</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-2.5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={cn(
                                                        "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border whitespace-nowrap",
                                                        trx.status === 'Concluído' ? "bg-green-500/5 border-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]" :
                                                            trx.status === 'Pendente' ? "bg-amber-500/5 border-amber-500/20 text-amber-500" :
                                                                "bg-red-500/5 border-red-500/20 text-red-500"
                                                    )}>{trx.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-2.5 text-center">
                                                <span className={`px-2 py-1 rounded ${trx.method === 'M-Pesa' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'} font-medium`}>{trx.method}</span>
                                            </td>
                                            <td className="px-10 py-2.5 font-mono text-[11px] font-black text-slate-400 dark:text-brand-600 group-hover/row:text-violet-600 transition-colors">
                                                #{trx.id}
                                            </td>
                                            <td className="px-10 py-2.5 text-center">
                                                <div className="flex flex-col items-start pl-2 h-full">
                                                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{new Date(trx.createdAt).toLocaleDateString('pt-PT')} {new Date(trx.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-2.5 text-center">
                                                <button onClick={() => { setSelectedTx(trx); setShowDetail(true); }} className="p-1 hover:bg-slate-200 dark:hover:bg-brand-800 rounded-full">
                                                    <MoreHorizontal size={16} className="text-slate-600 dark:text-brand-400" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    )) : (
                                        <motion.tr layout>
                                            <td colSpan={8} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-brand-950 flex items-center justify-center text-slate-200 dark:text-brand-900 border-2 border-dashed border-slate-200 dark:border-brand-800">
                                                        <Search size={40} />
                                                    </div>
                                                    <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Sem Vendas no Período</p>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                    {/* Transaction Detail Modal */}
                    <AnimatePresence>
                        {showDetail && selectedTx && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowDetail(false)}
                                    className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="relative w-full max-w-3xl bg-white dark:bg-[#1e2638] rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-white/10"
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#1e2638]">
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Detalhes da encomenda</h3>
                                        <button onClick={() => setShowDetail(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                            <X size={24} />
                                        </button>
                                    </div>
                                    
                                    {/* Body */}
                                    <div className="p-6 overflow-y-auto space-y-6">
                                        {/* Row 1 */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="space-y-1.5">
                                                <p className="text-sm font-bold text-slate-700 dark:text-white">Order ID:</p>
                                                <div className="px-3 py-1.5 border border-slate-300 dark:border-white/20 rounded-md bg-slate-50 dark:bg-transparent font-mono text-xs font-bold text-slate-800 dark:text-white w-fit">
                                                    {selectedTx.id}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-sm font-bold text-slate-700 dark:text-white">Status:</p>
                                                <div className={cn(
                                                    "px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest w-fit",
                                                    selectedTx.status === 'Concluído' ? "bg-emerald-500 text-white" :
                                                    selectedTx.status === 'Pendente' ? "bg-amber-500 text-white" :
                                                    "bg-rose-500 text-white"
                                                )}>
                                                    {selectedTx.status}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2 */}
                                        <div className="space-y-1.5">
                                            <p className="text-sm font-bold text-slate-700 dark:text-white">Checkout Link:</p>
                                            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-[#111827] text-white rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-black transition-colors w-fit shadow-sm">
                                                <ExternalLink size={16} />
                                                Open Checkout Page
                                            </button>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Opens on the checkout using the current product path</p>
                                        </div>

                                        {/* Row 3 */}
                                        <div className="space-y-1.5">
                                            <p className="text-sm font-bold text-slate-700 dark:text-white">Created At:</p>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                {new Date(selectedTx.createdAt).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>

                                        <hr className="border-slate-100 dark:border-white/10" />

                                        {/* Customer Info */}
                                        <div className="space-y-4">
                                            <div className="flex flex-row items-center justify-between">
                                                <h4 className="text-base font-black text-slate-800 dark:text-white tracking-tight">Customer Information</h4>
                                                <button 
                                                    onClick={() => navigator.clipboard.writeText(`Nome: ${selectedTx.customerName}\nEmail: ${selectedTx.customerEmail}\nTel: ${selectedTx.phone}`)}
                                                    className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                                >
                                                    <Copy size={16} /> Copy Info
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-white mb-1">Name:</p>
                                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{selectedTx.customerName || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-white mb-1">Phone:</p>
                                                        <a href={`https://wa.me/${selectedTx.phone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-[#38bdf8] hover:underline w-fit">
                                                            <MessageCircle size={16} /> {selectedTx.phone || 'N/A'}
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-white mb-1">Email:</p>
                                                        <a href={`mailto:${selectedTx.customerEmail}`} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-[#38bdf8] hover:underline w-fit">
                                                            <Mail size={16} /> {selectedTx.customerEmail || 'N/A'}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-slate-100 dark:border-white/10" />

                                        {/* Order Items */}
                                        <div className="space-y-4">
                                            <h4 className="text-base font-black text-slate-800 dark:text-white tracking-tight">Order Items</h4>
                                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-transparent">
                                                <table className="w-full text-left text-sm whitespace-nowrap">
                                                    <thead className="bg-slate-50 dark:bg-[#1a2030] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
                                                        <tr>
                                                            <th className="px-5 py-3.5 font-bold">Product</th>
                                                            <th className="px-5 py-3.5 font-bold">Quantity</th>
                                                            <th className="px-5 py-3.5 font-bold">Unit Price</th>
                                                            <th className="px-5 py-3.5 font-bold">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                                                        <tr className="hover:bg-white dark:hover:bg-white/5 transition-colors">
                                                            <td className="px-5 py-4 font-bold text-blue-600 dark:text-[#38bdf8] hover:underline cursor-pointer">{cleanProductName(selectedTx.description)}</td>
                                                            <td className="px-5 py-4 font-medium">1</td>
                                                            <td className="px-5 py-4 font-medium">{selectedTx.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN</td>
                                                            <td className="px-5 py-4 font-black">{selectedTx.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <hr className="border-slate-100 dark:border-white/10" />

                                        {/* Totals */}
                                        <div className="flex flex-col items-end space-y-2 pb-4 pt-2">
                                            <div className="flex items-center justify-between w-full max-w-[280px]">
                                                <span className="text-sm font-bold text-slate-700 dark:text-white">Subtotal:</span>
                                                <span className="text-sm font-black text-slate-800 dark:text-white">{selectedTx.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN</span>
                                            </div>
                                            <div className="flex items-center justify-between w-full max-w-[280px] pt-2">
                                                <span className="text-base font-bold text-slate-700 dark:text-white">Total Amount:</span>
                                                <span className="text-xl font-black text-blue-600 dark:text-[#38bdf8]">{selectedTx.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-5 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#1a2030] flex justify-end shrink-0">
                                        <button onClick={() => setShowDetail(false)} className="px-8 py-2.5 bg-slate-600 dark:bg-[#4b5563] hover:bg-slate-700 dark:hover:bg-slate-500 text-white text-sm font-black tracking-wide rounded-xl shadow-md active:scale-95 transition-all">
                                            Fechar
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
