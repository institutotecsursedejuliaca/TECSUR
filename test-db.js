const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zutuvuioyppqrrmfyylh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dHV2dWlveXBwcXJybWZ5eWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDU3OTUsImV4cCI6MjA5Nzg4MTc5NX0._kxOI5HLViSRPoiO0LiHC4oHmSYP_cS5uLRmFgOliPc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing connection to Supabase...');
  
  console.log('\n--- 1. Testing carreras table select ---');
  const { data: carreras, error: carrerasError } = await supabase.from('carreras').select('*');
  if (carrerasError) {
    console.error('Error fetching carreras:', carrerasError);
  } else {
    console.log('Carreras count:', carreras.length);
    console.log('Carreras data:', carreras);
  }

  console.log('\n--- 2. Testing docentes table select ---');
  const { data: docentes, error: docentesError } = await supabase.from('docentes').select('*');
  if (docentesError) {
    console.error('Error fetching docentes:', docentesError);
  } else {
    console.log('Docentes count:', docentes.length);
    console.log('Docentes data:', docentes);
  }

  console.log('\n--- 3. Testing auth login simulation ---');
  // Attempting a dummy sign in to check GoTrue connection/schema error
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'institutotecsursedejuliaca@gmail.com',
    password: 'huaraya_2018',
  });
  if (signInError) {
    console.error('Error signing in:', signInError);
  } else {
    console.log('Sign in successful! User ID:', signInData.user.id);
  }
}

run().catch(console.error);
