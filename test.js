import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cxcncoexhlfihfvfgvld.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4Y25jb2V4aGxmaWhmdmZndmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDcyODksImV4cCI6MjA4OTYyMzI4OX0.2jdcswTURFSNFXAN3ajWDUdANcja1qgrYcqAjm9Ge3M'
);

async function check() {
  const { data } = await supabase.from('transactions').select('*').limit(1);
  console.log(Object.keys(data[0] || {}));
}

check();
