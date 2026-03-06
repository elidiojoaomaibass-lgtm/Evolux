
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search,
    Clock, Mail, Package,
    UserCheck, UserMinus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAffiliatesStore, useProductsStore } from '../lib/store';
import { toast } from 'sonner';
import { ConfirmationModal } from './ConfirmationModal';

export const AfiliadosView = () => {
    const { products } = useProductsStore();
    const { requests, approveRequest, rejectRequest } = useAffiliatesStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'Todos' | 'Pendente' | 'Aprovado' | 'Rejeitado'>('Todos');
    const [selectedProductId, setSelectedProductId] = useState<string>('Todos');
    const [requestToReject, setRequestToReject] = useState<{ id: string, name: string } | null>(null);

    const handleApprove = (id: string, name: string) => {
        approveRequest(id);
        toast.success('Afiliado Aprovado!', {
            description: `O acesso para ${name} foi liberado com sucesso.`
        });
    };

    const handleReject = (id: string, name: string) => {
        setRequestToReject({ id, name });
    };

    const confirmReject = () => {
        if (requestToReject) {
            rejectRequest(requestToReject.id);
            toast.error('Pedido Recusado', {
                description: `A solicitação de ${requestToReject.name} foi removida.`
            });
            setRequestToReject(null);
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch =
            req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'Todos' || req.status === filterStatus;
        const matchesProduct = selectedProductId === 'Todos' || req.productId === selectedProductId;
        return matchesSearch && matchesStatus && matchesProduct;
    });

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'Pendente').length,
        approved: requests.filter(r => r.status === 'Aprovado').length
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
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Gestão de <span className="text-gradient">Afiliados</span> 🛡️
                    </h2>
                    <p className="text-xs md:text-sm text-slate-400 dark:text-brand-400 font-medium tracking-tight max-w-2xl">
                        Controle e gira as solicitações de afiliação de parceiros.
                    </p>
                </motion.div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Total de Afiliados', value: stats.total, icon: Users, color: 'text-violet-600', bg: 'bg-violet-500/5', desc: 'Conexões geridas na rede' },
                    { label: 'Solicitações Pendentes', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/5', desc: 'Aguardando revisão manual' },
                    { label: 'Afiliados Ativos', value: stats.approved, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5', desc: 'Parceiros com acesso autorizado' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className={cn(
                            "group p-6 md:p-8 rounded-2xl border border-white/20 dark:border-white/5 flex flex-col justify-between bg-white dark:bg-brand-900/40 backdrop-blur-3xl shadow-xl relative overflow-hidden transition-all hover:-translate-y-1",
                            stat.bg
                        )}
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                            <stat.icon size={80} />
                        </div>
                        <div className="relative z-10 space-y-3">
                            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-lg", stat.bg)}>
                                <stat.icon size={22} className={stat.color} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-[0.2em] mb-0.5">{stat.label}</p>
                                <p className={cn("text-3xl font-black tracking-tighter leading-none", stat.color)}>{stat.value}</p>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-brand-600 italic">{stat.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Product Selector */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <div className="h-6 w-1 bg-violet-600 rounded-full" />
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">Filtrar por Produto</h4>
                </div>
                <div className="flex items-center gap-3 overflow-x-auto p-4 bg-slate-100/30 dark:bg-brand-900/30 rounded-2xl border border-white/10 backdrop-blur-2xl scrollbar-hide">
                    <button
                        onClick={() => setSelectedProductId('Todos')}
                        className={cn(
                            "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border shadow-lg",
                            selectedProductId === 'Todos'
                                ? "bg-slate-900 dark:bg-white border-transparent text-white dark:text-slate-900 shadow-xl"
                                : "bg-white/50 dark:bg-brand-950/50 border-white/10 text-slate-500 hover:text-slate-900"
                        )}
                    >
                        Ver Todos
                    </button>
                    {products.filter(p => p.isMarketplaceEnabled).map((product) => (
                        <button
                            key={product.id}
                            onClick={() => setSelectedProductId(product.id)}
                            className={cn(
                                "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border flex items-center gap-3 shadow-lg",
                                selectedProductId === product.id
                                    ? "bg-slate-900 dark:bg-white border-transparent text-white dark:text-slate-900 shadow-xl"
                                    : "bg-white/50 dark:bg-brand-950/50 border-white/10 text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <div className="h-6 w-6 rounded-lg bg-slate-900/10 dark:bg-brand-950/10 overflow-hidden ring-1 ring-white/10">
                                {product.image && <img src={product.image} className="w-full h-full object-cover" />}
                            </div>
                            {product.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between px-2">
                <div className="relative w-full lg:max-w-xl">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Procurar por nome, email ou produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-14 pr-6 rounded-xl border border-white/20 dark:border-white/5 bg-white/50 dark:bg-brand-900/40 backdrop-blur-3xl text-sm font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-violet-500/5 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                    />
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-brand-900/60 rounded-xl border border-white/10 backdrop-blur-3xl overflow-x-auto w-full lg:w-auto scrollbar-hide">
                    {['Todos', 'Pendente', 'Aprovado', 'Rejeitado'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status as any)}
                            className={cn(
                                "px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap",
                                filterStatus === status
                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                                    : "text-slate-400 hover:text-slate-700 dark:text-brand-500 dark:hover:text-white"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="space-y-3 px-2">
                <AnimatePresence mode="popLayout">
                    {filteredRequests.length > 0 ? (
                        filteredRequests.map((req) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                key={req.id}
                                className="p-3 md:p-3.5 bg-white/40 dark:bg-brand-900/40 backdrop-blur-3xl rounded-xl border border-white/20 dark:border-white/5 group hover:shadow-lg transition-all relative overflow-hidden"
                            >
                                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 group-hover:scale-105 transition-transform shadow-md">
                                            <Users size={18} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">{req.userName}</h3>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border",
                                                    req.status === 'Pendente' ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                                                        req.status === 'Aprovado' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                                                            "bg-rose-500/10 border-rose-500/20 text-rose-600"
                                                )}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold text-slate-400 dark:text-brand-500">
                                                <span className="flex items-center gap-1 bg-slate-100 dark:bg-brand-950 px-1.5 py-0.5 rounded-md"><Mail size={10} className="text-violet-500" /> {req.userEmail}</span>
                                                <span className="flex items-center gap-1 bg-slate-100 dark:bg-brand-950 px-1.5 py-0.5 rounded-md"><Clock size={10} className="text-blue-500" /> {req.requestedAt}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-2.5 rounded-xl bg-slate-50/50 dark:bg-black/30 border border-slate-100 dark:border-white/5 shadow-inner">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-violet-600/10 dark:bg-violet-600/20 flex items-center justify-center text-violet-600">
                                                <Package size={14} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Produto</p>
                                                <p className="text-[10px] font-black text-violet-600 dark:text-brand-300 leading-tight">{req.productName}</p>
                                            </div>
                                        </div>
                                        <div className="border-l border-slate-200 dark:border-white/10 pl-4 text-left">
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Comissão</p>
                                            <p className="text-base font-black text-slate-900 dark:text-white leading-tight">{req.commission}%</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {req.status === 'Pendente' ? (
                                            <>
                                                <button
                                                    onClick={() => handleReject(req.id, req.userName)}
                                                    className="h-8 px-4 rounded-lg border border-rose-500/30 text-rose-500 text-[9px] font-black uppercase tracking-tight hover:bg-rose-500 hover:text-white transition-all transform active:scale-95"
                                                >
                                                    Recusar
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(req.id, req.userName)}
                                                    className="h-8 px-4 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-tight hover:scale-105 shadow-md transition-all active:scale-95"
                                                >
                                                    Aprovar
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 rounded-lg text-emerald-600 italic text-[9px] font-black uppercase tracking-widest">
                                                <UserCheck size={14} />
                                                Ativo
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 glass dark:bg-brand-900/40 rounded-3xl border border-white/20">
                            <div className="h-20 w-20 rounded-2xl bg-slate-50 dark:bg-brand-950 flex items-center justify-center text-slate-200 dark:text-brand-800 shadow-inner">
                                <UserMinus size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Sem Solicitações</h3>
                                <p className="text-xs md:text-sm text-slate-400 dark:text-brand-400 font-medium max-w-sm mx-auto">Novos pedidos de afiliação aparecerão aqui em breve.</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <ConfirmationModal
                isOpen={!!requestToReject}
                onClose={() => setRequestToReject(null)}
                onConfirm={confirmReject}
                title="Recusar Afiliação?"
                description={`Tem a certeza que deseja recusar o pedido de afiliação de ${requestToReject?.name}?`}
                confirmText="Recusar Agora"
                cancelText="Cancelar"
                variant="warning"
            />
        </div >
    );
};
