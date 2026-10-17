export interface UxPrinciple {
  title: string;
  tagline: string;
  icon: string;
  description: string;
  recommendations: string[];
  antiPatterns: string[];
}

export const UX_UI_ANALYSIS = {
  summary: `
Para cumplir fielmente con la historia de usuario: *"Como Usuario, quiero poder registrar a cada participante de manera fácil y rápida"*, el tiempo total de registro debe ser **inferior a 25 segundos** con un índice de abandono (drop-off) menor al 5%.
  `,

  indispensableFields: [
    {
      field: 'Torneo / Videojuego',
      priority: 'Obligatorio #1',
      why: 'Contexto de la llave o bracket. Seleccionable mediante chips visuales con 1 solo clic en lugar de un select desplegable tradicional.',
      frictionLevel: 'Cero fricción (1 clic)',
      validationRule: 'ID de torneo válido y con cupo disponible > 0.'
    },
    {
      field: 'Gamertag / Nickname',
      priority: 'Obligatorio #2',
      why: 'La identidad pública del competidor en la arena y tablas de clasificación. No requerimos nombre real ni DNI en esta fase.',
      frictionLevel: 'Baja fricción (Input de texto simple)',
      validationRule: '3 a 30 caracteres alfanuméricos. Validación asíncrona de disponibilidad sin recargar.'
    },
    {
      field: 'Correo Electrónico',
      priority: 'Obligatorio #3',
      why: 'Canal de comunicación asíncrono para enviar el pase de check-in, enlace al Discord de árbitros y recordatorio de horario.',
      frictionLevel: 'Baja fricción',
      validationRule: 'Regex estándar RFC5322. Unicidad por torneo (permite usar el mismo correo en torneos de juegos distintos).'
    },
    {
      field: 'Plataforma (Default: PC / Consola)',
      priority: 'Recomendado (Preseleccionado)',
      why: 'Crucial para torneos crossplay o torneos exclusivos de consola. Viene preseleccionado en "PC" para no requerir interacción si es el default.',
      frictionLevel: 'Mínima (Ya viene con valor por defecto)',
      validationRule: 'Valor en catálogo soportado.'
    },
    {
      field: 'Discord Tag / ID',
      priority: 'Opcional / Progresivo',
      why: 'Es vital para el contacto en torneos online, pero si es obligatorio detiene al usuario que no recuerda su discriminador o tag exacto. Se solicita opcional aquí y obligatorio en el Check-in.',
      frictionLevel: 'Opcional (No bloquea el registro)',
      validationRule: 'Formato válido si se proporciona.'
    }
  ],

  progressiveDisclosureStrategy: `
### Estrategia de Divulgación Progresiva (Progressive Disclosure)
El error más común en plataformas de torneos es exigir desde el inicio:
- Nombre y Apellidos reales
- Documento de Identidad / Cédula
- Número de Teléfono / WhatsApp
- Perfil de Steam ID 64 / Riot ID con #TAG
- Captura de pantalla de rango o rango actual
- Cuenta bancaria / PayPal para premios

**Enfoque Recomendado en 2 Fases:**
1. **Fase 1: Registro Rápido (Sprint Actual - < 25 segundos)**
   - Solo Gamertag + Correo + Torneo.
   - Genera inmediatamente el "Gamer Pass" y reserva el cupo en base de datos.
2. **Fase 2: Check-in Pre-Partida (60 minutos antes del inicio del torneo)**
   - El participante confirma asistencia en sala y enlaza su cuenta específica del juego (ej. Riot ID para que el bot de la API verifique partidas personalizadas). Si no hace check-in, la plaza se cede a la lista de espera (Waitlist).
  `,

  visualFeedbackGuidelines: [
    {
      phase: '1. Durante la digitación (Microinteracciones en Vivo)',
      items: [
        'Indicador visual sutil (check verde / alerta ámbar) junto al Gamertag cuando tiene el formato correcto.',
        'Debounce de 400ms para consultar si el Gamertag ya existe en el torneo seleccionado, evitando que el usuario envíe el formulario para recién enterarse del conflicto.',
        'Contador en tiempo real de cupos restantes con código de color (Verde > 5 cupos, Ámbar <= 5 cupos, Rojo = Lleno).'
      ]
    },
    {
      phase: '2. En el momento del envío (Estado de Carga Activo)',
      items: [
        'Deshabilitar inmediatamente el botón para evitar doble clic o peticiones duplicadas accidentales.',
        'Reemplazar el texto del botón por un spinner giratorio y mensaje activo: "Verificando cupos y registrando...".',
        'Cursor en estado `wait` y feedback visual en el contenedor.'
      ]
    },
    {
      phase: '3. En caso de Éxito (Recompensa Emocional / Dopamina)',
      items: [
        'Generar un "Gamer Pass" digital interactivo con estética esports.',
        'Efecto de confetti sutil para celebrar la confirmación.',
        'Mostrar claramente el Código de Check-in (ej. VAL-101-9F2B) y la posición del Seed.',
        'Botones de 1 clic para: "Copiar Código", "Descargar Pase Digital" y "Unirse al Discord Oficial".'
      ]
    },
    {
      phase: '4. En caso de Error (Manejo no punitivo)',
      items: [
        'Nunca borrar los datos digitados por el usuario si ocurre un error.',
        'Foco automático en el campo causante del error (ej. input de Gamertag resaltado en rojo con mensaje claro: "El Gamertag ya está en este torneo, intenta agregar un sufijo").',
        'Si el torneo se llenó en el proceso, ofrecer con un clic la inscripción en la "Lista de Espera" (Waitlist).'
      ]
    }
  ],

  architectureComparison: {
    title: 'Evaluación Arquitectónica: Stack Solicitado vs Alternativa React/Firebase',
    description: 'Análisis técnico comparativo respondiendo a la propuesta: "React con autenticación Firebase y validación con Formik" frente a "Angular Signals + Node.js Express + SQL Server".',
    options: [
      {
        stack: 'Opción A: Angular Signals + Node.js + SQL Server (Stack Inicial Solicitado)',
        pros: [
          'Garantía ACID absoluta: Control estricto de cupos y bloqueos pesimistas (UPDLOCK) en SQL Server evitando sobrecupo.',
          'Signals en Angular ofrece reactividad nativa sin dependencias externas pesadas.',
          'Independencia de proveedores cloud propietarios; despliegue en cualquier servidor VPS, Docker o Kubernetes.',
          'Procedimiento almacenado centraliza la lógica transaccional crítica.'
        ],
        cons: [
          'Mayor cantidad de boilerplate (configurar servidor Express, pool de SQL Server, migraciones).',
          'Requiere configuración manual de WebSockets si se desea sincronización de cupos en tiempo real multi-usuario.'
        ],
        idealFor: 'Plataformas competitivas con premios económicos, ligas oficiales o torneos presenciales donde la consistencia relacional y auditoría son críticas.'
      },
      {
        stack: 'Opción B: React + Firebase (Firestore/Auth) + Formik / Zod (Tu Propuesta)',
        pros: [
          'Tiempo de desarrollo (Time-to-Market) hasta 3x más rápido: no requiere escribir backend ni controladores manuales.',
          'Sincronización en tiempo real nativa con listeners de Firestore (`onSnapshot` actualiza los cupos instantáneamente a todos los usuarios conectados).',
          'Autenticación social instantánea con 1 clic (Sign in with Google, Discord, Twitch, Steam) eliminando por completo el formulario tradicional.',
          'Formik + Yup/Zod ofrece validación declarativa muy consolidada.'
        ],
        cons: [
          'Control de concurrencia: Requiere Firestore `runTransaction()` para evitar sobrecupo en lugar de bloqueos SQL nativos.',
          'Consultas relacionales complejas (ej. brackets multinivel, cruce con partidas históricas) son más engorrosas en base de datos NoSQL documental.',
          'Costos por lecturas/escrituras en Firestore ante eventos masivos de esports con miles de espectadores concurrentes.'
        ],
        idealFor: 'Prototipos rápidos, MVPs, torneos comunitarios y aplicaciones donde el registro con Discord/Google con 1 clic es la prioridad máxima.'
      }
    ]
  }
};
