const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zutuvuioyppqrrmfyylh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dHV2dWlveXBwcXJybWZ5eWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDU3OTUsImV4cCI6MjA5Nzg4MTc5NX0._kxOI5HLViSRPoiO0LiHC4oHmSYP_cS5uLRmFgOliPc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Querying table administradores...');
  const { data, error } = await supabase.from('administradores').select('*');
  if (error) {
    console.error('Error selecting from administradores:', error);
  } else {
    console.log('Selection successful! Count:', data.length);
    console.log('Data:', data);
  }
}

run();
