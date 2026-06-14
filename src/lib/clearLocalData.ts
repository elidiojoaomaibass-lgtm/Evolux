/* src/lib/clearLocalData.ts */
import { supabase } from './supabase';

/**
 * Remove all locally persisted store data for accounts that are not the admin.
 * This is executed once on app startup.
 */
export const clearLocalDataIfNotAdmin = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email;
    const ADMIN_EMAIL = 'kingleakds@gmail.com';

    if (userEmail && userEmail !== ADMIN_EMAIL) {
      const keys = [
        'evolux_prod_products',
        'evolux_prod_affiliate_requests',
        'evolux_prod_coupons',
        'evolux_prod_campaigns',
        'evolux_prod_transactions',
      ];
      keys.forEach((k) => localStorage.removeItem(k));
      console.log('🧹 Dados locais removidos para conta não‑admin:', userEmail);
    }
  } catch (e) {
    console.warn('Failed to clear local data:', e);
  }
};
