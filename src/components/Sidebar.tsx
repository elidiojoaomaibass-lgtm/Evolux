import {
    LayoutDashboard, ShoppingBag, BarChart2, Users,
    Settings,
    Gift, Layers, ShoppingCart, Wallet,
    Wrench, Star, Moon, Sun, Banknote, Gem
} from "lucide-react";
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Logo } from "./Logo";

export type ViewType =
    | "Dashboard" | "Vendas" | "Produtos" | "Afiliados"
    | "Mercado" | "Pagamentos" | "Saque" | "Premiações" | "Marketing"
    | "Analytics" | "Configurações";

interface SidebarProps {
    activeView: ViewType;
    setView: (view: ViewType) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const menuGroups = [
    {
        label: "Principal",
        items: [
            { icon: LayoutDashboard, label: "Dashboard" as ViewType },
            { icon: ShoppingCart, label: "Vendas" as ViewType },
            { icon: ShoppingBag, label: "Produtos" as ViewType },
            { icon: Wallet, label: "Pagamentos" as ViewType },
        ],
    },
    {
        label: "Crescimento",
        items: [
            { icon: Users, label: "Afiliados" as ViewType, badge: "Novo" },
            { icon: Layers, label: "Mercado" as ViewType, badge: "Novo" },
            { icon: Wrench, label: "Marketing" as ViewType },
            { icon: Gift, label: "Premiações" as ViewType },
        ],
    },
    {
        label: "Finanças",
        items: [
            { icon: BarChart2, label: "Analytics" as ViewType },
            { icon: Banknote, label: "Saque" as ViewType },
        ],
    },
    {
        label: "Sistema",
        items: [
            { icon: Settings, label: "Configurações" as ViewType },
        ],
    },
];

export const Sidebar = ({ activeView, setView, isDarkMode, toggleDarkMode, isOpen, onClose }: SidebarProps) => {
    // User level mock
    // const levelProgress = 68;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed left-0 top-0 z-50 h-screen w-72 lg:w-64 bg-[#1e0a45] dark:bg-[#0f0525] flex flex-col overflow-hidden transition-all duration-500 ease-in-out transform shadow-[10px_0_30px_rgba(0,0,0,0.3)]",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="px-5 py-3 border-b border-white/10 flex flex-col gap-1 items-start">
                    <Logo showText size={32} textColor="text-white" />

                </div>

                {/* Navigation Section */}
                <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-hide">
                    {
                        menuGroups.map((group) => (
                            <div key={group.label} className="space-y-1.5">
                                <h3 className="px-3 text-[10px] font-black text-white/40 uppercase tracking-widest">{group.label}</h3>
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const isActive = activeView === item.label;
                                        return (
                                            <button
                                                key={item.label}
                                                onClick={() => setView(item.label)}
                                                className={cn(
                                                    "group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200",
                                                    isActive
                                                        ? "bg-white/15 text-white shadow-lg scale-[1.02]"
                                                        : "text-white/60 hover:bg-white/5 hover:text-white"
                                                )}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeBar"
                                                        className="absolute -left-3 w-1.5 h-7 bg-white rounded-r-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                                                    />
                                                )}
                                                <item.icon
                                                    size={20}
                                                    className={cn(
                                                        "shrink-0 transition-transform group-hover:scale-110",
                                                        isActive ? "text-white" : "text-white/40 group-hover:text-white"
                                                    )}
                                                />
                                                <span className="flex-1 text-left tracking-tight">{item.label}</span>
                                                {'badge' in item && item.badge && (
                                                    <span className="rounded-full bg-fuchsia-500 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    }
                </nav>

                {/* Quick Access / Dark Mode */}
                <div className="px-5 py-3 border-t border-white/10">
                    <button
                        onClick={toggleDarkMode}
                        className="flex w-full items-center justify-between rounded-2xl bg-white/5 p-2.5 transition-all hover:bg-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center shadow-sm text-white">
                                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </div>
                            <span className="text-[10px] font-black text-white/80 uppercase tracking-tighter">
                                {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                            </span>
                        </div>
                        <div className={cn(
                            "h-5 w-10 rounded-full p-1 transition-colors duration-300",
                            isDarkMode ? "bg-violet-600" : "bg-slate-300 dark:bg-brand-800"
                        )}>
                            <div className={cn(
                                "h-3 w-3 rounded-full bg-white transition-transform duration-300 shadow-sm",
                                isDarkMode ? "translate-x-5" : "translate-x-0"
                            )} />
                        </div>
                    </button>
                </div>

                {/* Level Badge Section */}
                <div className="px-3 pb-4">
                    <div className="relative group overflow-hidden bg-gradient-to-br from-violet-600 to-purple-800 rounded-2xl p-4 shadow-xl">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                            <Star size={60} className="text-white fill-white" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center text-white border border-white/20 shadow-inner">
                                    <Gem size={20} className="text-cyan-400 animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-violet-200 uppercase tracking-widest leading-none mb-1">Rank Atual</p>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tighter">Diamante Elite</h4>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[9px] font-black text-white/50 uppercase tracking-widest">
                                    <span>Faturamento</span>
                                    <span className="text-white">520.000 MZN</span>
                                </div>
                                <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `100%` }}
                                        transition={{ duration: 2, ease: "circOut" }}
                                        className="h-full rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside >
        </>
    );
};
