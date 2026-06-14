// clear-data.js
// Script to delete all rows from Supabase tables except those belonging to the admin account.
// Run with: npm run clear-data

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'kingleakds@gmail.com';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  console.error('❌ Supabase URL is not configured. Check .env variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = [
  { name: 'transactions', column: 'customer_email' },
  { name: 'products', column: 'owner_email' },
  { name: 'affiliate_requests', column: 'owner_email' },
  { name: 'coupons', column: 'owner_email' },
  { name: 'marketing_campaigns', column: 'owner_email' },
];

async function clearTable({ name, column }) {
  try {
    const { data, error } = await supabase
      .from(name)
      .delete()
      .neq(column, ADMIN_EMAIL);
    if (error) {
      console.error(`❌ Error clearing ${name}:`, error.message);
    } else {
      console.log(`✅ ${name}: ${data?.length ?? 0} rows removed`);
    }
  } catch (e) {
    console.error(`⚡ Unexpected error on ${name}:`, e);
  }
}

async function main() {
  console.log('🔧 Starting data cleanup, preserving admin records...');
  for (const tbl of tables) {
    await clearTable(tbl);
  }
  console.log('✅ Cleanup complete.');
}

main();
