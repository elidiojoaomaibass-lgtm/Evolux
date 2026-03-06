
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, MoreVertical, Edit2,
    Trash2, Package, Globe, ShoppingBag,
    ChevronDown, Phone, Link2, Target,
    Upload, X, DollarSign, XCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useProductsStore, type Product, type Category } from '../lib/store';
import { ConfirmationModal } from './ConfirmationModal';

// --- Data Types & Mocks Removed (moved to store.ts) ---

export const ProdutosView = () => {
    const { products, addProduct, deleteProduct, editProduct } = useProductsStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [filterStatus, setFilterStatus] = useState<'Todos' | 'Ativo' | 'Rascunho'>('Todos');
    const [productToDelete, setProductToDelete] = useState<string | null>(null);

    // Create Form States
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newCategory, setNewCategory] = useState<Category>('Ebook');
    const [newDescription, setNewDescription] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newSalesLink, setNewSalesLink] = useState('');
    const [newPixel, setNewPixel] = useState('');
    const [isMarketplaceEnabled, setIsMarketplaceEnabled] = useState(false);
    const [newCommission, setNewCommission] = useState('50');
    const [newAffiliationType, setNewAffiliationType] = useState<'Automatica' | 'Manual'>('Automatica');
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'Todos' || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingProduct) {
            editProduct({
                ...editingProduct,
                name: newName,
                price: Number(newPrice),
                category: newCategory,
                description: newDescription,
                phone: newPhone,
                salesLink: newSalesLink,
                pixel: newPixel,
                isMarketplaceEnabled,
                commission: Number(newCommission),
                affiliationType: newAffiliationType,
                image: imagePreview || editingProduct.image
            });
        } else {
            const newProd: Product = {
                id: `PRD-00${products.length + 1}`,
                name: newName,
                type: 'Digital',
                category: newCategory,
                price: Number(newPrice),
                sales: 0,
                revenue: 0,
                status: 'Ativo',
                description: newDescription,
                phone: newPhone,
                salesLink: newSalesLink,
                pixel: newPixel,
                isMarketplaceEnabled: isMarketplaceEnabled,
                commission: Number(newCommission),
                affiliationType: newAffiliationType,
                image: imagePreview || undefined,
                createdAt: new Date().toISOString().split('T')[0]
            };
            addProduct(newProd);
        }

        closeModal();
    };

    const handleDeleteProduct = (id: string) => {
        setProductToDelete(id);
    };

    const confirmDelete = () => {
        if (productToDelete) {
            deleteProduct(productToDelete);
            setProductToDelete(null);
        }
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setNewName(product.name);
        setNewPrice(product.price.toString());
        setNewCategory(product.category);
        setNewDescription(product.description || '');
        setNewPhone(product.phone || '');
        setNewSalesLink(product.salesLink || '');
        setNewPixel(product.pixel || '');
        setIsMarketplaceEnabled(product.isMarketplaceEnabled);
        setNewCommission(product.commission.toString());
        setNewAffiliationType(product.affiliationType || 'Automatica');
        setImagePreview(product.image || null);
        setShowCreateModal(true);
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setEditingProduct(null);
        setNewName('');
        setNewPrice('');
        setNewDescription('');
        setNewPhone('');
        setNewSalesLink('');
        setNewPixel('');
        setIsMarketplaceEnabled(false);
        setNewCommission('50');
        setNewAffiliationType('Automatica');
        setImagePreview(null);
    };

    return (
        <div className="px-4 md:px-8 pt-2 md:pt-4 pb-20 space-y-6 md:space-y-8 w-full max-w-none mx-auto transition-all duration-700">
            {/* Top Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <div className="flex flex-col md:flex-row items-baseline gap-4">
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                            Meus <span className="text-gradient">Produtos</span> 💎
                        </h2>
                        <div className="flex items-center gap-2 bg-violet-500/10 px-4 py-1.5 rounded-full border border-violet-500/20">
                            <Package size={14} className="text-violet-600" />
                            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">{products.length} Ativos</span>
                        </div>
                    </div>
                    <p className="text-sm md:text-lg text-slate-400 dark:text-brand-400 font-medium tracking-tight max-w-2xl">Gestão e criação de ativos digitais.</p>
                </motion.div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="h-12 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                        Criar Novo Produto
                    </button>
                </div>
            </div>



            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between px-2">
                <div className="relative w-full lg:max-w-xs">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-2xl border border-white/20 dark:border-white/5 bg-white/50 dark:bg-brand-900/40 backdrop-blur-3xl text-sm font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-violet-500/5 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                    />
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-brand-900/60 rounded-2xl border border-white/10 backdrop-blur-3xl overflow-x-auto w-full lg:w-auto scrollbar-hide">
                    {['Todos', 'Ativo', 'Rascunho'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s as any)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap",
                                filterStatus === s
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
                                    : "text-slate-500 hover:text-slate-800 dark:text-brand-400 dark:hover:text-white"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 lg:gap-12">
                <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={product.id}
                            className="glass dark:bg-brand-900/60 aspect-square rounded-[2rem] border border-white/20 dark:border-white/5 p-4 md:p-5 flex flex-col justify-between shadow-xl hover:shadow-violet-600/20 transition-all duration-700 group hover:-translate-y-2"
                        >
                            {/* Top: Photo & Basic Info side by side */}
                            <div className="flex gap-4 md:gap-8 items-start">
                                <div className="relative h-28 w-28 md:h-40 md:w-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-brand-950 shrink-0 shadow-lg">
                                    <img
                                        src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    {product.status !== 'Ativo' && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                            <XCircle size={24} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <div className={cn("h-1.5 w-1.5 rounded-full", product.status === 'Ativo' ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                        <span className="text-[8px] font-black text-slate-400 dark:text-brand-500 uppercase tracking-widest truncate">
                                            {product.category}
                                        </span>
                                    </div>
                                    <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white leading-tight tracking-tighter line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                        {product.name}
                                    </h3>
                                </div>
                            </div>

                            {/* Bottom Info Table (Compact) */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-black/30 border border-slate-100 dark:border-white/5">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-black text-slate-400 dark:text-brand-600 uppercase tracking-widest text-[0.6rem]">Preço</p>
                                        <p className="text-sm font-black text-violet-600 dark:text-brand-300 tabular-nums">
                                            {product.price.toLocaleString()} <span className="text-[8px] opacity-60">MZN</span>
                                        </p>
                                    </div>
                                    <div className="space-y-0.5 border-l border-slate-200 dark:border-white/10 pl-3">
                                        <p className="text-[8px] font-black text-slate-400 dark:text-brand-600 uppercase tracking-widest text-[0.6rem]">Vendas</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                            {product.sales}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(product)}
                                        className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-95 transition-all shadow-md"
                                    >
                                        <Edit2 size={14} />
                                        Editar
                                    </button>
                                    <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-brand-800 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-violet-600 transition-all shadow-sm">
                                        <Globe size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-brand-800 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-rose-500 transition-all shadow-sm"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-brand-900/90 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 dark:border-white/5 flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 lg:p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-brand-900/50 backdrop-blur-xl shrink-0">
                                <div>
                                    <h3 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        Configuração <span className="text-gradient">do Produto</span> {editingProduct ? '' : ''}
                                    </h3>
                                    <p className="text-xs lg:text-sm text-slate-400 dark:text-brand-400 font-medium tracking-tight mt-1">
                                        {editingProduct ? 'Sincronizando parâmetros do produto selecionado.' : 'Iniciando a criação de um novo produto digital.'}
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="h-10 w-10 rounded-full bg-slate-100 dark:bg-brand-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all transform hover:rotate-90"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-hide space-y-10">
                                <form id="asset-form" onSubmit={handleSubmit} className="space-y-10">
                                    {/* Section 1: Visual Identity */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-1 bg-violet-600 rounded-full" />
                                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Identidade Visual</h4>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                            {/* Image Upload Area */}
                                            <div className="lg:col-span-4">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Capa do Produto</label>
                                                <div className="relative group aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-brand-800 bg-slate-50/50 dark:bg-brand-950/50 overflow-hidden transition-all hover:border-violet-500/50 flex flex-col items-center justify-center">
                                                    {imagePreview ? (
                                                        <>
                                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setImagePreview(null)}
                                                                    className="h-12 w-12 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform"
                                                                >
                                                                    <Trash2 size={20} />
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer p-4 text-center group">
                                                            <div className="h-14 w-14 rounded-xl bg-white dark:bg-brand-800 shadow-2xl flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all duration-500">
                                                                <Upload size={24} />
                                                            </div>
                                                            <span className="text-[9px] font-black text-slate-500 dark:text-brand-400 uppercase tracking-widest leading-none">Imagem</span>
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Name & Description */}
                                            <div className="lg:col-span-8 space-y-6">
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nome do Produto</label>
                                                    <input
                                                        required
                                                        value={newName}
                                                        onChange={(e) => setNewName(e.target.value)}
                                                        placeholder="ex: Curso de Finanças"
                                                        className="w-full h-12 px-6 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-brand-950/50 text-sm font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-violet-500/10 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Descrição</label>
                                                    <textarea
                                                        required
                                                        value={newDescription}
                                                        onChange={(e) => setNewDescription(e.target.value)}
                                                        placeholder="Descreva os benefícios..."
                                                        className="w-full h-28 px-6 py-4 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-brand-950/50 text-sm font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-violet-500/10 outline-none transition-all placeholder:text-slate-300 resize-none shadow-inner"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Parameters */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-1 bg-violet-600 rounded-full" />
                                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Commercial Parameters</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Preço (MZN)</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-violet-500" size={18} />
                                                    <input
                                                        required
                                                        type="number"
                                                        value={newPrice}
                                                        onChange={(e) => setNewPrice(e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full h-12 pl-12 pr-6 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-brand-950/50 text-sm font-black text-slate-700 dark:text-white focus:ring-4 focus:ring-violet-500/10 outline-none transition-all tabular-nums"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">WhatsApp</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                                                    <input
                                                        required
                                                        value={newPhone}
                                                        onChange={(e) => setNewPhone(e.target.value)}
                                                        placeholder="84xxxxxxx"
                                                        className="w-full h-12 pl-12 pr-6 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-brand-950/50 text-sm font-black text-slate-700 dark:text-white focus:ring-4 focus:ring-violet-500/10 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Pixel ID</label>
                                                <div className="relative">
                                                    <Target className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500" size={18} />
                                                    <input
                                                        value={newPixel}
                                                        onChange={(e) => setNewPixel(e.target.value)}
                                                        placeholder="e.g. 123456789"
                                                        className="w-full h-12 pl-12 pr-6 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-brand-950/50 text-sm font-black text-slate-700 dark:text-white focus:ring-4 focus:ring-violet-500/10 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Página de Vendas</label>
                                                <div className="relative">
                                                    <Link2 className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                                                    <input
                                                        value={newSalesLink}
                                                        onChange={(e) => setNewSalesLink(e.target.value)}
                                                        placeholder="https://..."
                                                        className="w-full h-12 pl-12 pr-6 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-brand-950/50 text-xs font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-violet-500/10 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Categoria</label>
                                                <div className="relative">
                                                    <select
                                                        value={newCategory}
                                                        onChange={(e) => setNewCategory(e.target.value as Category)}
                                                        className="w-full h-12 px-6 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-brand-950/50 text-sm font-black text-slate-700 dark:text-white outline-none appearance-none cursor-pointer shadow-inner"
                                                    >
                                                        <option value="Ebook">Digital Monograph (E-book)</option>
                                                        <option value="Curso">Knowledge Stream (Course)</option>
                                                        <option value="Mentoria">Direct Guidance (Mentoring)</option>
                                                        <option value="Workshop">Live Sync (Workshop)</option>
                                                        <option value="Outro">Custom Logic (Other)</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Global Expansion */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-1 bg-violet-600 rounded-full" />
                                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Afiliação e Mercado</h4>
                                        </div>

                                        <div className="p-6 lg:p-8 rounded-[2rem] bg-gradient-to-br from-violet-600/10 via-fuchsia-600/5 to-transparent border border-violet-500/20 shadow-2xl space-y-8">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shrink-0">
                                                    <Globe size={28} className="animate-pulse" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter mb-1">Ativar Afiliação</h4>
                                                </div>
                                                <div className="ml-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsMarketplaceEnabled(!isMarketplaceEnabled)}
                                                        className={cn(
                                                            "w-16 h-8 rounded-full transition-all relative p-1 flex items-center",
                                                            isMarketplaceEnabled ? "bg-violet-600 shadow-violet-600/30" : "bg-slate-300 dark:bg-brand-800 shadow-inner"
                                                        )}
                                                    >
                                                        <motion.div
                                                            animate={{ x: isMarketplaceEnabled ? 32 : 0 }}
                                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                            className="h-6 w-6 bg-white rounded-full shadow-2xl"
                                                        />
                                                    </button>
                                                </div>
                                            </div>

                                            {isMarketplaceEnabled && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="pt-8 border-t border-violet-500/10 grid grid-cols-1 lg:grid-cols-2 gap-8"
                                                >
                                                    <div className="space-y-4">
                                                        <label className="text-[9px] font-black text-violet-600 dark:text-brand-300 uppercase tracking-widest px-1">Tipo de Afiliação</label>
                                                        <div className="flex p-1.5 bg-white/50 dark:bg-brand-950/50 rounded-2xl border border-violet-500/10 shadow-inner">
                                                            {(['Automatica', 'Manual'] as const).map((type) => (
                                                                <button
                                                                    key={type}
                                                                    type="button"
                                                                    onClick={() => setNewAffiliationType(type)}
                                                                    className={cn(
                                                                        "flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all",
                                                                        newAffiliationType === type
                                                                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
                                                                            : "text-slate-400 hover:text-slate-600"
                                                                    )}
                                                                >
                                                                    {type}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-end px-1">
                                                            <label className="text-[9px] font-black text-violet-600 dark:text-brand-300 uppercase tracking-widest">Comissão (%)</label>
                                                        </div>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={newCommission}
                                                                onChange={(e) => setNewCommission(e.target.value)}
                                                                className="w-full h-12 px-6 pr-12 rounded-xl border border-violet-500/20 bg-white/50 dark:bg-brand-950/50 text-lg font-black text-violet-600 dark:text-white focus:ring-4 focus:ring-violet-500/10 outline-none tabular-nums shadow-inner"
                                                            />
                                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">%</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 lg:p-8 border-t border-slate-100 dark:border-white/5 bg-white/50 dark:bg-brand-900/50 backdrop-blur-xl shrink-0 flex gap-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 h-14 px-8 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-brand-400 text-xs font-black uppercase tracking-[0.1em] hover:bg-slate-50 dark:hover:bg-brand-800 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    form="asset-form"
                                    type="submit"
                                    className="flex-[2] h-14 px-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                                >
                                    {editingProduct ? 'Guardar' : 'Criar Produto'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                onConfirm={confirmDelete}
                title="Apagar Produto?"
                description="Tem a certeza que deseja apagar este produto? Esta ação é irreversível e removerá o produto do mercado."
                confirmText="Apagar Agora"
                cancelText="Manter Produto"
                variant="danger"
            />
        </div >
    );
};
