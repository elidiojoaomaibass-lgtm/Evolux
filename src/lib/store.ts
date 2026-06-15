import { useState, useEffect } from 'react';
// import { clearLocalDataIfNotAdmin } from './clearLocalData'; // removed unused import
import { supabase } from './supabase';
import { toast } from 'sonner';






export const sendLocalNotification = (title: string, options?: NotificationOptions) => {
    // Always show a toast in-app (styled by sonner)
    if (title.includes('Erro') || title.includes('Falha')) {
        toast.error(title, { description: options?.body });
    } else {
        toast.success(title, { description: options?.body });
    }

    // Try to send native browser notification for background/away state
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    reg.showNotification(title, options);
                } else {
                    new Notification(title, options);
                }
            }).catch(() => {
                new Notification(title, options);
            });
        } else {
            new Notification(title, options);
        }
    }
};

// Shared type definitions
export type ProductType = 'Digital' | 'Fisico' | 'Serviço';
export type Category = 'Ebook' | 'Curso' | 'Mentoria' | 'Workshop' | 'Outro';


    export interface Product {
    id: string;
    name: string;
    type: ProductType;
    category: Category;
    price: number;
    sales: number;
    revenue: number;
    status: 'Ativo' | 'Rascunho' | 'Arquivado';
    description?: string;
    phone?: string;
    salesLink?: string;
    pixel?: string;
    isMarketplaceEnabled: boolean;
    commission: number; // Percentage (0-100)
    affiliationType: 'Automatica' | 'Manual';
    image?: string;
    deliveryLink?: string; // New field for product deliverable link
    enableCountdown?: boolean; // New field to activate countdown timer
    enableScarcity?: boolean; // New field to toggle scarcity notifications
    enableScarcityNotification?: boolean; // Legacy field
    barColor?: string; // New field for countdown bar color (hex or preset)
    createdAt: string;
}

// Initial Mock Data (Empty for production)


// Simple Event Emitter with LocalStorage persistence
const STORAGE_KEY = 'evolux_prod_products';

const getInitialProducts = (): Product[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse products from localStorage', e);
        }
    }
    return [];
};

let globalProducts = getInitialProducts();
const listeners = new Set<(products: Product[]) => void>();

export const useProductsStore = () => {
    const [products, setProducts] = useState<Product[]>(globalProducts);

    // Fetch products from Supabase on mount and listen for changes
    useEffect(() => {
        const listener = (newProducts: Product[]) => setProducts(newProducts);
        listeners.add(listener);

        const fetchProducts = async () => {
            try {
                const { data: sess } = await supabase.auth.getSession();
                const userEmail = sess?.session?.user?.email;
                const ADMIN_EMAIL = 'kingleakds@gmail.com';
                let query = supabase.from('products').select('*');
                if (userEmail && userEmail !== ADMIN_EMAIL) {
                    query = query.eq('user_email', userEmail);
                }
                const { data, error } = await query;
                if (error) throw error;
                if (data && data.length > 0) {
                    const productsData = data as Product[];
                    // Update global and local storage
                    globalProducts = productsData;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalProducts));
                    listeners.forEach(l => l(globalProducts));
                } else {
                    // Fallback to localStorage if remote empty
                    const local = getInitialProducts();
                    if (local.length > 0) {
                        globalProducts = local;
                        listeners.forEach(l => l(globalProducts));
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch products from Supabase, using local storage:', e);
                // Ensure local fallback
                const local = getInitialProducts();
                if (local.length > 0) {
                    globalProducts = local;
                    listeners.forEach(l => l(globalProducts));
                }
            }
        };
        fetchProducts();

        return () => {
            listeners.delete(listener);
        };
    }, []);

    const updateProducts = (newProducts: Product[]) => {
        globalProducts = newProducts;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(globalProducts));
        listeners.forEach(l => l(globalProducts));
    };

    const addProduct = async (product: Product) => {
        // Primeiro insere no Supabase e só depois atualiza o estado local
        try {
          const { data: sess } = await supabase.auth.getSession();
          const userEmail = sess?.session?.user?.email;
          const ADMIN_EMAIL = 'kingleakds@gmail.com';
          await supabase.from('products').insert({
            ...product,
            user_email: userEmail ?? ADMIN_EMAIL
          });
          // Inserção bem-sucedida: atualiza o estado local e notifica
          updateProducts([product, ...globalProducts]);
          sendLocalNotification('📦 Novo Produto Submetido!', {
            body: `O produto "${product.name}" foi enviado com sucesso.`,
            icon: '/logo.png'
          });
        } catch (e) {
          console.warn('Failed to insert product into Supabase:', e);
          // Opcional: notificar falha ao usuário
          sendLocalNotification('⚠️ Falha ao salvar produto', {
            body: `Não foi possível salvar o produto "${product.name}". Verifique sua conexão.`,
            icon: '/logo.png'
          });
        }
    };

    const deleteProduct = async (id: string) => {
        // Primeiro remove do Supabase e, se bem-sucedido, atualiza o estado local
        try {
          await supabase.from('products').delete().eq('id', id);
          // Remoção bem-sucedida: atualiza local
          updateProducts(globalProducts.filter(p => p.id !== id));
        } catch (e) {
          console.warn('Failed to delete product from Supabase:', e);
          sendLocalNotification('⚠️ Falha ao remover produto', {
            body: `Não foi possível remover o produto.`,
            icon: '/logo.png'
          });
        }
    };

    const editProduct = async (updatedProduct: Product) => {
        const oldProduct = globalProducts.find(p => p.id === updatedProduct.id);
        updateProducts(globalProducts.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
        if (oldProduct && oldProduct.status !== 'Ativo' && updatedProduct.status === 'Ativo') {
            sendLocalNotification('✅ Produto Aprovado!', {
                body: `O produto "${updatedProduct.name}" agora está Ativo.`,
                icon: '/logo.png'
            });
        }
        // Primeiro atualiza no Supabase e, se bem-sucedido, sincroniza estado local
        try {
          await supabase.from('products').update(updatedProduct).eq('id', updatedProduct.id);
          // Atualização bem-sucedida: sincroniza local
          updateProducts(globalProducts.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
          if (oldProduct && oldProduct.status !== 'Ativo' && updatedProduct.status === 'Ativo') {
            sendLocalNotification('✅ Produto Aprovado!', {
              body: `O produto "${updatedProduct.name}" agora está Ativo.`,
              icon: '/logo.png'
            });
          }
        } catch (e) {
          console.warn('Failed to update product in Supabase:', e);
          sendLocalNotification('⚠️ Falha ao editar produto', {
            body: `Não foi possível atualizar o produto "${updatedProduct.name}".`,
            icon: '/logo.png'
          });
        }    };

    return { products, addProduct, deleteProduct, editProduct, updateProducts };
};

// --- Affiliates Store ---

export interface AffiliateRequest {
    id: string;
    productId: string;
    productName: string;
    userName: string;
    userEmail: string;
    status: 'Pendente' | 'Aprovado' | 'Rejeitado';
    requestedAt: string;
    commission: number;
}

const AFFILIATES_STORAGE_KEY = 'evolux_prod_affiliate_requests';

const initialRequests: AffiliateRequest[] = [];

const getInitialRequests = (): AffiliateRequest[] => {
    const stored = localStorage.getItem(AFFILIATES_STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse requests from localStorage', e);
        }
    }
    return initialRequests;
};

let globalRequests = getInitialRequests();
const requestListeners = new Set<(requests: AffiliateRequest[]) => void>();

export const useAffiliatesStore = () => {
    const [requests, setRequests] = useState<AffiliateRequest[]>(globalRequests);

    useEffect(() => {
        const listener = (newRequests: AffiliateRequest[]) => setRequests(newRequests);
        requestListeners.add(listener);
        return () => {
            requestListeners.delete(listener);
        };
    }, []);

    const updateRequests = (newRequests: AffiliateRequest[]) => {
        globalRequests = newRequests;
        localStorage.setItem(AFFILIATES_STORAGE_KEY, JSON.stringify(globalRequests));
        requestListeners.forEach(l => l(globalRequests));
    };

    const addRequest = (request: Omit<AffiliateRequest, 'id' | 'requestedAt' | 'status'>) => {
        const newReq: AffiliateRequest = {
            ...request,
            id: `REQ-${Math.floor(Math.random() * 10000)}`,
            requestedAt: new Date().toISOString().split('T')[0],
            status: 'Pendente'
        };
        updateRequests([newReq, ...globalRequests]);
    };

    const approveRequest = (id: string) => {
        updateRequests(globalRequests.map(r => r.id === id ? { ...r, status: 'Aprovado' } : r));
    };

    const rejectRequest = (id: string) => {
        updateRequests(globalRequests.map(r => r.id === id ? { ...r, status: 'Rejeitado' } : r));
    };

    return { requests, addRequest, approveRequest, rejectRequest };
};

// --- Marketing Store ---

export interface Coupon {
  // New flag to control scarcity notification toggle
  enableScarcity?: boolean;
    id: string;
    code: string;
    discount: number;
    type: 'Percentage' | 'Fixed';
    productId: string; // "all" or specific PRD-ID
    status: 'Ativo' | 'Inativo';
    uses: number;
}

export interface MarketingCampaign {
    id: string;
    name: string;
    type: 'Email' | 'Whatsapp' | 'Ads';
    status: 'Ativo' | 'Pausado';
    leads: number;
    conversions: number;
    spend: number;
}

const COUPONS_STORAGE_KEY = 'evolux_prod_coupons';
const CAMPAIGNS_STORAGE_KEY = 'evolux_prod_campaigns';

const initialCoupons: Coupon[] = [];

const initialCampaigns: MarketingCampaign[] = [];

export const useMarketingStore = () => {
    const [coupons, setCoupons] = useState<Coupon[]>(() => {
        const stored = localStorage.getItem(COUPONS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : initialCoupons;
    });

    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(() => {
        const stored = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : initialCampaigns;
    });

    useEffect(() => {
        localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
    }, [coupons]);

    useEffect(() => {
        localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
    }, [campaigns]);

    const addCoupon = (coupon: Omit<Coupon, 'id' | 'uses'>) => {
        const newCoupon: Coupon = {
            ...coupon,
            id: `CPN-${Math.floor(Math.random() * 10000)}`,
            uses: 0
        };
        setCoupons([newCoupon, ...coupons]);
    };

    const deleteCoupon = (id: string) => {
        setCoupons(coupons.filter(c => c.id !== id));
    };

    const addCampaign = (campaign: Omit<MarketingCampaign, 'id' | 'leads' | 'conversions'>) => {
        const newCamp: MarketingCampaign = {
            ...campaign,
            id: `CMP-${Math.floor(Math.random() * 10000)}`,
            leads: 0,
            conversions: 0
        };
        setCampaigns([newCamp, ...campaigns]);
    };

    return { coupons, addCoupon, deleteCoupon, campaigns, addCampaign };
};

// --- Transactions Store ---

export interface Transaction {
    id: string;
    type: 'payment' | 'withdrawal';
    amount: number;
    phone: string;
    method: 'M-Pesa' | 'e-Mola';
    status: 'Pendente' | 'Concluído' | 'Falhou';
    reference: string;
    description?: string;
    customerName?: string;
    customerEmail?: string;
    createdAt: string;
    device?: 'Mobile' | 'Desktop';
}

const TRANSACTIONS_STORAGE_KEY = 'evolux_prod_transactions';

const getInitialTransactions = (): Transaction[] => {
    const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse transactions', e);
        }
    }
    return [];
};

let globalTransactions = getInitialTransactions();
const transactionListeners = new Set<(txs: Transaction[]) => void>();

export const useTransactionsStore = () => {
    const [transactions, setTransactions] = useState<Transaction[]>(globalTransactions);

    const updateTransactions = (newTxs: Transaction[]) => {
        globalTransactions = newTxs;
        localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(globalTransactions));
        transactionListeners.forEach(l => l(globalTransactions));
    };

    useEffect(() => {
        const listener = (newTxs: Transaction[]) => setTransactions(newTxs);
        transactionListeners.add(listener);

        console.log('Supabase client initialized:', supabase);

        const fetchTransactions = async () => {
            try {
                // Determine user email for scoping
                const { data: sess } = await supabase.auth.getSession();
                const userEmail = sess?.session?.user?.email;
                const ADMIN_EMAIL = 'kingleakds@gmail.com';
                let query = supabase.from('transactions').select('*').order('createdat', { ascending: false });
                if (userEmail && userEmail !== ADMIN_EMAIL) {
                    query = query.eq('customer_email', userEmail);
                }
                const { data, error } = await query;
                console.log('Supabase fetch result:', { data, error });
                
                if (error) {
                    throw error;
                }
                if (data && data.length > 0) {
                    const mapped = data.map((tx: any) => ({
                        ...tx,
                        createdAt: tx.createdAt || tx.created_at || tx.createdat
                    }));
                    updateTransactions(mapped);
                } else {
                    // Se estiver vazio no Supabase, tenta carregar as transações locais salvas
                    const local = getInitialTransactions();
                    if (local.length > 0) {
                        updateTransactions(local);
                    }
                }
            } catch (err) {
                console.warn('Erro ao conectar ao Supabase (usando localStorage como backup offline):', err);
                // Carrega transações offline salvas em localStorage
                const local = getInitialTransactions();
                updateTransactions(local);
            }
        };

        fetchTransactions();

        // Inscreve no canal em tempo real para escutar atualizações de transações
        let channel: any = null;
        try {
            channel = supabase
                .channel('public-transactions-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload: any) => {
                    console.log('Realtime transaction update:', payload);
                    fetchTransactions();
                    
                    // Trigger System Notification for Payments
                    if (payload.eventType === 'INSERT' && payload.new.type === 'payment' && payload.new.status === 'Concluído') {
                        const val = Number(payload.new.amount).toLocaleString('pt-PT');
                        // const method = payload.new.method || 'Evolux Pay'; // removed unused variable
                        sendLocalNotification('Você recebeu um novo pedido! 🎉', {
                            body: `Venda aprovada de ${val} MT ${payload.new.method}`,
                            icon: '/logo.png'
                        });
                    } else if (payload.eventType === 'UPDATE' && payload.new.type === 'payment' && payload.old?.status !== 'Concluído' && payload.new.status === 'Concluído') {
                        const val = Number(payload.new.amount).toLocaleString('pt-PT');
                        // const method = payload.new.method || 'Evolux Pay'; // removed unused variable
                        sendLocalNotification('Você recebeu um novo pedido! 🎉', {
                            body: `Venda aprovada de ${val} MT ${payload.new.method}`,
                            icon: '/logo.png'
                        });
                    }
                    
                    // Trigger System Notification for Withdrawals
                    if (payload.eventType === 'UPDATE' && payload.new.type === 'withdrawal' && payload.old.status !== 'Concluído' && payload.new.status === 'Concluído') {
                        const val = Number(payload.new.amount).toLocaleString('pt-PT');
                        sendLocalNotification('💸 Saque Aprovado!', {
                            body: `O seu saque de ${val} MZN foi concluído com sucesso.`,
                            icon: '/logo.png'
                        });
                    }
                })
                .subscribe();
        } catch (e) {
            console.warn('Falha ao assinar canal em tempo real do Supabase:', e);
        }

        // Auto-aprovação: verifica pendentes a cada 30s e aprova os que têm +2 minutos
        const autoApprove = async () => {
            const now = new Date();
            const pending = globalTransactions.filter(t => t.status === 'Pendente' && t.type === 'payment');
            for (const tx of pending) {
                const created = new Date(tx.createdAt);
                const diffMs = now.getTime() - created.getTime();
                if (diffMs >= 2 * 60 * 1000) { // 2 minutos
                    // Atualiza localmente
                    const updated = globalTransactions.map(t =>
                        t.id === tx.id ? { ...t, status: 'Concluído' as const } : t
                    );
                    updateTransactions(updated);
                    // Atualiza no Supabase
                    try {
                        await supabase
                            .from('transactions')
                            .update({ status: 'Concluído' })
                            .eq('id', tx.id);
                    } catch (e) {
                        console.warn('Erro ao aprovar transação no Supabase:', e);
                    }
                }
            }
        };

        // Roda imediatamente ao carregar (resolve pendentes antigas)
        autoApprove();
        // Depois roda a cada 30 segundos
        const approvalInterval = setInterval(autoApprove, 30 * 1000);

        // Recarrega transações ao voltar ao aplicativo (ex: no celular quando sai de segundo plano)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('App returned to foreground, refreshing transactions...');
                fetchTransactions();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            transactionListeners.delete(listener);
            clearInterval(approvalInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (channel) {
                try {
                    supabase.removeChannel(channel);
                } catch (e) {}
            }
        };
    }, []);

    const addTransaction = async (tx: Omit<Transaction, 'createdAt'>) => {
        const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const newTx: Transaction = {
            ...tx,
            device: tx.device || (isMobile ? 'Mobile' : 'Desktop'),
            createdAt: new Date().toISOString()
        };
        
        // Atualização otimista local
        updateTransactions([newTx, ...globalTransactions]);
        
        // Notifications
        if (newTx.type === 'withdrawal') {
            const val = Number(newTx.amount).toLocaleString('pt-PT');
            sendLocalNotification('🏦 Saque Solicitado!', {
                body: `Sua solicitação de saque de ${val} MZN foi enviada.`,
                icon: '/logo.png'
            });
        }

        // Grava no Supabase de forma assíncrona
        try {
            const { error } = await supabase
                .from('transactions')
                .insert([{
                    id: newTx.id,
                    type: newTx.type,
                    amount: newTx.amount,
                    phone: newTx.phone,
                    method: newTx.method,
                    status: newTx.status,
                    reference: newTx.reference,
                    description: newTx.description,
                    customerName: newTx.customerName,
                    customerEmail: newTx.customerEmail,
                    device: newTx.device,
                    createdat: newTx.createdAt
                }]);
            if (error) {
                console.warn('Erro ao inserir transação no Supabase:', error);
            }
        } catch (err) {
            console.warn('Falha de rede ao persistir transação no Supabase (salva apenas localmente):', err);
        }
    };

    const updateTransactionStatus = async (id: string, status: Transaction['status']) => {
        const tx = globalTransactions.find(t => t.id === id);
        const updated = globalTransactions.map(t =>
            t.id === id ? { ...t, status } : t
        );
        updateTransactions(updated);
        
        // Local Notification for withdrawal approval if not coming from realtime
        if (tx && tx.type === 'withdrawal' && tx.status !== 'Concluído' && status === 'Concluído') {
            const val = Number(tx.amount).toLocaleString('pt-PT');
            sendLocalNotification('💸 Saque Aprovado!', {
                body: `O seu saque de ${val} MZN foi concluído com sucesso.`,
                icon: '/logo.png'
            });
        }
        try {
            await supabase
                .from('transactions')
                .update({ status })
                .eq('id', id);
        } catch (e) {
            console.warn('Erro ao atualizar status no Supabase:', e);
        }
    };

    return { transactions, addTransaction, updateTransactionStatus };
};
