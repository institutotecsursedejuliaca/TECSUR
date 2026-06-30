const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zutuvuioyppqrrmfyylh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dHV2dWlveXBwcXJybWZ5eWxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjMwNTc5NSwiZXhwIjoyMDk3ODgxNzk1fQ.RtIe9oMGlzO_VwuD2q2OG5AILunVTrOfMAlLBQvhTHs';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log('Listing users using admin API...');
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
  } else {
    console.log('Users found:', users.length);
    console.log('User details:', JSON.stringify(users, null, 2));
  }
}

run().catch(console.error);
