# Instrucciones para el Agente: Generación del Manual de Usuario y Guía de Base de Datos

Copia y pega el contenido completo de este documento en un nuevo chat con cualquier asistente de IA (o en este mismo chat) para que genere los documentos listos para entregar al cliente final.

---

```markdown
# PROMPT DE INSTRUCCIÓN PARA EL AGENTE DE IA

Actúa como un redactor técnico y documentador experto en software. Tu objetivo es generar dos documentos profesionales en español, redactados de forma clara, elegante y formal, listos para ser entregados al cliente final (TECSUR).

Los documentos son:
1. **Manual de Usuario de la Intranet Académica TECSUR** (Guía de operación de la aplicación).
2. **Ficha Técnica y Guía de la Base de Datos (Supabase Gratuito)** (Documento de límites y precauciones para el administrador).

---

## PARTE 1: MANUAL DE USUARIO — INTRANET ACADÉMICA TECSUR

El manual debe explicar de forma detallada, utilizando viñetas y pasos lógicos, la funcionalidad de la intranet dividida en sus tres roles de usuario:

### Estructura del Manual de Usuario:

1. **Introducción y Acceso**:
   * URL de la plataforma y pantalla de inicio de sesión (`/login`).
   * Cierre automático de sesión tras 10 minutos de inactividad para garantizar la seguridad de los datos.
   * Regla de modales globales: Los modales de registro no se cierran al hacer clic fuera de ellos ni con la tecla `Escape` para evitar que el usuario pierda información ingresada por accidente. Solo cierran con los botones de acción ("Confirmar", "Cancelar") o la "X".
   * Zona Horaria: Toda la plataforma trabaja sincronizada en la hora oficial de Perú (`America/Lima`).

2. **Panel de Alumno (Módulo de Consulta)**:
   * Búsqueda simple ingresando el DNI.
   * Visualización del promedio ponderado por módulo académico y notas de asignaturas individuales.
   * Código de colores de notas:
     * **Verde (Aprobado)**: Calificaciones iguales o mayores a **14** (`>= 14`).
     * **Rojo (Desaprobado)**: Calificaciones menores a **14** (`< 14`).
   * Descarga de Record Académico e Historial en formato PDF imprimible tamaño A4.

3. **Panel de Docente (Módulo de Notas y Asistencia)**:
   * Visualización de cursos asignados.
   * **Registro de Notas**: Selección de asignatura, ingreso numérico de calificaciones (con validación de color: verde para `>= 14`, rojo para `< 14`).
   * **Registro de Asistencias**: Registro diario por fecha y estado (Presente, Falta), con campo de observaciones opcional.

4. **Panel de Administrador (Control Total)**:
   * **Gestión de Alumnos**:
     * **Registro de Alumnos**: Formulario estructurado en 5 pestañas:
       * *Datos Básicos*: DNI, Código del alumno, Nombres, Apellidos y Carrera.
       * *Datos de Nacimiento*: Fecha de nacimiento, Distrito, Provincia y Departamento de origen.
       * *Domicilio*: Dirección actual, Distrito de residencia y Referencia domiciliaria.
       * *Contacto*: Teléfono de casa, Celular, Correo electrónico y enlace de Facebook.
       * *Datos del Apoderado*: Nombre del apoderado, parentesco y número de celular.
     * **Edición de Alumnos**: Modificación de cualquiera de los campos anteriores.
     * **Eliminación**: Eliminación permanente del registro del alumno de la base de datos.
     * **Matricular Alumno en Módulo**: Seleccionar un alumno, asignarle un Módulo Académico, Carrera correspondiente y elegir el Turno (Mañana, Tarde, Sábado AM, Domingo AM).
     * **Historial de Matrículas**: Visualizar todos los módulos en los que se ha matriculado el alumno, con opción de eliminar matrículas específicas en caso de errores de asignación.
   * **Gestión de Docentes**:
     * **Registro de Docentes**: Registrar nuevos docentes ingresando Nombres, Apellidos, Correo electrónico y DNI.
     * **Dar de Baja / Activar (Estado Activo/Inactivo)**: Cambiar el estado del docente a Inactivo (`activo = false`) para suspender su acceso al sistema sin eliminar sus registros históricos de notas y asistencia. Se puede reactivar en cualquier momento.
     * **Restablecer Contraseña**: Opción para resetear de forma inmediata la contraseña de acceso de un docente, devolviéndola por defecto a su número de DNI.
     * **Eliminar Docente**: Borrado definitivo del docente de la base de datos (solo permitido si no tiene notas registradas a su nombre).
   * **Gestión de Carreras y Módulos**:
     * **Carreras**: Registrar nuevas especialidades de estudio, modificarlas o eliminarlas de la base de datos.
     * **Módulos Académicos**: Crear ciclos o módulos asociados a una carrera.
       * *Campo Duración*: Ahora es un campo opcional y libre de texto (ej: "120 horas", "8 semanas" o vacío). Ya no está restringido a números enteros de horas.
     * **Asignaturas/Cursos**: Dentro de cada módulo, registrar las materias/cursos individuales indicando Nombre, Créditos, Orden de visualización (ej: 001, 002) y el Docente encargado.
   * **Control de Pensiones (Mensualidades)**:
     * **Registro de Pagos**: Seleccionar un alumno y registrar sus pagos de pensiones por cada módulo.
     * **Campos obligatorios**: Número de recibo físico, Monto Pagado, Fecha de pago y Deuda Pendiente estimada.
     * **Historial Financiero**: Listar, editar detalles de recibos o eliminar pagos mal ingresados por cada estudiante.
   * **Panel de Auditoría (Trazabilidad)**:
     * Bitácora en tiempo real que registra de forma inalterable cada creación (INSERT), edición (UPDATE) o eliminación (DELETE) en la base de datos.
     * Filtros de búsqueda avanzados por Nombre de la Tabla modificada (ej: `alumnos`, `notas_cursos`) y por Tipo de Acción.
     * Muestra el usuario administrador responsable, la acción exacta, la tabla, el ID afectado y la marca de tiempo exacta de Perú.

---

## PARTE 2: GUÍA TÉCNICA Y LÍMITES DE SUPABASE (PLAN GRATUITO)

Este documento está dirigido a los administradores de TECSUR. Debe explicar los límites técnicos del plan gratuito de Supabase para que el cliente comprenda la capacidad inicial del sistema y cuándo debe considerar actualizar a un plan de pago.

### Tabla de Límites del Plan Gratuito de Supabase (Free Tier):

| Característica | Límite del Plan Gratuito | Impacto / Recomendación para el Cliente |
| :--- | :--- | :--- |
| **Tamaño de Base de Datos** | **500 MB** de almacenamiento | Suficiente para almacenar miles de alumnos, matrículas, notas y asistencias de texto por varios años. No subir archivos pesados directamente a las tablas. |
| **Almacenamiento de Archivos (Storage)** | **1 GB** de almacenamiento | Límite para almacenar fotos de perfil, logotipos o PDFs subidos. Se recomienda optimizar el tamaño de imágenes antes de subirlas. |
| **Pausa por Inactividad** | **1 semana** sin peticiones | **[CRÍTICO]** Si la intranet no registra visitas o llamadas al API por 7 días seguidos, Supabase pausará automáticamente el proyecto. Para restaurarlo, el administrador debe ingresar a la consola de Supabase y dar clic en "Restore Project" (toma 1 a 2 minutos). |
| **Conexiones Concurrentes (Realtime)** | **200 conexiones simultáneas** | Límite de usuarios conectados interactuando al mismo tiempo. Sobrado para el flujo operativo actual de TECSUR. |
| **Usuarios Activos Mensuales (Auth)** | **50,000 usuarios mensuales** | Límite de cuentas individuales de alumnos/docentes que pueden loguearse en un mes. |
| **Ancho de Banda Mensual (Egress)** | **2 GB** de transferencia | Consumo de transferencia de datos descargados desde el servidor. Los reportes e imágenes deben ser ligeros. |
| **Memoria RAM / Caché (Redis/Kong)** | Compartida (baja capacidad) | Procesos masivos muy pesados (como importar miles de filas a la vez en segundos) o loops en código local pueden provocar bloqueos temporales por saturación de memoria (`maxmemory`). Se recomienda hacer cargas por lotes pequeños. |

---

## FORMATO DE SALIDA REQUERIDO:
Redacta el contenido en dos bloques de Markdown bien estructurados, utilizando tipografías limpias y listas fáciles de leer. Utiliza un tono profesional, institucional y de fácil comprensión para no tecnólogos en la Parte 1, y un lenguaje técnico pero accesible en la Parte 2.
```
