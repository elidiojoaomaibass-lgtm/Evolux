import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    Bell, Menu, LogOut, Calendar, X, BarChart3,
    ArrowUpRight, ArrowDownRight, Gem
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useState, useRef, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

// ─── Data ────────────────────────────────────────────────────────────────────


const salesData: Record<string, { name: string; valor: number; vendas: number }[]> = {
    hoje: [],
    ontem: [],
    '7dias': [],
    '30dias': [],
    '90dias': [],
    'todo': [],
};

// ─── Data ────────────────────────────────────────────────────────────────────

const recentSales: any[] = [];

type Period = 'Hoje' | 'Ontem' | '7d' | '30d' | '90d' | 'Todo' | 'custom';
const periodOptions: { key: Period; label: string }[] = [
    { key: 'Hoje', label: 'Hoje' },
    { key: 'Ontem', label: 'Ontem' },
    { key: '7d', label: '7 dias' },
    { key: '30d', label: '30 dias' },
    { key: '90d', label: '90 dias' },
    { key: 'Todo', label: 'Todo' },
];

// ─── Sub Components ─────────────────────────────────────────────────────────

const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface DashboardProps {
    onLogout?: () => void;
    setView: (view: any) => void;
    user: User;
    toggleSidebar: () => void;
}

export const Dashboard = ({ onLogout, setView, user, toggleSidebar }: DashboardProps) => {
    const [period, setPeriod] = useState<Period>('Hoje');
    const [profileOpen, setProfileOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startParts, setStartParts] = useState({ d: '', m: '', y: '' });
    const [endParts, setEndParts] = useState({ d: '', m: '', y: '' });
    const profileRef = useRef<HTMLDivElement>(null);
    const datePickerRef = useRef<HTMLDivElement>(null);

    // Refs for auto-focus
    const startDRef = useRef<HTMLInputElement>(null);
    const startMRef = useRef<HTMLInputElement>(null);
    const startYRef = useRef<HTMLInputElement>(null);
    const endDRef = useRef<HTMLInputElement>(null);
    const endMRef = useRef<HTMLInputElement>(null);
    const endYRef = useRef<HTMLInputElement>(null);
    const startInputRef = useRef<HTMLInputElement>(null);
    const endInputRef = useRef<HTMLInputElement>(null);

    // Mock filtering logic for demonstration
    const rawData = (period === 'Todo') ? salesData['todo']
        : (period === '90d') ? salesData['90dias']
            : (period === '30d') ? salesData['30dias']
                : (period === '7d') ? salesData['7dias']
                    : (period === 'Ontem') ? salesData['ontem']
                    : (period === 'custom') ? salesData['todo']
                            : (salesData['hoje'] || []);

    const data = (period === 'custom' && startDate && endDate) 
        ? (rawData as any[]).filter(item => item.dateISO >= startDate && item.dateISO <= endDate)
        : rawData;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
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

    const scale = (period === 'Todo') ? 50
        : (period === '90d') ? 30
            : (period === '30d' || period === 'custom') ? 10
                : (period === '7d') ? 5
                    : 1;

    // Calculate dynamic payment methods distribution
    const mPesaCount = Math.floor(recentSales.filter(s => s.method === 'M-Pesa').length * scale);
    const eMolaCount = Math.floor(recentSales.filter(s => s.method === 'e-Mola').length * scale);
    const totalCount = mPesaCount + eMolaCount;

    // Calculate sum of amounts for the distribution
    const mPesaAmount = recentSales
        .filter(s => s.method === 'M-Pesa')
        .reduce((sum, s) => sum + parseFloat(s.amount.replace('.', '').replace(' MZN', '')), 0) * scale;
    const eMolaAmount = recentSales
        .filter(s => s.method === 'e-Mola')
        .reduce((sum, s) => sum + parseFloat(s.amount.replace('.', '').replace(' MZN', '')), 0) * scale;

    const paymentMethods = [
        {
            name: 'M-Pesa',
            percentage: totalCount > 0 ? Math.round((mPesaCount / totalCount) * 100) : 0,
            amount: mPesaAmount,
            count: mPesaCount,
            bg: 'bg-red-50 dark:bg-red-950/30',
            color: 'text-red-500',
            barColor: 'bg-red-500'
        },
        {
            name: 'e-Mola',
            percentage: totalCount > 0 ? Math.round((eMolaCount / totalCount) * 100) : 0,
            amount: eMolaAmount,
            count: eMolaCount,
            bg: 'bg-orange-50 dark:bg-orange-950/30',
            color: 'text-orange-500',
            barColor: 'bg-orange-500'
        },
    ];

    const totalPeriod = data.reduce((s, d) => s + d.valor, 0);

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

    // ─── Stats Cards (estilo da imagem: borda colorida à esquerda, sem ícones) ───
    const stats = [
        {
            label: 'Receita Total',
            value: `${totalPeriod.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN`,
            borderColor: 'border-l-emerald-400',
            textColor: 'text-emerald-500',
            labelColor: 'text-emerald-400',
        },
        {
            label: 'Aprovadas',
            value: '0',
            borderColor: 'border-l-emerald-400',
            textColor: 'text-emerald-500',
            labelColor: 'text-emerald-400',
        },
        {
            label: 'Pendentes',
            value: '0',
            borderColor: 'border-l-amber-400',
            textColor: 'text-amber-500',
            labelColor: 'text-amber-400',
        },
        {
            label: 'Canceladas',
            value: '0',
            borderColor: 'border-l-red-400',
            textColor: 'text-red-500',
            labelColor: 'text-red-400',
        },
    ];

    return (
        <div className="min-h-screen bg-transparent">
            {/* Top Bar - High End Glassmorphism */}
            <header className="sticky top-0 z-30 glass transition-all duration-300">
                <div className="flex h-16 items-center justify-between px-4 md:px-8 max-w-none mx-auto w-full">
                    <div className="flex items-center gap-4 lg:gap-8">
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden h-12 w-12 flex items-center justify-center rounded-2xl border border-violet-100 dark:border-white/5 bg-white dark:bg-brand-900 text-slate-600 dark:text-brand-100 shadow-sm"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Level Progress - Desktop Only */}
                        <div className="hidden lg:flex flex-col gap-1.5 min-w-[300px]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Gem size={14} className="text-cyan-400" />
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Progresso Bronze</span>
                                </div>
                                <span className="text-[10px] font-black text-cyan-600 dark:text-brand-400">0 / 10K MZN</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden border border-white/50 dark:border-white/5 p-0.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '0%' }}
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-5">
                        <div className="relative" ref={datePickerRef}>
                            <div className="hidden md:flex items-center gap-1 p-1 bg-white dark:bg-brand-800/40 border border-white/20 dark:border-white/5 rounded-2xl shadow-sm">
                                {periodOptions.map((p) => (
                                    <button
                                        key={p.key}
                                        onClick={() => {
                                            setPeriod(p.key);
                                            setShowDatePicker(false);
                                        }}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                            period === p.key && !showDatePicker
                                                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                                                : "text-slate-500 hover:text-slate-800 dark:text-brand-400 dark:hover:text-white"
                                        )}
                                    >
                                        {p.key}
                                    </button>
                                ))}
                                <div className="mx-1 w-px bg-slate-100 dark:bg-white/5 h-4 shrink-0" />
                                <button
                                    onClick={() => setShowDatePicker(!showDatePicker)}
                                    className={cn(
                                        "h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative",
                                        showDatePicker || period === 'custom'
                                            ? "bg-violet-600 text-white shadow-lg"
                                            : "text-slate-500 hover:text-slate-800 dark:text-brand-400 dark:hover:text-white"
                                    )}
                                >
                                    <Calendar size={14} />
                                    <span className="hidden sm:inline">Personalizar</span>
                                    {(showDatePicker || period === 'custom') && (
                                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-violet-500 rounded-full border-2 border-white dark:border-brand-900 animate-pulse" />
                                    )}
                                </button>
                            </div>

                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className={cn(
                                    "md:hidden flex items-center gap-2 px-4 py-2 rounded-xl border transition-all active:scale-95 font-black uppercase text-[9px] tracking-widest",
                                    period === 'custom' || showDatePicker
                                        ? "bg-violet-600 text-white shadow-xl shadow-violet-500/30 border-transparent"
                                        : "bg-white dark:bg-brand-900 border-violet-100 dark:border-white/5 text-slate-600 dark:text-brand-200"
                                )}
                            >
                                <Calendar size={14} />
                                {period === 'custom' && startDate ? startDate.split('-').reverse().join('/') : 'Filtrar'}
                            </button>

                            <AnimatePresence>
                                {showDatePicker && (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setShowDatePicker(false)}
                                            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-[50]"
                                        />

                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                            className="absolute right-0 top-full mt-6 w-[320px] md:w-[380px] bg-white dark:bg-brand-950 rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] z-[100] p-5 md:p-6 border border-white/20 dark:border-white/5"
                                        >
                                            <div className="relative z-10 space-y-4">
                                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase text-white tracking-[0.2em] flex items-center gap-3">
                                                            <Calendar size={20} className="text-violet-500" /> Filtro de Datas
                                                        </h4>
                                                        <p className="text-[9px] text-brand-500 font-black uppercase tracking-widest mt-0.5 ml-8">Sistema de filtragem avançado</p>
                                                    </div>
                                                    <button onClick={() => setShowDatePicker(false)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all">
                                                        <X size={20} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 gap-6 relative">
                                                    {/* Data De */}
                                                    <div className="space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400">
                                                                <ArrowUpRight size={20} />
                                                            </div>
                                                            <span className="text-xs font-black uppercase text-white tracking-widest">Data de Início</span>
                                                            <div className="ml-auto flex gap-2">
                                                                <button 
                                                                    onClick={() => setStartDate(new Date().toISOString().split('T')[0])}
                                                                    className="px-2 py-1 rounded-md bg-white/5 text-[8px] text-white/50 font-black uppercase hover:bg-violet-500 hover:text-white transition-all"
                                                                >
                                                                    Hoje
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const d = new Date();
                                                                        d.setDate(d.getDate() - 1);
                                                                        setStartDate(d.toISOString().split('T')[0]);
                                                                    }}
                                                                    className="px-2 py-1 rounded-md bg-white/5 text-[8px] text-white/50 font-black uppercase hover:bg-violet-500 hover:text-white transition-all"
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
                                                            <div className="h-10 w-10 rounded-2xl bg-fuchsia-600/20 flex items-center justify-center text-fuchsia-400">
                                                                <ArrowDownRight size={20} />
                                                            </div>
                                                            <span className="text-xs font-black uppercase text-white tracking-widest">Data de Fim</span>
                                                            <div className="ml-auto flex gap-2">
                                                                <button 
                                                                    onClick={() => setEndDate(new Date().toISOString().split('T')[0])}
                                                                    className="px-2 py-1 rounded-md bg-white/5 text-[8px] text-white/50 font-black uppercase hover:bg-fuchsia-500 hover:text-white transition-all"
                                                                >
                                                                    Hoje
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const d = new Date();
                                                                        setEndDate(d.toISOString().split('T')[0]);
                                                                    }}
                                                                    className="px-2 py-1 rounded-md bg-white/5 text-[8px] text-white/50 font-black uppercase hover:bg-fuchsia-500 hover:text-white transition-all"
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
                                                    className="w-full py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_20px_60px_-10px_rgba(124,58,237,0.5)] active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center gap-4 group"
                                                >
                                                    <BarChart3 size={18} className="group-hover:animate-bounce" /> Aplicar Filtro
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <button className="relative h-12 w-12 flex items-center justify-center rounded-2xl glass hover:bg-violet-500/10 transition-all group">
                            <Bell size={20} className="text-slate-600 dark:text-brand-100" />
                            <span className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full bg-violet-600 border-2 border-white dark:border-brand-900 group-hover:scale-150 transition-transform" />
                        </button>

                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-0.5 shadow-lg shadow-violet-500/20 cursor-pointer overflow-hidden group hover:scale-105 transition-all"
                            >
                                <div className="h-full w-full rounded-[14px] bg-white p-0.5 overflow-hidden">
                                    <img
                                        src="/logo.png"
                                        alt="User"
                                        className="h-full w-full rounded-[12px] object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user?.email?.charAt(0) || 'U'}&background=7c3aed&color=fff&bold=true`;
                                        }}
                                    />
                                </div >
                            </button >

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-16 w-72 rounded-[2rem] glass-dark p-2 border border-white/5 shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="px-5 py-6 bg-white/5 rounded-[1.5rem] mb-2">
                                            <p className="text-sm font-black text-white truncate mb-1">
                                                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                                            </p>
                                            <p className="text-[11px] font-bold text-brand-400 truncate tracking-wide">
                                                {user?.email}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => { setProfileOpen(false); setView('Configurações'); }}
                                                className="flex w-full items-center gap-3 px-4 py-3 text-xs font-black text-brand-100 hover:bg-white/10 rounded-xl transition-all uppercase tracking-widest"
                                            >
                                                Configurações
                                            </button>
                                            <button
                                                onClick={onLogout}
                                                className="flex w-full items-center gap-3 px-4 py-3 text-xs font-black text-red-400 hover:bg-red-500/10 rounded-xl transition-all uppercase tracking-widest"
                                            >
                                                <LogOut size={16} />
                                                Encerrar Sessão
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div >
                    </div >
                </div >
            </header >

            <main className="px-4 md:px-8 pt-1 md:pt-2 pb-20 space-y-4 md:space-y-6 w-full max-w-none mx-auto">
                <div className="space-y-6 md:space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">
                                {getHour()}, <span className="text-slate-900 dark:text-white">{user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0]} 👋</span>
                            </h2>
                            <p className="text-sm md:text-base text-slate-400 dark:text-brand-400 font-medium tracking-tight">Acompanhe as suas vendas e receitas de hoje.</p>
                        </motion.div>

                        {/* Mobile Quick Filter */}
                        <div className="md:hidden flex items-center gap-1.5 p-1.5 rounded-[1.5rem] glass overflow-x-auto scrollbar-hide">
                            {periodOptions.map((p) => (
                                <button
                                    key={p.key}
                                    onClick={() => setPeriod(p.key)}
                                    className={cn(
                                        "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                        period === p.key
                                            ? "bg-violet-600 text-white shadow-xl shadow-violet-500/30"
                                            : "text-slate-400 hover:text-slate-600 dark:text-brand-400"
                                    )}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ─── Stats Cards (estilo da imagem) ─── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {stats.map((item, idx) => (
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 items-stretch">
                    <div className="lg:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass dark:bg-brand-900/60 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-white/20 dark:border-white/5 shadow-xl transition-all h-full group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                                <div>
                                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-violet-600 animate-pulse" /> Gráfico de Vendas
                                    </h3>
                                    <p className="text-[10px] md:text-xs text-slate-500 dark:text-brand-400 font-medium">
                                        Volume total period: <span className="text-violet-600 dark:text-brand-300 font-black tracking-tighter ml-1">{totalPeriod.toLocaleString()} MT</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-4 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-brand-800 rounded-xl shadow-sm">
                                            <div className="h-2 w-2 rounded-full bg-violet-600 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                                            <span className="text-[10px] font-black text-slate-700 dark:text-white uppercase tracking-widest leading-none">Faturamento</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5">
                                            <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                                            <span className="text-[10px] font-black text-slate-400 dark:text-brand-400 uppercase tracking-widest leading-none">Contagem</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[280px] md:h-[340px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data}>
                                        <defs>
                                            <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            dy={15}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            dx={-10}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            dx={10}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(13, 13, 23, 0.9)',
                                                borderRadius: '24px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                backdropFilter: 'blur(20px)',
                                                boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                                                padding: '16px'
                                            }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            labelStyle={{ color: '#8b5cf6', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}
                                        />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="valor"
                                            name="Faturamento (MZN)"
                                            stroke="#8b5cf6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorValor)"
                                            animationDuration={2000}
                                        />
                                        <Area
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="vendas"
                                            name="Contagem (Vendas)"
                                            stroke="#06b6d4"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            fill="transparent"
                                            animationDuration={2500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="flex flex-col h-full space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">Métodos de Pagamento</h3>
                                <div className="text-[10px] font-black text-violet-600 dark:text-brand-400 uppercase tracking-widest bg-violet-50 dark:bg-violet-950/30 px-3 py-1 rounded-full">
                                    Total: {totalCount} vendas
                                </div>
                            </div>
                            <div className="glass dark:bg-brand-900/60 rounded-[2rem] md:rounded-[2.5rem] p-6 border border-white/20 dark:border-white/5 shadow-xl flex flex-col items-center justify-center flex-1 group min-h-[300px]">
                                <div className="h-[220px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={paymentMethods}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={8}
                                                dataKey="count"
                                            >
                                                {paymentMethods.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.name === 'M-Pesa' ? '#ef4444' : '#f97316'} className="transition-all duration-500 hover:opacity-80 outline-none" />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(13, 13, 23, 0.9)',
                                                    borderRadius: '16px',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    backdropFilter: 'blur(10px)',
                                                    color: '#fff'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{totalCount}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                                    {paymentMethods.map((pm) => (
                                        <div key={pm.name} className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={cn("h-2 w-2 rounded-full", pm.name === 'M-Pesa' ? 'bg-red-500' : 'bg-orange-500')} />
                                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{pm.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-violet-600 dark:text-brand-400">{pm.percentage}%</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{pm.count} vendas</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6 pt-8">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Transações em Tempo Real</h3>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-white/10">
                                    <span className="text-[10px] font-black text-slate-500 dark:text-brand-400 uppercase tracking-widest leading-none">Total: {totalCount}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Ativo</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setView('Vendas')}
                                className="h-12 px-6 rounded-2xl glass hover:bg-violet-600 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
                            >
                                Ver Histórico Completo
                            </button>
                        </div>

                        <div className="glass dark:bg-brand-900/60 rounded-[2.5rem] md:rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden">
                            <div className="overflow-x-auto scrollbar-hide">
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
                                        {recentSales.map((sale, i) => (
                                            <tr key={sale.customer + i} className="group hover:bg-violet-600/5 transition-all duration-300">
                                                <td className="px-10 py-2.5">
                                                    <span className="font-mono text-[11px] font-black text-slate-400 dark:text-brand-600 group-hover:text-violet-500 transition-colors">
                                                        #IP-{92841 + i}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-2.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-900 dark:text-white">Pack VIP Elite</span>
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-brand-500 mt-1 uppercase tracking-tighter">Produto Digital Nível 3</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-2.5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-brand-800 dark:to-brand-900 flex items-center justify-center text-xs font-black text-slate-500 dark:text-brand-300 border border-white/10 group-hover:rotate-6 transition-transform">
                                                            {sale.customer[0]}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-slate-800 dark:text-white tracking-tight">{sale.customer}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 dark:text-brand-500 mt-0.5 lowercase tracking-tight">84000{i}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-2.5 text-right font-mono">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{sale.amount.toLocaleString()} MZN</span>
                                                </td>
                                                <td className="px-10 py-2.5">
                                                    <div className="flex justify-center">
                                                        <span className={cn(
                                                            "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border whitespace-nowrap",
                                                            sale.status === 'Aprovado' ? "bg-green-500/5 border-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]" :
                                                                sale.status === 'Pendente' ? "bg-amber-500/5 border-amber-500/20 text-amber-500" :
                                                                    "bg-red-500/5 border-red-500/20 text-red-500"
                                                        )}>
                                                            {sale.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-2.5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Hoje</span>
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-brand-500 mt-0.5">14:2{i} GMT+2</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
