import { useState, useRef, useEffect } from 'react';
import { 
    Gem, Calendar, Bell, LogOut, BarChart3, X, UserCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

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

    const stats = [
        {
            label: 'RECEITA TOTAL',
            value: '0,00 MZN',
            borderColor: 'border-l-emerald-500',
            labelColor: 'text-emerald-400',
            textColor: 'text-emerald-500'
        },
        {
            label: 'APROVADAS',
            value: '0',
            borderColor: 'border-l-emerald-400',
            labelColor: 'text-emerald-400',
            textColor: 'text-emerald-500'
        },
        {
            label: 'PENDENTES',
            value: '0',
            borderColor: 'border-l-amber-400',
            labelColor: 'text-amber-400',
            textColor: 'text-amber-500'
        },
        {
            label: 'CANCELADAS',
            value: '0',
            borderColor: 'border-l-red-400',
            labelColor: 'text-red-400',
            textColor: 'text-red-500'
        },
    ];

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
                                <span className="text-[10px] font-black text-slate-800 dark:text-brand-500 uppercase tracking-widest">PROGRESSO BRONZE</span>
                            </div>
                            <span className="text-[10px] font-black text-cyan-500 dark:text-cyan-400">0 / 10K MZN</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden shadow-inner">
                            <motion.div initial={{ width: 0 }} animate={{ width: '0%' }} className="h-full bg-cyan-500 rounded-full" />
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
                                <p className="text-[10px] text-slate-400 font-medium ml-3.5">Volume total do período: <span className="text-violet-600 font-bold">0 MT</span></p>
                            </div>
                            <div className="flex gap-4 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Faturamento</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Contagem</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-[2rem] h-[350px] w-full shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center">
                            {/* Empty Chart Area */}
                        </div>
                    </div>

                    {/* Métodos de Pagamento */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-tight">
                                Métodos de<br/>Pagamento
                            </h3>
                            <div className="text-right">
                                <span className="text-[9px] font-black uppercase text-violet-600 tracking-widest block">Total: 0</span>
                                <span className="text-[9px] font-black uppercase text-violet-600 tracking-widest block">Vendas</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-[2rem] h-[350px] shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total</span>
                                <span className="text-5xl font-black text-slate-900 tracking-tighter">0</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-3 w-3 rounded-sm bg-red-500 flex items-center justify-center">
                                            <div className="h-1 w-1 bg-white rounded-full" />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-900 tracking-widest">M-PESA</span>
                                    </div>
                                    <span className="text-sm font-black text-violet-600">0%</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">0 Vendas</span>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-3 w-3 rounded-sm bg-orange-500 flex items-center justify-center">
                                            <div className="h-1 w-1 bg-white rounded-full" />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-900 tracking-widest">E-MOLA</span>
                                    </div>
                                    <span className="text-sm font-black text-violet-600">0%</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">0 Vendas</span>
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
                                TOTAL: 0
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/50 text-[10px] font-black text-emerald-600 tracking-widest">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                ATIVO
                            </div>
                        </div>
                        <button className="px-6 py-3 rounded-xl bg-white border border-slate-100 shadow-sm text-[10px] font-black uppercase text-slate-700 tracking-widest hover:bg-slate-50 transition-all">
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
                        <div className="h-32 flex items-center justify-center text-sm font-medium text-slate-400">
                            Nenhuma transação recente.
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
