const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://cxcncoexhlfihfvfgvld.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4Y25jb2V4aGxmaWhmdmZndmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDcyODksImV4cCI6MjA4OTYyMzI4OX0.2jdcswTURFSNFXAN3ajWDUdANcja1qgrYcqAjm9Ge3M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .limit(10);
  console.log("Settings Error:", error);
  console.log("Settings Data:", JSON.stringify(data, null, 2));
}
run();
