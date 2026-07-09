const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zutuvuioyppqrrmfyylh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dHV2dWlveXBwcXJybWZ5eWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDU3OTUsImV4cCI6MjA5Nzg4MTc5NX0._kxOI5HLViSRPoiO0LiHC4oHmSYP_cS5uLRmFgOliPc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Fetching all courses...');
  const { data: cursos, error } = await supabase.from('cursos').select('*, modulos(nombre)');
  if (error) {
    console.error(error);
    return;
  }
  console.log(`Total courses in database: ${cursos.length}`);
  cursos.forEach(c => {
    console.log(`ID: ${c.id}, Nombre: ${c.nombre}, Modulo ID: ${c.modulo_id}, Modulo Nombre: ${c.modulos?.nombre || 'None'}`);
  });
}

run().catch(console.error);
