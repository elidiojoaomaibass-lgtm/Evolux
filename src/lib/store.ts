
import { useState, useEffect } from 'react';

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
    createdAt: string;
}

// Initial Mock Data (Empty for production)
const initialProducts: Product[] = [];

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
    return initialProducts;
};

let globalProducts = getInitialProducts();
const listeners = new Set<(products: Product[]) => void>();

export const useProductsStore = () => {
    const [products, setProducts] = useState<Product[]>(globalProducts);

    useEffect(() => {
        const listener = (newProducts: Product[]) => setProducts(newProducts);
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    const updateProducts = (newProducts: Product[]) => {
        globalProducts = newProducts;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(globalProducts));
        listeners.forEach(l => l(globalProducts));
    };

    const addProduct = (product: Product) => {
        updateProducts([product, ...globalProducts]);
    };

    const deleteProduct = (id: string) => {
        updateProducts(globalProducts.filter(p => p.id !== id));
    };

    const editProduct = (updatedProduct: Product) => {
        updateProducts(globalProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };

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
    createdAt: string;
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

    useEffect(() => {
        const listener = (newTxs: Transaction[]) => setTransactions(newTxs);
        transactionListeners.add(listener);
        return () => {
            transactionListeners.delete(listener);
        };
    }, []);

    const updateTransactions = (newTxs: Transaction[]) => {
        globalTransactions = newTxs;
        localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(globalTransactions));
        transactionListeners.forEach(l => l(globalTransactions));
    };

    const addTransaction = (tx: Omit<Transaction, 'createdAt'>) => {
        const newTx: Transaction = {
            ...tx,
            createdAt: new Date().toISOString()
        };
        updateTransactions([newTx, ...globalTransactions]);
    };

    return { transactions, addTransaction };
};
