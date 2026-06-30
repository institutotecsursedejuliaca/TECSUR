const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zutuvuioyppqrrmfyylh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dHV2dWlveXBwcXJybWZ5eWxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjMwNTc5NSwiZXhwIjoyMDk3ODgxNzk1fQ.RtIe9oMGlzO_VwuD2q2OG5AILunVTrOfMAlLBQvhTHs';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: class DummyWebSocket {}
  }
});

async function run() {
  const email = 'institutotecsursedejuliaca@gmail.com';
  const password = 'huaraya_2018';

  console.log(`Creating admin user: ${email}...`);
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {}
  });

  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('User created successfully via GoTrue API!');
    console.log('User ID:', data.user.id);
  }
}

run().catch(console.error);
