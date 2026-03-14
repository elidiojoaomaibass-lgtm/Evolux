
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUpRight, ArrowDownRight, Search, Calendar, X, BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { User } from '@supabase/supabase-js';

type PeriodType = 'Hoje' | 'Ontem' | '7d' | '30d' | '90d' | 'Todo' | 'custom';




const transactionsData: Record<PeriodType, any[]> = {
    'Hoje': [],
    'Ontem': [],
    '7d': [],
    '30d': [],
    '90d': [],
    'Todo': [],
    'custom': []
};

interface VendasViewProps {
    user: User;
}

export const VendasView = ({ user: _user }: VendasViewProps) => {
    const [period, setPeriod] = useState<PeriodType>('Hoje');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todas');

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
    const startInputRef = useRef<HTMLInputElement>(null);
    const endInputRef = useRef<HTMLInputElement>(null);

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

            // Auto-focus logic
            if (key === 'd' && numericVal.length === 2) startMRef.current?.focus();
            if (key === 'm' && numericVal.length === 2) startYRef.current?.focus();
            if (key === 'y' && numericVal.length === 4) endDRef.current?.focus();

            if (newParts.d.length === 2 && newParts.m.length === 2 && newParts.y.length === 4) {
                setStartDate(`${newParts.y}-${newParts.m}-${newParts.d}`);
            }
        } else {
            const newParts = { ...endParts, [key]: numericVal };
            setEndParts(newParts);

            // Auto-focus logic
            if (key === 'd' && numericVal.length === 2) endMRef.current?.focus();
            if (key === 'm' && numericVal.length === 2) endYRef.current?.focus();

            if (newParts.d.length === 2 && newParts.m.length === 2 && newParts.y.length === 4) {
                setEndDate(`${newParts.y}-${newParts.m}-${newParts.d}`);
            }
        }
    };

    const rawTransactions = period === 'custom' ? transactionsData['Todo'] : (transactionsData[period] || transactionsData['Hoje']);

    const filteredTransactions = useMemo(() => {
        return rawTransactions.filter(trx => {
            const matchesSearch =
                trx.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                trx.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                trx.id.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'Todas' || trx.status === statusFilter;

            // Date range filtering for 'custom' period
            let matchesDate = true;
            if (period === 'custom' && startDate && endDate) {
                matchesDate = trx.date >= startDate && trx.date <= endDate;
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [rawTransactions, searchTerm, statusFilter, period, startDate, endDate]);

    const stats = useMemo(() => {
        const approved = filteredTransactions.filter(t => t.status === 'Aprovado');
        const pending = filteredTransactions.filter(t => t.status === 'Pendente');
        const cancelled = filteredTransactions.filter(t => t.status === 'Cancelado');

        return {
            total: filteredTransactions.reduce((acc: number, t: any) => acc + t.amount, 0),
            approvedCount: approved.length,
            pendingCount: pending.length,
            cancelledCount: cancelled.length
        };
    }, [filteredTransactions]);



    return (
        <div className="px-4 md:px-8 pt-2 md:pt-4 pb-20 space-y-6 md:space-y-8 w-full max-w-none mx-auto transition-all duration-700">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-3"
                >
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Protocolo de <span className="text-gradient">Vendas</span> 🧾
                    </h2>
                    <p className="text-sm md:text-base text-slate-400 dark:text-brand-400 font-medium tracking-tight">Registro imutável e auditoria em tempo real de todas as transações da rede.</p>
                </motion.div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-white dark:bg-brand-900 border border-slate-100 dark:border-white/5 p-1.5 rounded-3xl shadow-xl relative" ref={datePickerRef}>


                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
                        {(['Hoje', 'Ontem', '7d', '30d', '90d', 'Todo'] as PeriodType[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => {
                                    setPeriod(p);
                                    setShowDatePicker(false);
                                }}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    period === p && !showDatePicker
                                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
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
                            "h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shrink-0 ring-1 ring-inset",
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

                                            {/* Data De */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400">
                                                        <ArrowUpRight size={20} />
                                                    </div>
                                                    <span className="text-xs font-black uppercase text-white tracking-widest">Data de Início</span>
                                                    <div className="ml-auto flex gap-2">
                                                        <button 
                                                            onClick={() => setStartDate(new Date().toISOString().split('T')[0])}
                                                            className="px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-[8px] font-black uppercase hover:bg-violet-500 hover:text-white transition-all"
                                                        >
                                                            Hoje
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                const d = new Date();
                                                                d.setDate(d.getDate() - 1);
                                                                setStartDate(d.toISOString().split('T')[0]);
                                                            }}
                                                            className="px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-[8px] font-black uppercase hover:bg-violet-500 hover:text-white transition-all"
                                                        >
                                                            Ontem
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 items-center bg-brand-950/50 p-3 rounded-2xl border border-white/5 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all shadow-inner">
                                                    <input
                                                        ref={startDRef}
                                                        type="text"
                                                        placeholder="DD"
                                                        maxLength={2}
                                                        value={startParts.d}
                                                        onChange={(e) => updateFromParts('start', 'd', e.target.value)}
                                                        className="w-12 bg-transparent text-lg font-black focus:outline-none text-white placeholder:text-white/10 text-center"
                                                    />
                                                    <span className="text-white/10 text-2xl font-light">/</span>
                                                    <input
                                                        ref={startMRef}
                                                        type="text"
                                                        placeholder="MM"
                                                        maxLength={2}
                                                        value={startParts.m}
                                                        onChange={(e) => updateFromParts('start', 'm', e.target.value)}
                                                        className="w-12 bg-transparent text-lg font-black focus:outline-none text-white placeholder:text-white/10 text-center"
                                                    />
                                                    <span className="text-white/10 text-2xl font-light">/</span>
                                                    <input
                                                        ref={startYRef}
                                                        type="text"
                                                        placeholder="YYYY"
                                                        maxLength={4}
                                                        value={startParts.y}
                                                        onChange={(e) => updateFromParts('start', 'y', e.target.value)}
                                                        className="w-20 bg-transparent text-lg font-black focus:outline-none text-white placeholder:text-white/10 text-center"
                                                    />
                                                    <div 
                                                        onClick={() => {
                                                            try {
                                                                (startInputRef.current as any)?.showPicker();
                                                            } catch (e) {
                                                                startInputRef.current?.focus();
                                                            }
                                                        }}
                                                        className="ml-auto relative group-hover:scale-125 transition-transform cursor-pointer"
                                                    >
                                                        <Calendar size={20} className="text-violet-500" />
                                                        <input
                                                            ref={startInputRef}
                                                            type="date"
                                                            value={startDate}
                                                            onChange={(e) => setStartDate(e.target.value)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Data Até */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-fuchsia-600/20 flex items-center justify-center text-fuchsia-400">
                                                        <ArrowDownRight size={20} />
                                                    </div>
                                                    <span className="text-xs font-black uppercase text-white tracking-widest">Data de Fim</span>
                                                    <div className="ml-auto flex gap-2">
                                                        <button 
                                                            onClick={() => setEndDate(new Date().toISOString().split('T')[0])}
                                                            className="px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-[8px] font-black uppercase hover:bg-fuchsia-500 hover:text-white transition-all"
                                                        >
                                                            Hoje
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                const d = new Date();
                                                                const startOfYear = new Date(d.getFullYear(), 0, 1);
                                                                setStartDate(startOfYear.toISOString().split('T')[0]);
                                                                setEndDate(d.toISOString().split('T')[0]);
                                                            }}
                                                            className="px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-[8px] font-black uppercase hover:bg-fuchsia-500 hover:text-white transition-all"
                                                        >
                                                            Ano
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 items-center bg-brand-950/50 p-3 rounded-2xl border border-white/5 focus-within:ring-2 focus-within:ring-fuchsia-500/20 transition-all shadow-inner">
                                                    <input
                                                        ref={endDRef}
                                                        type="text"
                                                        placeholder="DD"
                                                        maxLength={2}
                                                        value={endParts.d}
                                                        onChange={(e) => updateFromParts('end', 'd', e.target.value)}
                                                        className="w-12 bg-transparent text-lg font-black focus:outline-none text-white placeholder:text-white/10 text-center"
                                                    />
                                                    <span className="text-white/10 text-2xl font-light">/</span>
                                                    <input
                                                        ref={endMRef}
                                                        type="text"
                                                        placeholder="MM"
                                                        maxLength={2}
                                                        value={endParts.m}
                                                        onChange={(e) => updateFromParts('end', 'm', e.target.value)}
                                                        className="w-12 bg-transparent text-lg font-black focus:outline-none text-white placeholder:text-white/10 text-center"
                                                    />
                                                    <span className="text-white/10 text-2xl font-light">/</span>
                                                    <input
                                                        ref={endYRef}
                                                        type="text"
                                                        placeholder="YYYY"
                                                        maxLength={4}
                                                        value={endParts.y}
                                                        onChange={(e) => updateFromParts('end', 'y', e.target.value)}
                                                        className="w-20 bg-transparent text-lg font-black focus:outline-none text-white placeholder:text-white/10 text-center"
                                                    />
                                                    <div 
                                                        onClick={() => {
                                                            try {
                                                                (endInputRef.current as any)?.showPicker();
                                                            } catch (e) {
                                                                endInputRef.current?.focus();
                                                            }
                                                        }}
                                                        className="ml-auto relative group-hover:scale-125 transition-transform cursor-pointer"
                                                    >
                                                        <Calendar size={20} className="text-fuchsia-500" />
                                                        <input
                                                            ref={endInputRef}
                                                            type="date"
                                                            value={endDate}
                                                            onChange={(e) => setEndDate(e.target.value)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>
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
                                            className="w-full h-14 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_20px_60px_-10px_rgba(139,92,246,0.5)] active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center gap-6 group"
                                        >
                                            <BarChart3 size={18} className="group-hover:rotate-12 transition-transform" />
                                            Aplicar Filtro
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Notification Portal */}


            {/* Sales Summary Plates (Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {[
                    {
                        label: 'Receita Total',
                        value: `${stats.total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN`,
                        borderColor: 'border-l-emerald-400',
                        textColor: 'text-emerald-500',
                        labelColor: 'text-emerald-400',
                    },
                    {
                        label: 'Aprovadas',
                        value: stats.approvedCount.toString(),
                        borderColor: 'border-l-emerald-400',
                        textColor: 'text-emerald-500',
                        labelColor: 'text-emerald-400',
                    },
                    {
                        label: 'Pendentes',
                        value: stats.pendingCount.toString(),
                        borderColor: 'border-l-amber-400',
                        textColor: 'text-amber-500',
                        labelColor: 'text-amber-400',
                    },
                    {
                        label: 'Canceladas',
                        value: stats.cancelledCount.toString(),
                        borderColor: 'border-l-red-400',
                        textColor: 'text-red-500',
                        labelColor: 'text-red-400',
                    },
                ].map((item, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08, type: 'spring', stiffness: 120 }}
                        key={item.label}
                        className={cn(
                            "bg-white dark:bg-brand-900/60 rounded-2xl p-5 border border-slate-100 dark:border-white/5 shadow-sm border-l-4",
                            item.borderColor
                        )}
                    >
                        <p className={cn("text-xs font-semibold uppercase tracking-wide mb-2", item.labelColor)}>
                            {item.label}
                        </p>
                        <p className={cn("text-2xl font-black tracking-tight", item.textColor)}>
                            {item.value}
                        </p>
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
                            placeholder="Pesquisar por cliente, produto ou ID de protocolo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-6 rounded-xl border border-white/20 dark:border-white/5 bg-white/50 dark:bg-brand-900/40 backdrop-blur-3xl text-sm font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-violet-500/10 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                        />
                    </div>
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-brand-900/60 rounded-3xl border border-white/10 backdrop-blur-3xl overflow-x-auto w-full lg:w-auto scrollbar-hide">
                        {['Todas', 'Aprovado', 'Pendente', 'Cancelado'].map((filter) => (
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
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5">
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em]">ID</th>
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em]">Produto</th>
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em]">Cliente</th>
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em] text-right">Valor</th>
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em] text-center">Estado</th>
                                    <th className="px-10 py-2 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em] text-center">Data/Hora</th>
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
                                            <td className="px-10 py-2.5 font-mono text-[11px] font-black text-slate-400 dark:text-brand-600 group-hover/row:text-violet-600 transition-colors">
                                                #{trx.id}
                                            </td>
                                            <td className="px-10 py-2.5">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">{trx.product}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Produto Digital</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-2.5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-brand-800 flex items-center justify-center text-[12px] font-black text-slate-500 dark:text-brand-300 group-hover/row:scale-110 transition-transform">
                                                        {trx.customer[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-black text-slate-700 dark:text-white tracking-tight">{trx.customer}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-brand-500 italic mt-0.5">{trx.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-2.5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[15px] font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{trx.amount.toLocaleString()} <span className="text-[10px] opacity-60">MZN</span></span>
                                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Valor Verificado</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-2.5">
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border whitespace-nowrap",
                                                        trx.status === 'Aprovado' ? "bg-green-500/5 border-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]" :
                                                            trx.status === 'Pendente' ? "bg-amber-500/5 border-amber-500/20 text-amber-500" :
                                                                "bg-red-500/5 border-red-500/20 text-red-500"
                                                    )}>
                                                        {trx.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-2.5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Hoje</span>
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-brand-500 mt-0.5">{trx.date}</span>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )) : (
                                        <motion.tr layout>
                                            <td colSpan={6} className="px-8 py-32 text-center relative">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-brand-950 flex items-center justify-center text-slate-200 dark:text-brand-900 border-2 border-dashed border-slate-200 dark:border-brand-800">
                                                        <Search size={40} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Nenhum Resultado</p>
                                                        <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto">Nenhum registo corresponde à sua pesquisa atual.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer / Info */}
                    <div className="p-4 bg-slate-50/50 dark:bg-brand-950/40 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-10 w-10 rounded-2xl border-4 border-white dark:border-brand-900 bg-slate-200 dark:bg-brand-800" />
                                ))}
                                <div className="h-10 w-10 rounded-2xl border-4 border-white dark:border-brand-900 bg-violet-600 flex items-center justify-center text-[10px] font-black text-white">0</div>
                            </div>
                            <p className="text-[11px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-widest">Rede de Clientes</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="h-12 w-12 rounded-2xl glass hover:bg-violet-600 hover:text-white transition-all flex items-center justify-center text-slate-500">
                                <ArrowUpRight size={20} className="rotate-[225deg]" />
                            </button>
                            <div className="flex items-center gap-2 px-6 h-12 rounded-2xl bg-white dark:bg-white text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] shadow-xl ring-1 ring-inset ring-black/5">
                                Página 01 de 12
                            </div>
                            <button className="h-12 w-12 rounded-2xl glass hover:bg-violet-600 hover:text-white transition-all flex items-center justify-center text-slate-500">
                                <ArrowUpRight size={20} className="rotate-[45deg]" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
