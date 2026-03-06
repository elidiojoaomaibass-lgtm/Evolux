
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

// Initial Mock Data
const initialProducts: Product[] = [
    {
        id: 'PRD-001',
        name: 'Pack VIP Gold - Mentoria',
        type: 'Digital',
        category: 'Mentoria',
        price: 4500,
        sales: 124,
        revenue: 558000,
        status: 'Ativo',
        isMarketplaceEnabled: true,
        commission: 60,
        affiliationType: 'Automatica',
        createdAt: '2024-02-10',
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop'
    },
    {
        id: 'PRD-002',
        name: 'Curso de Trading Pro',
        type: 'Digital',
        category: 'Curso',
        price: 15000,
        sales: 42,
        revenue: 630000,
        status: 'Ativo',
        isMarketplaceEnabled: true,
        commission: 40,
        affiliationType: 'Manual',
        createdAt: '2024-02-15',
        image: 'https://images.unsplash.com/photo-1611974717424-c6843d1cc600?w=100&h=100&fit=crop'
    },
    {
        id: 'PRD-003',
        name: 'Ebook: Marketing Digital 2024',
        type: 'Digital',
        category: 'Ebook',
        price: 1200,
        sales: 856,
        revenue: 1027200,
        status: 'Ativo',
        isMarketplaceEnabled: true,
        commission: 50,
        affiliationType: 'Automatica',
        createdAt: '2024-01-20',
        image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=100&h=100&fit=crop'
    },
    {
        id: 'PRD-004',
        name: 'Workshop Presencial Maputo',
        type: 'Serviço',
        category: 'Workshop',
        price: 3500,
        sales: 25,
        revenue: 87500,
        status: 'Rascunho',
        isMarketplaceEnabled: false,
        commission: 30,
        affiliationType: 'Manual',
        createdAt: '2024-02-25',
    }
];

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

const initialRequests: AffiliateRequest[] = [
    {
        id: 'REQ-001',
        productId: 'PRD-002',
        productName: 'Curso de Trading Pro',
        userName: 'Elidio Maibasse',
        userEmail: 'elidio@gmail.com',
        status: 'Pendente',
        requestedAt: '2024-02-26',
        commission: 40
    }
];

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

const initialCoupons: Coupon[] = [
    { id: 'CPN-001', code: 'BEMVINDO10', discount: 10, type: 'Percentage', productId: 'all', status: 'Ativo', uses: 42 },
    { id: 'CPN-002', code: 'EXTRAPRO20', discount: 200, type: 'Fixed', productId: 'PRD-002', status: 'Ativo', uses: 15 }
];

const initialCampaigns: MarketingCampaign[] = [
    { id: 'CMP-001', name: 'Lançamento Ebook', type: 'Email', status: 'Ativo', leads: 450, conversions: 24, spend: 0 },
    { id: 'CMP-002', name: 'Tráfego Pago FB', type: 'Ads', status: 'Ativo', leads: 1200, conversions: 56, spend: 2500 }
];

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
