const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zutuvuioyppqrrmfyylh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dHV2dWlveXBwcXJybWZ5eWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDU3OTUsImV4cCI6MjA5Nzg4MTc5NX0._kxOI5HLViSRPoiO0LiHC4oHmSYP_cS5uLRmFgOliPc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Inserting default admins into table administradores...');
  const legacyAdmins = [
    { email: 'admin@tecsur.edu.pe', nombres: 'Administrador', apellidos: 'General' },
    { email: 'hhuarayachipana@gmail.com', nombres: 'Henry', apellidos: 'Huaraya' },
    { email: 'administrador@tecsur.com.pe', nombres: 'Soporte', apellidos: 'TECSUR' },
    { email: 'institutotecsursedejuliaca@gmail.com', nombres: 'Intranet', apellidos: 'TECSUR' }
  ];

  const { data, error } = await supabase
    .from('administradores')
    .upsert(legacyAdmins, { onConflict: 'email' })
    .select();

  if (error) {
    console.error('Error inserting default admins:', error);
  } else {
    console.log('Insertion successful! Data inserted:', data);
  }
}

run();
