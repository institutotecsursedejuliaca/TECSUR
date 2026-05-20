import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types matching the DB schema
export interface Alumno {
  id: string
  dni: string
  nombres: string
  apellidos: string
  carrera: string
  // Datos personales
  fecha_nacimiento?: string | null
  nac_distrito?: string | null
  nac_provincia?: string | null
  nac_departamento?: string | null
  // Domicilio
  direccion?: string | null
  dir_distrito?: string | null
  dir_referencia?: string | null
  // Contacto
  telefono?: string | null
  celular?: string | null
  correo?: string | null
  facebook?: string | null
  // Colegio
  colegio?: string | null
  colegio_distrito?: string | null
  // Apoderado
  apoderado_nombre?: string | null
  apoderado_parentesco?: string | null
  apoderado_celular?: string | null
}

export interface Modulo {
  id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  modalidad: 'presencial' | 'virtual'
  duracion: number
}

export interface Matricula {
  id: string
  alumno_id: string
  modulo_id: string
  fecha_registro: string
  alumnos?: Alumno
  modulos?: Modulo
}

export interface Nota {
  id: string
  matricula_id: string
  inspeccion: number | null
  mantenimiento: number | null
  sistema_hidraulico: number | null
  seguridad: number | null
  ingles: number | null
  operacion: number | null
  promedio: number | null
  asistencia_total: number | null
}

export interface Pension {
  id: string
  alumno_id: string
  modulo_id: string
  nro_recibo: string
  monto_pagado: number
  deuda_pendiente: number
  fecha_pago: string
  alumnos?: Alumno
  modulos?: Modulo
}

export interface Ingreso {
  id: string
  dni_alumno: string
  fecha_ingreso: string
  hora_ingreso: string
  created_at: string
  alumnos?: Pick<Alumno, 'nombres' | 'apellidos' | 'carrera'>
}
