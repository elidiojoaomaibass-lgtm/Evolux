import { useState, useRef, useEffect, useMemo } from 'react';
import { 
    Gem, Calendar, Bell, LogOut, BarChart3, X, UserCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useTransactionsStore } from '../lib/store';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashboardProps {
    user: any;
    onLogout: () => void;
    setView: (view: string) => void;
    toggleSidebar: () => void;
}

export function Dashboard({ user, onLogout, setView, toggleSidebar }: DashboardProps) {
    const [period, setPeriod] = useState('HOJE');
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const profileRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const datePickerRef = useRef<HTMLDivElement>(null);

    const { transactions } = useTransactionsStore();

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setShowDatePicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h >= 5 && h < 12) return 'Bom dia';
        if (h >= 12 && h < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const periodOptions = [
        { key: 'HOJE', label: 'Hoje' },
        { key: 'ONTEM', label: 'Ontem' },
        { key: '7D', label: '7D' },
        { key: '30D', label: '30D' },
        { key: '90D', label: '90D' },
        { key: 'TODO', label: 'Todo' },
    ];

    // Filter transactions based on selected period
    const filteredTxs = useMemo(() => {
        const now = new Date();
        return transactions.filter(tx => {
            if (tx.type !== 'payment') return false;
            const txDate = new Date(tx.createdAt);
            if (period === 'HOJE') return txDate.toDateString() === now.toDateString();
            if (period === 'ONTEM') {
                const yesterday = new Date();
                yesterday.setDate(now.getDate() - 1);
                return txDate.toDateString() === yesterday.toDateString();
            }
            if (period === '7D') {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                return txDate >= weekAgo;
            }
            if (period === '30D') {
                const monthAgo = new Date();
                monthAgo.setDate(now.getDate() - 30);
                return txDate >= monthAgo;
            }
            if (period === '90D') {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setDate(now.getDate() - 90);
                return txDate >= threeMonthsAgo;
            }
            if (period === 'TODO') return true;
            return true;
        });
    }, [transactions, period]);

    const approvedTxs = useMemo(() => filteredTxs.filter(t => t.status === 'Concluído'), [filteredTxs]);
    const pendingTxs = useMemo(() => filteredTxs.filter(t => t.status === 'Pendente'), [filteredTxs]);
    const failedTxs = useMemo(() => filteredTxs.filter(t => t.status === 'Falhou'), [filteredTxs]);

    const totalRevenue = useMemo(() => approvedTxs.reduce((sum, t) => sum + t.amount, 0), [approvedTxs]);

    // Calculate level progression (Bronze, Silver, Gold, Platinum, Diamond) using all-time confirmed revenue
    const allApprovedTxs = useMemo(() => transactions.filter(t => t.type === 'payment' && t.status === 'Concluído'), [transactions]);
    const allTimeRevenue = useMemo(() => allApprovedTxs.reduce((sum, t) => sum + t.amount, 0), [allApprovedTxs]);

    const level = useMemo(() => {
        if (allTimeRevenue < 10000) return { name: 'BRONZE', target: 10000, color: 'text-cyan-500', bg: 'bg-cyan-500' };
        if (allTimeRevenue < 50000) return { name: 'PRATA', target: 50000, color: 'text-slate-400', bg: 'bg-slate-400' };
        if (allTimeRevenue < 150000) return { name: 'OURO', target: 150000, color: 'text-amber-500', bg: 'bg-amber-500' };
        if (allTimeRevenue < 500000) return { name: 'PLATINA', target: 500000, color: 'text-indigo-400', bg: 'bg-indigo-400' };
        return { name: 'DIAMANTE', target: allTimeRevenue || 1, color: 'text-purple-500', bg: 'bg-purple-500' };
    }, [allTimeRevenue]);

    const progressPercent = Math.min(100, (allTimeRevenue / level.target) * 100);

    const stats = [
        {
            label: 'RECEITA TOTAL',
            value: `${totalRevenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN`,
            borderColor: 'border-l-emerald-500',
            labelColor: 'text-emerald-400',
            textColor: 'text-emerald-500'
        },
        {
            label: 'APROVADAS',
            value: approvedTxs.length.toLocaleString(),
            borderColor: 'border-l-emerald-400',
            labelColor: 'text-emerald-400',
            textColor: 'text-emerald-500'
        },
        {
            label: 'PENDENTES',
            value: pendingTxs.length.toLocaleString(),
            borderColor: 'border-l-amber-400',
            labelColor: 'text-amber-400',
            textColor: 'text-amber-500'
        },
        {
            label: 'CANCELADAS',
            value: failedTxs.length.toLocaleString(),
            borderColor: 'border-l-red-400',
            labelColor: 'text-red-400',
            textColor: 'text-red-500'
        },
    ];

    // Chart data aggregation for standard/custom filters
    const chartData = useMemo(() => {
        if (period === 'HOJE' || period === 'ONTEM') {
            const hours = period === 'HOJE' ? new Date().getHours() + 1 : 24;
            return Array.from({ length: hours }, (_, i) => {
                const hourTxs = filteredTxs.filter(t => new Date(t.createdAt).getHours() === i);
                return {
                    name: `${i.toString().padStart(2, '0')}h`,
                    receita: hourTxs.reduce((acc, curr) => acc + (curr.status === 'Concluído' ? curr.amount : 0), 0)
                };
            });
        }
        
        const days = period === '7D' ? 7 : period === '30D' ? 30 : period === '90D' ? 90 : 30;
        return Array.from({ length: days }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            const dayStr = date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
            const dayTxs = filteredTxs.filter(t => new Date(t.createdAt).toDateString() === date.toDateString());
            return {
                name: dayStr,
                receita: dayTxs.reduce((acc, curr) => acc + (curr.status === 'Concluído' ? curr.amount : 0), 0)
            };
        });
    }, [period, filteredTxs]);

    // Payment methods calculation
    const mpesaCount = useMemo(() => approvedTxs.filter(t => t.method === 'M-Pesa').length, [approvedTxs]);
    const emolaCount = useMemo(() => approvedTxs.filter(t => t.method === 'e-Mola').length, [approvedTxs]);
    const totalApprovedCount = approvedTxs.length;

    const mpesaPercent = totalApprovedCount > 0 ? Math.round((mpesaCount / totalApprovedCount) * 100) : 0;
    const emolaPercent = totalApprovedCount > 0 ? Math.round((emolaCount / totalApprovedCount) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#fafbff] dark:bg-[#0f0525] p-4 md:p-8 font-sans">
            <div className="w-full space-y-8">
                
                {/* ─── TOP HEADER ─── */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 border-b border-slate-100 dark:border-white/5 pb-4">
                    {/* Left: Progress */}
                    <div className="flex flex-col gap-2 w-full lg:w-64">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Gem size={14} className="text-cyan-500" />
                                <span className="text-[10px] font-black text-slate-800 dark:text-brand-500 uppercase tracking-widest">PROGRESSO {level.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-cyan-500 dark:text-cyan-400">
                                {allTimeRevenue.toLocaleString('pt-PT')} / {level.target >= 1000000 ? '1M+' : `${(level.target / 1000)}K`} MZN
                            </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${progressPercent}%` }} 
                                className={cn("h-full rounded-full transition-all duration-500", level.bg)} 
                            />
                        </div>
                    </div>

                    {/* Right: Filters & Icons */}
                    <div className="flex items-center gap-4 w-full lg:w-auto z-50">
                        <div className="relative" ref={datePickerRef}>
                            <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-brand-900/40 border border-slate-100 dark:border-white/5 rounded-full shadow-sm overflow-x-auto scrollbar-hide max-w-[calc(100vw-6rem)] lg:max-w-none">
                                {periodOptions.map((p) => (
                                    <button
                                        key={p.key}
                                        onClick={() => { setPeriod(p.key); setShowDatePicker(false); }}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                            period === p.key && !showDatePicker
                                                ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                                                : "text-slate-500 hover:text-slate-800 dark:text-brand-400 dark:hover:text-white"
                                        )}
                                    >
                                        {p.key}
                                    </button>
                                ))}
                                <div className="mx-1 w-px bg-slate-200 dark:bg-white/10 h-4 shrink-0" />
                                <button 
                                    onClick={() => setShowDatePicker(!showDatePicker)}
                                    className={cn(
                                        "h-8 px-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                                        showDatePicker
                                            ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                                            : "text-slate-500 hover:text-slate-800 transition-all"
                                    )}
                                >
                                    <Calendar size={12} />
                                    <span>Personalizar</span>
                                </button>
                            </div>

                            <AnimatePresence>
                                {showDatePicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-[calc(100%+0.5rem)] w-72 rounded-[1.5rem] bg-white dark:bg-brand-950 p-4 border border-slate-100 dark:border-white/5 shadow-2xl z-50"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Filtro Customizado</h4>
                                            <button onClick={() => setShowDatePicker(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Data Inicial</label>
                                                <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Data Final</label>
                                                <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                                            </div>
                                            <button onClick={() => setShowDatePicker(false)} className="w-full py-2 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all">Aplicar</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative shrink-0" ref={notificationsRef}>
                            <button 
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                className="relative h-11 w-11 flex items-center justify-center bg-white dark:bg-brand-900 rounded-full border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all"
                            >
                                <Bell size={18} className="text-slate-600 dark:text-brand-400" />
                                <div className="absolute top-[10px] right-[10px] h-2 w-2 rounded-full bg-violet-600 border-2 border-white dark:border-brand-900" />
                            </button>

                            <AnimatePresence>
                                {notificationsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-[calc(100%+0.5rem)] w-72 rounded-[1.5rem] bg-white dark:bg-brand-950 p-2 border border-slate-100 dark:border-white/5 shadow-2xl z-50"
                                    >
                                        <div className="px-4 py-3 border-b border-slate-100 mb-2 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Notificações</span>
                                            <span className="bg-violet-100 text-violet-600 text-[8px] font-black px-2 py-0.5 rounded-full">1 NOVA</span>
                                        </div>
                                        <div className="p-3 text-center text-xs text-slate-500 font-medium h-24 flex flex-col items-center justify-center">
                                            <Bell size={24} className="text-slate-200 mb-2" />
                                            Nenhum alerta crítico no momento.
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative shrink-0" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="h-11 w-11 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-500/20 p-1 flex items-center justify-center cursor-pointer hover:scale-105 transition-all overflow-hidden"
                            >
                                {user?.user_metadata?.photo_url ? (
                                    <img src={user.user_metadata.photo_url} alt="Profile" className="h-full w-full object-cover rounded-lg" />
                                ) : (
                                    <div className="h-full w-full rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-xs">
                                        {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'E'}
                                    </div>
                                )}
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-[calc(100%+0.5rem)] w-64 rounded-[1.5rem] bg-white dark:bg-brand-950 p-2 border border-slate-100 dark:border-white/5 shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="px-4 py-4 bg-slate-50 dark:bg-white/5 rounded-xl mb-2">
                                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                                                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{user?.email}</p>
                                        </div>
                                        <button
                                            onClick={() => { setView('Configurações'); setProfileOpen(false); }}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 dark:text-brand-200 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-600 rounded-xl transition-all uppercase tracking-widest"
                                        >
                                            <UserCircle2 size={16} /> Meu Perfil
                                        </button>
                                        <div className="my-1 border-t border-slate-100 dark:border-white/5" />
                                        <button onClick={onLogout} className="flex w-full items-center gap-3 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all uppercase tracking-widest">
                                            <LogOut size={16} /> Encerrar Sessão
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* ─── WELCOME ─── */}
                <div className="flex items-center gap-4">
                    <button onClick={toggleSidebar} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm md:hidden">
                        <BarChart3 size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">
                            {getGreeting()}, {user?.user_metadata?.full_name || user?.email?.split('@')[0]} 👋
                        </h2>
                        <p className="text-sm text-slate-400 dark:text-brand-400 font-medium">
                            Acompanhe as suas vendas e receitas de hoje.
                        </p>
                    </div>
                </div>

                {/* ─── STATS CARDS ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((item) => (
                        <div key={item.label} className={cn("bg-white dark:bg-brand-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-white/5 border-l-[4px]", item.borderColor)}>
                            <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", item.labelColor)}>
                                {item.label}
                            </p>
                            <p className={cn("text-2xl font-black tracking-tighter", item.textColor)}>
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ─── MAIN GRID ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Gráfico de Vendas */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                                    Gráfico de Vendas
                                </h3>
                                <p className="text-[10px] text-slate-400 font-medium ml-3.5">Volume total do período: <span className="text-violet-600 font-bold">{totalRevenue.toLocaleString('pt-PT')} MZN</span></p>
                            </div>
                            <div className="flex gap-4 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Faturamento</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-[2rem] h-[350px] w-full shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                            <div className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorDashboard" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                                            dx={-10}
                                            tickFormatter={(val) => val >= 1000 ? `${(val / 1000)}k` : val}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 5, 37, 0.95)',
                                                borderRadius: '16px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff',
                                                padding: '12px'
                                            }}
                                            labelStyle={{ color: '#8b5cf6', fontSize: '9px', fontWeight: 'black' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="receita"
                                            name="Faturamento"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorDashboard)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Métodos de Pagamento */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-tight">
                                Métodos de<br/>Pagamento
                            </h3>
                            <div className="text-right">
                                <span className="text-[9px] font-black uppercase text-violet-600 tracking-widest block">Total: {totalApprovedCount}</span>
                                <span className="text-[9px] font-black uppercase text-violet-600 tracking-widest block">Vendas</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-[2rem] h-[350px] shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total</span>
                                <span className="text-5xl font-black text-slate-900 tracking-tighter">{totalApprovedCount}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-3 w-3 rounded-sm bg-red-500 flex items-center justify-center">
                                            <div className="h-1 w-1 bg-white rounded-full" />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-900 tracking-widest">M-PESA</span>
                                    </div>
                                    <span className="text-sm font-black text-violet-600">{mpesaPercent}%</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{mpesaCount} Vendas</span>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-3 w-3 rounded-sm bg-orange-500 flex items-center justify-center">
                                            <div className="h-1 w-1 bg-white rounded-full" />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-900 tracking-widest">E-MOLA</span>
                                    </div>
                                    <span className="text-sm font-black text-violet-600">{emolaPercent}%</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{emolaCount} Vendas</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── TRANSACTIONS ─── */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Transações em Tempo Real</h3>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 tracking-widest">
                                TOTAL: {filteredTxs.length}
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/50 text-[10px] font-black text-emerald-600 tracking-widest">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                ATIVO
                            </div>
                        </div>
                        <button 
                            onClick={() => setView('Vendas')}
                            className="px-6 py-3 rounded-xl bg-white border border-slate-100 shadow-sm text-[10px] font-black uppercase text-slate-700 tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            Ver Histórico Completo
                        </button>
                    </div>

                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 overflow-hidden">
                        <div className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-slate-100/50">
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</div>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Produto</div>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Cliente</div>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Método</div>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Valor / Estado</div>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Data/Hora</div>
                        </div>
                        {filteredTxs.length > 0 ? (
                            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                {filteredTxs.slice(0, 5).map(tx => (
                                    <div key={tx.id} className="grid grid-cols-6 gap-4 px-6 py-3.5 items-center hover:bg-slate-50/50 transition-all">
                                        <div className="font-mono text-[10px] font-bold text-slate-400 truncate">
                                            #{tx.id.substring(0, 12)}
                                        </div>
                                        <div className="text-xs font-bold text-slate-700 text-center truncate">
                                            {tx.description || 'Pagamento'}
                                        </div>
                                        <div className="text-xs text-slate-600 text-center truncate">
                                            {tx.customerName || 'Cliente'} ({tx.phone})
                                        </div>
                                        <div className="flex justify-center">
                                            <div className={cn(
                                                "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                tx.method === 'e-Mola' 
                                                    ? "bg-orange-50 text-orange-600 border-orange-200"
                                                    : "bg-red-50 text-red-600 border-red-200"
                                            )}>
                                                {tx.method}
                                            </div>
                                        </div>
                                        <div className="text-center flex flex-col items-center">
                                            <span className="text-xs font-black text-slate-800">{tx.amount.toLocaleString()} MZN</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mt-0.5 border",
                                                tx.status === 'Concluído' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                                tx.status === 'Pendente' ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                "bg-red-50 text-red-600 border-red-200"
                                            )}>
                                                {tx.status}
                                            </span>
                                        </div>
                                        <div className="text-right text-[10px] text-slate-400 font-bold">
                                            {new Date(tx.createdAt).toLocaleDateString('pt-PT')} <br />
                                            {new Date(tx.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-32 flex items-center justify-center text-sm font-medium text-slate-400">
                                Nenhuma transação recente.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

