import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// La sesión de Supabase se almacena en localStorage (client-side),
// por lo que la verificación de autenticación se hace en el componente
// del dashboard con useEffect. Este proxy solo deja pasar las peticiones.
export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
