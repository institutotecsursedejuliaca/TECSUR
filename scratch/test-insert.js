const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zutuvuioyppqrrmfyylh.supabase.co';
const supabaseAnonKey = 'SUPABASE_SERVICE_ROLE_KEY'; // Let's use the service role key to bypass RLS if any
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dHV2dWlveXBwcXJybWZ5eWxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjMwNTc5NSwiZXhwIjoyMDk3ODgxNzk1fQ.RtIe9oMGlzO_VwuD2q2OG5AILunVTrOfMAlLBQvhTHs';

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log('Attempting to insert a mock pension record with concepto...');
  
  // We need a valid alumno_id and modulo_id to insert if there are foreign keys.
  // Let's first fetch a valid alumno and modulo.
  const { data: alumno } = await supabase.from('alumnos').select('id').limit(1).single();
  const { data: modulo } = await supabase.from('modulos').select('id').limit(1).single();

  if (!alumno || !modulo) {
    console.error('Could not find any alumno or modulo in the database to link to.');
    return;
  }

  console.log(`Using alumno_id: ${alumno.id}, modulo_id: ${modulo.id}`);

  const mockRecord = {
    alumno_id: alumno.id,
    modulo_id: modulo.id,
    nro_recibo: 'TEST-RECIBO-999',
    monto_pagado: 100.0,
    deuda_pendiente: 0.0,
    fecha_pago: '2026-07-13',
    concepto: 'PENSION',
    detalles: 'Test details'
  };

  const { data, error } = await supabase
    .from('pensiones')
    .insert([mockRecord])
    .select();

  if (error) {
    console.error('Error inserting pension record:', error);
  } else {
    console.log('Successfully inserted record:', data);
    
    // Let's clean up the test record
    const { error: deleteError } = await supabase
      .from('pensiones')
      .delete()
      .eq('nro_recibo', 'TEST-RECIBO-999');
    
    if (deleteError) {
      console.error('Error deleting test record:', deleteError);
    } else {
      console.log('Test record cleaned up successfully.');
    }
  }
}

run().catch(console.error);
