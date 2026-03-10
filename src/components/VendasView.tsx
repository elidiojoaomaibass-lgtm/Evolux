
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Receipt, CheckCircle2, XCircle, Clock,
    ArrowUpRight, ArrowDownRight, Search, Download, Calendar, X, BarChart3,
    Check, Loader2, TrendingUp, TrendingDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { User } from '@supabase/supabase-js';

type PeriodType = 'Hoje' | 'Ontem' | '7d' | '30d' | '90d' | 'Todo' | 'custom';

const salesBreakdownData: Record<PeriodType, any[]> = {
    'Hoje': [
        { status: 'Aprovado', count: 0, amount: 0, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20', icon: CheckCircle2, border: 'border-green-100 dark:border-green-800/20' },
        { status: 'Pendente', count: 0, amount: 0, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: Clock, border: 'border-amber-100 dark:border-amber-800/20' },
        { status: 'Cancelado', count: 0, amount: 0, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', icon: XCircle, border: 'border-red-100 dark:border-red-800/20' },
    ],
    'Ontem': [
        { status: 'Aprovado', count: 0, amount: 0, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20', icon: CheckCircle2, border: 'border-green-100 dark:border-green-800/20' },
        { status: 'Pendente', count: 0, amount: 0, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: Clock, border: 'border-amber-100 dark:border-amber-800/20' },
        { status: 'Cancelado', count: 0, amount: 0, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', icon: XCircle, border: 'border-red-100 dark:border-red-800/20' },
    ],
    '7d': [
        { status: 'Aprovado', count: 0, amount: 0, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20', icon: CheckCircle2, border: 'border-green-100 dark:border-green-800/20' },
        { status: 'Pendente', count: 0, amount: 0, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: Clock, border: 'border-amber-100 dark:border-amber-800/20' },
        { status: 'Cancelado', count: 0, amount: 0, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', icon: XCircle, border: 'border-red-100 dark:border-red-800/20' },
    ],
    '30d': [
        { status: 'Aprovado', count: 0, amount: 0, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20', icon: CheckCircle2, border: 'border-green-100 dark:border-green-800/20' },
        { status: 'Pendente', count: 0, amount: 0, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: Clock, border: 'border-amber-100 dark:border-amber-800/20' },
        { status: 'Cancelado', count: 0, amount: 0, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', icon: XCircle, border: 'border-red-100 dark:border-red-800/20' },
    ],
    '90d': [
        { status: 'Aprovado', count: 0, amount: 0, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20', icon: CheckCircle2, border: 'border-green-100 dark:border-green-800/20' },
        { status: 'Pendente', count: 0, amount: 0, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: Clock, border: 'border-amber-100 dark:border-amber-800/20' },
        { status: 'Cancelado', count: 0, amount: 0, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', icon: XCircle, border: 'border-red-100 dark:border-red-800/20' },
    ],
    'Todo': [
        { status: 'Aprovado', count: 0, amount: 0, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20', icon: CheckCircle2, border: 'border-green-100 dark:border-green-800/20' },
        { status: 'Pendente', count: 0, amount: 0, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: Clock, border: 'border-amber-100 dark:border-amber-800/20' },
        { status: 'Cancelado', count: 0, amount: 0, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', icon: XCircle, border: 'border-red-100 dark:border-red-800/20' },
    ],
    'custom': []
    // Zeroing out mock data per user request so new accounts have 0 balances.
};

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

export const VendasView = ({ user }: VendasViewProps) => {
    const [period, setPeriod] = useState<PeriodType>('Hoje');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todas');
    const [exporting, setExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
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

    const currentBreakdown = salesBreakdownData[period] || salesBreakdownData['Hoje'];
    const rawTransactions = transactionsData[period] || transactionsData['Hoje'];

    const totalAmount = currentBreakdown.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const totalCount = currentBreakdown.reduce((acc: number, curr: any) => acc + curr.count, 0);

    const filteredTransactions = rawTransactions.filter(trx => {
        const matchesSearch =
            trx.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trx.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trx.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'Todas' || trx.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleExport = () => {
        setExporting(true);
        setTimeout(() => {
            setExporting(false);
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);
            console.log(`Relatório enviado para o email do criador: ${user.email}`);
        }, 2000);
    };

    return (
        <div className="px-4 md:px-8 pt-2 md:pt-4 pb-20 space-y-6 md:space-y-8 w-full max-w-none mx-auto transition-all duration-700">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-3"
                >
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Protocolo de <span className="text-gradient">Vendas</span> 🧾
                    </h2>
                    <p className="text-sm md:text-base text-slate-400 dark:text-brand-400 font-medium tracking-tight">Registro imutável e auditoria em tempo real de todas as transações da rede.</p>
                </motion.div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white/50 dark:bg-brand-900/40 p-2 md:p-3 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl backdrop-blur-3xl overflow-hidden relative" ref={datePickerRef}>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className={cn(
                            "h-12 px-6 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shrink-0 ring-1 ring-inset",
                            exportSuccess
                                ? "bg-emerald-500 text-white ring-emerald-400"
                                : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-white/20"
                        )}
                    >
                        {exporting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : exportSuccess ? (
                            <Check size={16} />
                        ) : (
                            <Download size={16} />
                        )}
                        {exporting ? "Iniciando Protocolo..." : exportSuccess ? "Exportação Concluída" : "Exportar Auditoria"}
                    </button>

                    <div className="hidden md:block w-px bg-slate-200 dark:bg-white/10 h-8 mx-2 shrink-0" />

                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
                        {(['Hoje', 'Ontem', '7d', '30d', '90d', 'Todo'] as PeriodType[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => {
                                    setPeriod(p);
                                    setShowDatePicker(false);
                                }}
                                className={cn(
                                    "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    period === p && !showDatePicker
                                        ? "bg-violet-600 text-white shadow-xl shadow-violet-500/30 ring-2 ring-white/20"
                                        : "text-slate-500 hover:text-slate-800 dark:text-brand-400 dark:hover:text-white"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={cn(
                            "h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shrink-0 ring-1 ring-inset",
                            showDatePicker || period === 'custom'
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-white/20"
                                : "text-slate-500 hover:text-slate-800 dark:text-brand-400 dark:hover:text-white ring-transparent"
                        )}
                    >
                        <Calendar size={18} />
                        {(showDatePicker || period === 'custom') && (
                            <div className="h-2 w-2 bg-violet-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(139,92,246,1)]" />
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
                                    className="fixed inset-0 bg-slate-900/10 dark:bg-black/40 backdrop-blur-[4px] z-[50]"
                                />

                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.95, rotateX: -10 }}
                                    animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.95, rotateX: -10 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="absolute right-0 top-full mt-6 w-[340px] md:w-[720px] bg-white dark:bg-brand-950 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[3rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.5)] z-[100] p-8 md:p-12 space-y-10 overflow-hidden"
                                >
                                    <div className="absolute -top-32 -right-32 h-96 w-96 bg-violet-600/10 rounded-full blur-[100px]" />
                                    <div className="absolute -bottom-32 -left-32 h-96 w-96 bg-fuchsia-600/10 rounded-full blur-[100px]" />

                                    <div className="relative z-10 space-y-10">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-violet-600" /> Selecionar Período
                                                </h4>
                                                <p className="text-[10px] text-slate-400 dark:text-brand-500 font-bold uppercase tracking-[0.2em] mt-2">Configuração de intervalo analítico</p>
                                            </div>
                                            <button
                                                onClick={() => setShowDatePicker(false)}
                                                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-500 hover:rotate-90 transition-transform duration-500"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
                                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-100 dark:bg-white/5 hidden md:block" />

                                            {/* Data De */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-2xl bg-violet-600/10 flex items-center justify-center">
                                                        <ArrowUpRight size={20} className="text-violet-600" />
                                                    </div>
                                                    <span className="text-[11px] font-black uppercase text-slate-500 dark:text-brand-400 tracking-widest">Data de Início</span>
                                                </div>
                                                <div className="flex gap-4 items-center bg-slate-100/50 dark:bg-black/40 p-6 rounded-[2rem] border border-white/10 shadow-inner group focus-within:ring-2 focus-within:ring-violet-600 transition-all">
                                                    <input
                                                        ref={startDRef}
                                                        type="text"
                                                        placeholder="DD"
                                                        maxLength={2}
                                                        value={startParts.d}
                                                        onChange={(e) => updateFromParts('start', 'd', e.target.value)}
                                                        className="w-12 bg-transparent text-lg font-black focus:outline-none dark:text-white placeholder:text-slate-300 text-center"
                                                    />
                                                    <span className="text-slate-300 dark:text-white/10 text-xl">/</span>
                                                    <input
                                                        ref={startMRef}
                                                        type="text"
                                                        placeholder="MM"
                                                        maxLength={2}
                                                        value={startParts.m}
                                                        onChange={(e) => updateFromParts('start', 'm', e.target.value)}
                                                        className="w-12 bg-transparent text-lg font-black focus:outline-none dark:text-white placeholder:text-slate-300 text-center"
                                                    />
                                                    <span className="text-slate-300 dark:text-white/10 text-xl">/</span>
                                                    <input
                                                        ref={startYRef}
                                                        type="text"
                                                        placeholder="YYYY"
                                                        maxLength={4}
                                                        value={startParts.y}
                                                        onChange={(e) => updateFromParts('start', 'y', e.target.value)}
                                                        className="w-20 bg-transparent text-lg font-black focus:outline-none dark:text-white placeholder:text-slate-300 text-center"
                                                    />
                                                    <div className="ml-auto relative cursor-pointer hover:scale-110 transition-transform">
                                                        <Calendar size={22} className="text-violet-600" />
                                                        <input
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
                                                    <div className="h-10 w-10 rounded-2xl bg-fuchsia-600/10 flex items-center justify-center">
                                                        <ArrowDownRight size={20} className="text-fuchsia-600" />
                                                    </div>
                                                    <span className="text-[11px] font-black uppercase text-slate-500 dark:text-brand-400 tracking-widest">Data de Fim</span>
                                                </div>
                                                <div className="flex gap-4 items-center bg-slate-100/50 dark:bg-black/40 p-6 rounded-[2rem] border border-white/10 shadow-inner group focus-within:ring-2 focus-within:ring-fuchsia-600 transition-all">
                                                    <input
                                                        ref={endDRef}
                                                        type="text"
                                                        placeholder="DD"
                                                        maxLength={2}
                                                        value={endParts.d}
                                                        onChange={(e) => updateFromParts('end', 'd', e.target.value)}
                                                        className="w-12 bg-transparent text-lg font-black focus:outline-none dark:text-white placeholder:text-slate-300 text-center"
                                                    />
                                                    <span className="text-slate-300 dark:text-white/10 text-xl">/</span>
                                                    <input
                                                        ref={endMRef}
                                                        type="text"
                                                        placeholder="MM"
                                                        maxLength={2}
                                                        value={endParts.m}
                                                        onChange={(e) => updateFromParts('end', 'm', e.target.value)}
                                                        className="w-12 bg-transparent text-lg font-black focus:outline-none dark:text-white placeholder:text-slate-300 text-center"
                                                    />
                                                    <span className="text-slate-300 dark:text-white/10 text-xl">/</span>
                                                    <input
                                                        ref={endYRef}
                                                        type="text"
                                                        placeholder="YYYY"
                                                        maxLength={4}
                                                        value={endParts.y}
                                                        onChange={(e) => updateFromParts('end', 'y', e.target.value)}
                                                        className="w-20 bg-transparent text-lg font-black focus:outline-none dark:text-white placeholder:text-slate-300 text-center"
                                                    />
                                                    <div className="ml-auto relative cursor-pointer hover:scale-110 transition-transform">
                                                        <Calendar size={22} className="text-fuchsia-600" />
                                                        <input
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
                                            className="w-full h-20 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-[2rem] text-[14px] font-black uppercase tracking-[0.3em] shadow-[0_20px_60px_-10px_rgba(139,92,246,0.5)] active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center gap-6 group"
                                        >
                                            <BarChart3 size={24} className="group-hover:rotate-12 transition-transform" />
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
            <AnimatePresence>
                {exportSuccess && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className="fixed top-24 right-8 z-[200] glass p-6 rounded-[2rem] border border-emerald-500/20 shadow-[0_25px_50px_rgba(16,185,129,0.2)] flex items-center gap-6 max-w-sm overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                        <div className="relative h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/40">
                            <Check size={24} strokeWidth={3} />
                        </div>
                        <div className="relative">
                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Protocolo Concluído</p>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-brand-500 mt-1">Relatório enviado para <b>{user.email}</b></p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sales Summary Plates (Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {currentBreakdown.map((item, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={item.status}
                        className="glass dark:bg-brand-900/60 p-8 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-500"
                    >
                        <div className={cn("absolute -top-4 -right-4 h-24 w-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-",
                            item.status === 'Aprovado' ? 'emerald-500' : item.status === 'Pendente' ? 'amber-500' : 'rose-500')} />

                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 group-hover:scale-110",
                                    item.status === 'Aprovado' ? 'bg-emerald-600/10 text-emerald-600' :
                                        item.status === 'Pendente' ? 'bg-amber-600/10 text-amber-600' :
                                            'bg-rose-600/10 text-rose-600')}>
                                    <item.icon size={22} />
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/50 dark:bg-black/20 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                    {item.status === 'Aprovado' ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingDown size={12} className="text-rose-500" />}
                                    {item.status === 'Aprovado' ? '+12%' : idx === 1 ? '+5%' : '-2%'}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 dark:text-brand-500 uppercase tracking-widest mb-1.5">{item.status}</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{item.count}</span>
                                    <span className="text-[10px] font-black text-slate-400 dark:text-brand-600 uppercase">Unitários</span>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume Total</span>
                                    <span className={cn("text-base font-black tabular-nums", item.color)}>
                                        {item.amount.toLocaleString()} MZN
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Total Combined Plate */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-8 bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-[3rem] shadow-2xl shadow-violet-500/30 relative group overflow-hidden hover:scale-[1.02] transition-transform duration-500"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <Receipt size={24} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-white/20 px-4 py-1.5 rounded-full border border-white/10">Lista Completa</span>
                            </div>
                            <h4 className="text-[10px] font-black text-violet-200 uppercase tracking-widest mb-2 opacity-80">Total Acumulado</h4>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tighter tabular-nums">{totalCount}</span>
                                <span className="text-[10px] font-black text-violet-200 uppercase tracking-widest opacity-60 italic">Entradas Confirmadas</span>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] font-black text-violet-100 uppercase tracking-widest opacity-80">Valor Bruto</span>
                            <span className="text-xl font-black tabular-nums tracking-tighter">
                                {totalAmount.toLocaleString()} <span className="text-[10px] opacity-60">MZN</span>
                            </span>
                        </div>
                    </div>
                </motion.div>
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
                            className="w-full h-16 pl-16 pr-6 rounded-[2rem] border border-white/20 dark:border-white/5 bg-white/50 dark:bg-brand-900/40 backdrop-blur-3xl text-[15px] font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-violet-500/10 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                        />
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-100/50 dark:bg-brand-900/60 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl overflow-x-auto w-full lg:w-auto scrollbar-hide">
                        {['Todas', 'Aprovado', 'Pendente', 'Cancelado'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={cn(
                                    "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
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
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-brand-950/40">
                                    <th className="px-8 py-3 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em]">ID</th>
                                    <th className="px-8 py-3 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em]">Produto</th>
                                    <th className="px-8 py-3 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em]">Cliente</th>
                                    <th className="px-8 py-3 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em] text-right">Valor</th>
                                    <th className="px-8 py-3 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em] text-center">Estado</th>
                                    <th className="px-8 py-3 text-[10px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em] text-center">Data/Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
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
                                            <td className="px-8 py-3 font-mono text-[11px] font-black text-slate-400 dark:text-brand-600 group-hover/row:text-violet-600 transition-colors">
                                                #{trx.id}
                                            </td>
                                            <td className="px-8 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">{trx.product}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Produto Digital</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-3">
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
                                            <td className="px-8 py-3 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[15px] font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{trx.amount.toLocaleString()} <span className="text-[10px] opacity-60">MZN</span></span>
                                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Valor Verificado</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-3">
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border whitespace-nowrap",
                                                        trx.status === 'Aprovado' ? "bg-green-500/5 border-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]" :
                                                            trx.status === 'Pendente' ? "bg-amber-500/5 border-amber-500/20 text-amber-500" :
                                                                "bg-red-500/5 border-red-500/20 text-red-500"
                                                    )}>
                                                        <div className={cn("h-1.5 w-1.5 rounded-full shadow-lg",
                                                            trx.status === 'Aprovado' ? "bg-green-500" : trx.status === 'Pendente' ? "bg-amber-500" : "bg-red-500")} />
                                                        {trx.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-3 text-center">
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
