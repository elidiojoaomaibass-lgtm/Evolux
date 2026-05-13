import {
    Trophy, Award, Star, Gem,
    Zap, Target, Shield, Crown,
    Lock, TrendingUp, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useTransactionsStore } from '../lib/store';
import { useMemo } from 'react';

const levelsConfig = [
    { name: 'Bronze', min: 0, max: 10000, icon: Trophy, color: 'text-orange-500', bgColor: 'bg-orange-50', darkBg: 'dark:bg-orange-900/10', benefits: ['Suporte prioritário', 'Badge exclusivo no perfil'] },
    { name: 'Prata', min: 10000, max: 50000, icon: Award, color: 'text-slate-400', bgColor: 'bg-slate-50', darkBg: 'dark:bg-slate-800/20', benefits: ['Todos benefícios Bronze', 'Taxa reduzida de 8%', 'Destaque no marketplace'] },
    { name: 'Ouro', min: 50000, max: 200000, icon: Star, color: 'text-amber-400', bgColor: 'bg-amber-50', darkBg: 'dark:bg-amber-900/10', benefits: ['Todos benefícios Prata', 'Taxa reduzida de 6%', 'Acesso antecipado a recursos'] },
    { name: 'Platina', min: 200000, max: 500000, icon: Crown, color: 'text-blue-400', bgColor: 'bg-blue-50', darkBg: 'dark:bg-blue-900/10', benefits: ['Todos benefícios Ouro', 'Taxa reduzida de 4%', 'Gestor de conta dedicado'] },
    { name: 'Diamante', min: 500000, max: Infinity, icon: Gem, color: 'text-cyan-400', bgColor: 'bg-cyan-50', darkBg: 'dark:bg-cyan-900/10', benefits: ['Todos benefícios Platina', 'Taxa reduzida de 2%', 'Convites para eventos VIP'] }
];

const rewardsConfig = [
    { target: 50000, label: 'FATURADOS', title: 'Pulseira Evolux', image: '/awards/50k.png' },
    { target: 100000, label: 'FATURADOS', title: 'Placa de Prata', image: '/awards/100k.jpg' },
    { target: 500000, label: 'FATURADOS', title: 'Placa de Ouro', image: '/awards/1m.jpg' },
    { target: 1000000, label: 'FATURADOS', title: 'Placa de Diamante', image: '/awards/500k.jpg' },
];

const achievementsConfig = [
    { title: 'Primeira Venda', desc: 'Realize sua primeira venda na plataforma', icon: Zap, target: 1 },
    { title: '10 Vendas', desc: 'Alcance 10 vendas totais', icon: Target, target: 10 },
    { title: '50 Vendas', desc: 'Alcance 50 vendas totais', icon: Shield, target: 50 },
    { title: '100 Vendas', desc: 'Alcance 100 vendas totais', icon: Award, target: 100 },
    { title: '500 Vendas', desc: 'Alcance 500 vendas totais', icon: Crown, target: 500 },
    { title: 'Mestre das Vendas', desc: 'Alcance 1000 vendas totais', icon: Gem, target: 1000 },
];

export const PremiacoesView = () => {
    const { transactions } = useTransactionsStore();

    const paymentTxs = useMemo(() => transactions.filter(t => t.type === 'payment' && t.status === 'Concluído'), [transactions]);
    const totalRevenue = useMemo(() => paymentTxs.reduce((acc, curr) => acc + curr.amount, 0), [paymentTxs]);
    const totalSales = useMemo(() => paymentTxs.length, [paymentTxs]);

    const currentLevel = useMemo(() => {
        return levelsConfig.find(l => totalRevenue >= l.min && totalRevenue < l.max) || levelsConfig[0];
    }, [totalRevenue]);

    const nextLevel = useMemo(() => {
        const idx = levelsConfig.findIndex(l => l.name === currentLevel.name);
        return levelsConfig[idx + 1] || null;
    }, [currentLevel]);

    const progress = useMemo(() => {
        if (!nextLevel) return 100;
        const currentMin = currentLevel.min;
        const target = nextLevel.min;
        return Math.min(100, Math.max(0, ((totalRevenue - currentMin) / (target - currentMin)) * 100));
    }, [totalRevenue, currentLevel, nextLevel]);

    return (
        <div className="px-4 md:px-8 pt-2 md:pt-4 pb-20 space-y-6 md:space-y-8 w-full max-w-none mx-auto">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <div>
                    <h2 className="text-lg md:text-xl font-black text-violet-950 dark:text-white tracking-tight leading-none mb-1">Premiações</h2>
                    <p className="text-[9px] md:text-[10px] text-slate-400 dark:text-brand-400 font-medium">Conquiste marcos e desbloqueie prêmios exclusivos pela Evolux.</p>
                </div>
            </div>

            {/* Current Level Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden rounded-xl md:rounded-2xl border border-violet-100 dark:border-brand-800 bg-white dark:bg-brand-900 p-3 md:p-4 shadow-sm transition-all hover:shadow-xl"
            >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    <div className="flex-shrink-0 flex justify-center md:block">
                        <div className={cn("h-12 w-12 md:h-14 md:w-14 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500", currentLevel.bgColor, currentLevel.darkBg, currentLevel.color)}>
                            <currentLevel.icon size={24} className="md:w-8 md:h-8" />
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-1 md:gap-1.5 mb-1">
                            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight">Nível Atual: {currentLevel.name}</h3>
                            <span className="rounded-full bg-violet-100 dark:bg-brand-800 px-2 py-0.5 text-[7px] md:text-[8px] font-black text-violet-600 dark:text-brand-300 uppercase tracking-widest">
                                {totalRevenue > 0 ? 'Em Evolução' : 'Iniciante'}
                            </span>
                        </div>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-brand-400 flex items-center justify-center md:justify-start gap-1">
                            <TrendingUp size={10} className="text-slate-400" />
                            Receita total: <span className="text-slate-900 dark:text-white">{totalRevenue.toLocaleString('pt-PT')} MZN</span>
                        </p>

                        <div className="mt-3 md:mt-4 space-y-1 md:space-y-1.5">
                            <div className="flex items-center justify-between text-[8px] md:text-[9px] font-black tracking-wider uppercase">
                                <span className="text-violet-600 dark:text-brand-300">
                                    {nextLevel ? `Meta: Próximo Nível (${nextLevel.name})` : 'Nível Máximo Alcançado!'}
                                </span>
                                <span className="text-slate-400">
                                    {nextLevel ? `Faltam ${(nextLevel.min - totalRevenue).toLocaleString('pt-PT')} MZN` : 'Parabéns!'}
                                </span>
                            </div>
                            <div className="h-2 md:h-2.5 w-full rounded-full bg-slate-50 dark:bg-brand-950 overflow-hidden border border-slate-100 dark:border-brand-800 p-0.5 shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full rounded-full bg-gradient-to-r from-violet-400 via-violet-600 to-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:w-48 pt-3 md:pt-0 md:pl-6 md:border-l border-slate-50 dark:border-brand-800 border-t md:border-t-0 border-slate-100 dark:border-brand-800">
                        <p className="text-[7px] font-black text-slate-300 dark:text-brand-500 uppercase tracking-[0.2em] mb-1.5 md:mb-2 text-center md:text-left">Benefícios Atuais:</p>
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-1">
                            {currentLevel.benefits.map(b => (
                                <div key={b} className="flex items-center justify-center md:justify-start gap-1 text-[9px] md:text-[10px] font-bold text-slate-600 dark:text-brand-200">
                                    <CheckCircle2 size={10} className="text-violet-500" /> {b}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Decorative background element */}
                <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-violet-50 dark:bg-brand-800/10 blur-[80px]" />
            </motion.div>

            {/* Main Rewards Grid */}
            <section className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white tracking-tight">Kits de Premiação</h3>
                    <div className="hidden sm:block h-0.5 flex-1 mx-4 bg-slate-50 dark:bg-brand-800/30 rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 pb-4">
                    {rewardsConfig.map((r, i) => {
                        const unlocked = totalRevenue >= r.target;
                        const remain = r.target - totalRevenue;

                        return (
                            <motion.div
                                key={r.target}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group flex flex-col"
                            >
                                <div className="relative">
                                    <div className={cn(
                                        "relative aspect-[4/3] w-full rounded-2xl md:rounded-3xl bg-slate-950 border shadow-xl overflow-hidden flex items-center justify-center transition-all duration-500",
                                        unlocked ? "border-emerald-500/50 shadow-emerald-500/10" : "border-violet-900/30 grayscale opacity-60"
                                    )}>
                                        <img
                                            src={r.image}
                                            alt={r.title}
                                            className="h-full w-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://via.placeholder.com/600x400/1e1b4b/ffffff?text=${r.target / 1000}K`;
                                            }}
                                        />

                                        {unlocked ? (
                                            <div className="absolute top-3 right-3 h-7 w-7 md:h-8 md:w-8 rounded-full bg-emerald-500 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                                                <CheckCircle2 size={14} className="text-white" />
                                            </div>
                                        ) : (
                                            <div className="absolute top-3 right-3 h-7 w-7 md:h-8 md:w-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/10">
                                                <Lock size={12} className="text-slate-300" />
                                            </div>
                                        )}

                                        <div className="absolute bottom-3 left-3 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 border border-white/10">
                                            <span className="text-[8px] md:text-[9px] font-black text-violet-300 uppercase tracking-widest">{r.target / 1000}K {r.label}</span>
                                        </div>
                                    </div>

                                    <div className="px-1 md:px-1.5 mt-2.5 flex items-center justify-between">
                                        <div className="min-w-0">
                                            <h4 className="text-[11px] md:text-xs font-black text-slate-900 dark:text-white leading-tight truncate">{r.title}</h4>
                                            <p className={cn(
                                                "text-[8px] md:text-[9px] font-bold uppercase tracking-tight mt-0.5 flex items-center gap-1",
                                                unlocked ? "text-emerald-500" : "text-slate-400 dark:text-brand-500 opacity-80"
                                            )}>
                                                {unlocked ? <CheckCircle2 size={8} className="shrink-0" /> : <Lock size={8} className="shrink-0" />}
                                                {unlocked ? 'Prêmio Desbloqueado' : `Faltam ${remain.toLocaleString('pt-PT')} MZN`}
                                            </p>
                                        </div>
                                        <div className="h-6 w-6 md:h-7 md:w-7 rounded-lg bg-violet-100 dark:bg-brand-800 flex items-center justify-center shrink-0">
                                            <Trophy size={12} className={cn(unlocked ? "text-emerald-500" : "text-violet-500")} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Achievement Levels List */}
            <section className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white tracking-tight">Escada do Sucesso</h3>
                    <div className="hidden sm:block h-0.5 flex-1 mx-4 bg-slate-50 dark:bg-brand-800/30 rounded-full" />
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                    {levelsConfig.map((lvl) => {
                        const isReached = totalRevenue >= lvl.min;
                        const isCurrent = currentLevel.name === lvl.name;

                        return (
                            <div
                                key={lvl.name}
                                className={cn(
                                    "relative flex flex-col items-center p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all duration-300",
                                    isCurrent
                                        ? "bg-white dark:bg-brand-900 border-violet-500 shadow-xl ring-1 ring-violet-500/20 scale-105 z-10"
                                        : isReached 
                                            ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 opacity-80"
                                            : "bg-white/50 dark:bg-brand-900/40 border-slate-100 dark:border-brand-800 grayscale opacity-40 hover:grayscale-0 hover:opacity-100"
                                )}
                            >
                                {isCurrent && (
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-2 py-0.5 text-[6px] md:text-[7px] font-black text-white uppercase tracking-widest shadow-lg whitespace-nowrap">
                                        VOCÊ ESTÁ AQUI
                                    </span>
                                )}
                                <div className={cn(
                                    "h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl mb-2 md:mb-3 flex items-center justify-center text-lg md:text-xl shadow-lg border border-white dark:border-brand-800",
                                    lvl.bgColor, lvl.darkBg, lvl.color
                                )}>
                                    <lvl.icon size={16} className="md:w-5 md:h-5" />
                                </div>
                                <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white mb-0.5">{lvl.name}</h4>
                                <p className="text-[7px] md:text-[8px] font-black text-violet-500 uppercase tracking-tighter mb-3 md:mb-4">
                                    {lvl.max === Infinity ? `+${lvl.min.toLocaleString('pt-PT')} MZN` : `${lvl.min.toLocaleString('pt-PT')} - ${lvl.max.toLocaleString('pt-PT')} MZN`}
                                </p>

                                <div className="w-full space-y-1.5 md:space-y-2">
                                    {lvl.benefits.map((b, i) => (
                                        <div key={i} className="flex items-start gap-1.5">
                                            <div className="h-3 w-3 rounded-full bg-violet-50 dark:bg-brand-800 flex items-center justify-center shrink-0 mt-0.5">
                                                <Star size={7} className="text-violet-500 fill-violet-500" />
                                            </div>
                                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-brand-300 leading-tight">{b}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Bottom Badges */}
            <section className="bg-slate-50 dark:bg-brand-950/50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-100 dark:border-brand-800/50 mt-4 md:mt-8">
                <div className="flex items-center gap-2 mb-4 md:mb-5">
                    <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-lg shrink-0">
                        <Award size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white leading-tight">Conquistas Operacionais</h3>
                        <p className="text-[8px] md:text-[9px] font-bold text-slate-400">Marcos de vendas para acelerar seu crescimento</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
                    {achievementsConfig.map((ach) => {
                        const unlocked = totalSales >= ach.target;

                        return (
                            <div key={ach.title} className={cn(
                                "group relative flex items-center gap-2.5 md:gap-3 rounded-xl p-2.5 md:p-4 border transition-all overflow-hidden",
                                unlocked
                                    ? "bg-emerald-600/5 dark:bg-emerald-600/10 border-emerald-200 dark:border-emerald-500/30 shadow-md"
                                    : "bg-white dark:bg-brand-900 border-slate-100 dark:border-brand-800 shadow-sm grayscale opacity-60"
                            )}>
                                <div className={cn(
                                    "relative z-10 h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center transition-all duration-500 shrink-0",
                                    unlocked
                                        ? "bg-emerald-600 text-white shadow-lg rotate-0"
                                        : "bg-slate-50 dark:bg-brand-800 text-slate-400 dark:text-brand-500 group-hover:rotate-[15deg]"
                                )}>
                                    <ach.icon size={16} className="md:w-5 md:h-5" />
                                </div>
                                <div className="relative z-10 min-w-0">
                                    <h4 className={cn(
                                        "text-[11px] md:text-xs font-black leading-tight mb-0.5 truncate",
                                        unlocked ? "text-emerald-700 dark:text-emerald-300" : "text-slate-800 dark:text-white"
                                    )}>{ach.title}</h4>
                                    <p className="text-[9px] md:text-[10px] font-medium text-slate-400 dark:text-brand-500 leading-tight line-clamp-2">{ach.desc}</p>
                                </div>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {unlocked ? (
                                        <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-400 opacity-50" />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Lock size={14} className="text-slate-200 dark:text-brand-800/50" />
                                            <span className="text-[7px] font-black text-slate-300">{totalSales}/{ach.target}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};
