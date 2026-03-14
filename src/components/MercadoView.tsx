
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ShoppingCart, Info,
    Star, ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useProductsStore, useAffiliatesStore, type Product } from '../lib/store';
import { toast } from 'sonner';

export const MercadoView = () => {
    const { products } = useProductsStore();
    const { addRequest } = useAffiliatesStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todas');
    const marketplaceProducts = products.filter(p => p.isMarketplaceEnabled);

    const filteredMarketplace = marketplaceProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'Todas' || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleAffiliate = (product: Product) => {
        if (product.affiliationType === 'Automatica') {
            toast.success(`Afiliação aprovada!`, {
                description: `Podes começar a vender o produto ${product.name} agora mesmo.`,
            });
        } else {
            addRequest({
                productId: product.id,
                productName: product.name,
                userName: 'Usuário Teste', // In a real app this would be the logged user
                userEmail: 'teste@evoluxprod.com',
                commission: product.commission
            });
            toast.info(`Solicitação enviada!`, {
                description: `O produtor de ${product.name} irá analisar o teu perfil em breve.`,
            });
        }
    };

    return (
        <div className="px-4 md:px-8 pt-2 md:pt-4 pb-20 space-y-6 md:space-y-8 w-full max-w-none mx-auto transition-all duration-700">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-2"
                >
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Mercado <span className="text-gradient">Hub</span> 🌐
                    </h2>
                    <p className="text-xs md:text-sm text-slate-400 dark:text-brand-400 font-medium tracking-tight max-w-2xl">
                        Descubra ativos de alta performance e escale seus dividendos através da nossa rede global.
                    </p>
                </motion.div>


                <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3 shadow-lg backdrop-blur-md">
                        <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/30">
                            <Star size={16} className="text-white fill-white" />
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest block leading-none mb-0.5">Nível Elite</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">Acesso Premium</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-8 items-center justify-between px-2">
                <div className="relative w-full lg:max-w-xl">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar ativos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-6 rounded-xl border border-white/20 dark:border-white/5 bg-white/50 dark:bg-brand-900/40 backdrop-blur-3xl text-sm font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-violet-500/5 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                    />
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-brand-900/60 rounded-3xl border border-white/10 backdrop-blur-3xl overflow-x-auto w-full lg:w-auto scrollbar-hide">
                    {['Todas', 'Ebook', 'Curso', 'Mentoria', 'Workshop'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                categoryFilter === cat
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
                                    : "text-slate-500 hover:text-slate-800 dark:text-brand-400 dark:hover:text-white"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {filteredMarketplace.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6 md:gap-10">
                    <AnimatePresence mode="popLayout">
                        {filteredMarketplace.map((product) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={product.id}
                                className="glass dark:bg-brand-900/60 rounded-[2.5rem] border border-white/20 dark:border-white/5 p-6 md:p-8 flex flex-col justify-between shadow-2xl hover:shadow-violet-600/20 transition-all duration-700 group hover:-translate-y-2"
                            >
                                {/* Top: Photo & Basic Info side by side */}
                                <div className="flex flex-col gap-6 items-center text-center">
                                    <div className="relative h-40 w-40 md:h-56 md:w-56 rounded-2xl overflow-hidden bg-slate-100 dark:bg-brand-950 shrink-0 shadow-xl border-4 border-white dark:border-white/5">
                                        <img
                                            src={product.image || "https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=200&h=200&fit=crop"}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Info size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black text-violet-600 dark:text-brand-500 uppercase tracking-widest block">
                                            {product.category}
                                        </span>
                                        <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                            {product.name}
                                        </h3>
                                        {product.description && (
                                            <p className="text-[10px] md:text-xs text-slate-400 dark:text-brand-500 font-medium line-clamp-2 max-w-[200px] mx-auto">
                                                {product.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Middle: Financials */}
                                <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50/50 dark:bg-black/30 border border-slate-100 dark:border-white/5">
                                    <div className="space-y-0.5">
                                        <p className="text-[7px] font-black text-slate-400 dark:text-brand-600 uppercase tracking-widest">Preço</p>
                                        <p className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                                            {product.price.toLocaleString()} <span className="text-[7px] opacity-60">MZN</span>
                                        </p>
                                    </div>
                                    <div className="space-y-0.5 border-l border-slate-200 dark:border-white/10 pl-2">
                                        <p className="text-[7px] font-black text-violet-600 dark:text-brand-400 uppercase tracking-widest">Ganhas</p>
                                        <p className="text-xs font-black text-violet-600 dark:text-brand-300 tabular-nums">
                                            {product.commission}%
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom: Action */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex -space-x-1 overflow-hidden">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-4 w-4 rounded-full ring-2 ring-white dark:ring-brand-900 bg-slate-200" />
                                            ))}
                                        </div>
                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Ativo</span>
                                    </div>
                                    <button
                                        onClick={() => handleAffiliate(product)}
                                        className="w-full h-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-black text-[8px] uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 group"
                                    >
                                        {product.affiliationType === 'Automatica' ? 'Vender' : 'Solicitar'}
                                        <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 glass dark:bg-brand-900/40 rounded-3xl border border-white/20">
                    <div className="h-20 w-20 rounded-2xl bg-slate-50 dark:bg-brand-950 flex items-center justify-center text-slate-200 dark:text-brand-800 shadow-inner">
                        <ShoppingCart size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Nenhum Ativo</h3>
                        <p className="text-xs md:text-sm text-slate-400 dark:text-brand-400 font-medium max-w-sm mx-auto">Novos ativos comerciais aparecerão automaticamente nesta rede em breve.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
