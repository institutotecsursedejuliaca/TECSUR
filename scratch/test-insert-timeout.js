const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zutuvuioyppqrrmfyylh.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dHV2dWlveXBwcXJybWZ5eWxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjMwNTc5NSwiZXhwIjoyMDk3ODgxNzk1fQ.RtIe9oMGlzO_VwuD2q2OG5AILunVTrOfMAlLBQvhTHs';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function run() {
  console.log('Fetching identifiers...');
  const { data: alumno, error: errA } = await supabase.from('alumnos').select('id').limit(1).single();
  const { data: modulo, error: errM } = await supabase.from('modulos').select('id').limit(1).single();

  if (errA) console.error('Error fetching alumno:', errA);
  if (errM) console.error('Error fetching modulo:', errM);

  if (!alumno || !modulo) {
    console.error('Could not find any alumno or modulo in the database to link to.');
    process.exit(1);
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

  console.log('Sending insert query to supabase...');
  const res = await supabase
    .from('pensiones')
    .insert([mockRecord])
    .select();

  console.log('Query result:');
  if (res.error) {
    console.error('Insert error details:', JSON.stringify(res.error, null, 2));
  } else {
    console.log('Insert success. Data returned:', res.data);
    
    console.log('Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('pensiones')
      .delete()
      .eq('nro_recibo', 'TEST-RECIBO-999');
    if (deleteError) {
      console.error('Delete error:', deleteError);
    } else {
      console.log('Deleted successfully.');
    }
  }
  process.exit(0);
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
