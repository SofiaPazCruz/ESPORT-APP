export interface CodeSnippet {
  title: string;
  filename: string;
  language: string;
  description: string;
  code: string;
}

export const DATABASE_CODE = {
  overview: `
El diseño relacional para torneos de videojuegos debe resolver tres desafíos de concurrencia y consistencia:
1. **Evitar sobrecupo (Race conditions)**: Múltiples registros concurrentes que intentan ocupar el último cupo.
2. **Unicidad contextual**: Un Gamertag o Email no puede duplicarse dentro del *mismo* torneo, pero un usuario sí puede participar en torneos diferentes con el mismo Gamertag.
3. **Generación atómica de credencial/código de check-in**: Garantizar que el participante reciba su código único en una sola transacción ACID.
  `,
  tablesSql: `-- ==============================================================
-- 1. BASE DE DATOS: TorneosEsportsDB
-- Motor: Microsoft SQL Server 2019 / 2022 / Azure SQL
-- ==============================================================

-- Creación o uso de base de datos
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'TorneosEsportsDB')
BEGIN
    CREATE DATABASE TorneosEsportsDB COLLATE Latin1_General_100_CI_AS_SC_UTF8;
END
GO

USE TorneosEsportsDB;
GO

-- --------------------------------------------------------------
-- Tabla 1: Juegos (Catálogo de títulos)
-- --------------------------------------------------------------
IF OBJECT_ID('dbo.Juegos', 'U') IS NOT NULL DROP TABLE dbo.Juegos;
CREATE TABLE dbo.Juegos (
    JuegoID          INT IDENTITY(1,1) NOT NULL,
    Nombre           NVARCHAR(100) NOT NULL,
    Slug             VARCHAR(50) NOT NULL,
    Genero           NVARCHAR(50) NOT NULL,
    EsActivo         BIT NOT NULL CONSTRAINT DF_Juegos_EsActivo DEFAULT 1,
    FechaCreacion    DATETIME2(0) NOT NULL CONSTRAINT DF_Juegos_FechaCreacion DEFAULT SYSDATETIME(),
    
    CONSTRAINT PK_Juegos PRIMARY KEY CLUSTERED (JuegoID),
    CONSTRAINT UQ_Juegos_Slug UNIQUE NONCLUSTERED (Slug)
);
GO

-- --------------------------------------------------------------
-- Tabla 2: Torneos (Configuración de eventos y control de cupos)
-- --------------------------------------------------------------
IF OBJECT_ID('dbo.Torneos', 'U') IS NOT NULL DROP TABLE dbo.Torneos;
CREATE TABLE dbo.Torneos (
    TorneoID         INT IDENTITY(100,1) NOT NULL,
    JuegoID          INT NOT NULL,
    Nombre           NVARCHAR(150) NOT NULL,
    Formato          NVARCHAR(50) NOT NULL,          -- Ej: '1v1 Doble Eliminación', '5v5 Suizo'
    CuposMaximos     INT NOT NULL,                   -- Capacidad límite
    CuposActuales    INT NOT NULL CONSTRAINT DF_Torneos_CuposActuales DEFAULT 0,
    PremioBolsa      NVARCHAR(100) NULL,
    Estado           VARCHAR(20) NOT NULL CONSTRAINT DF_Torneos_Estado DEFAULT 'OPEN', 
                     -- 'OPEN', 'CLOSING_SOON', 'FULL', 'IN_PROGRESS', 'FINISHED'
    FechaInicio      DATETIME2(0) NOT NULL,
    FechaCreacion    DATETIME2(0) NOT NULL CONSTRAINT DF_Torneos_FechaCreacion DEFAULT SYSDATETIME(),
    
    CONSTRAINT PK_Torneos PRIMARY KEY CLUSTERED (TorneoID),
    CONSTRAINT FK_Torneos_Juegos FOREIGN KEY (JuegoID) REFERENCES dbo.Juegos(JuegoID),
    CONSTRAINT CK_Torneos_CuposValidos CHECK (CuposActuales >= 0 AND CuposActuales <= CuposMaximos),
    CONSTRAINT CK_Torneos_Estado CHECK (Estado IN ('OPEN', 'CLOSING_SOON', 'FULL', 'IN_PROGRESS', 'FINISHED'))
);
GO

-- Índice para búsquedas rápidas de torneos abiertos
CREATE NONCLUSTERED INDEX IX_Torneos_Estado_Fecha 
ON dbo.Torneos (Estado, FechaInicio) 
INCLUDE (Nombre, JuegoID, CuposMaximos, CuposActuales);
GO

-- --------------------------------------------------------------
-- Tabla 3: Participantes (Registros de jugadores)
-- --------------------------------------------------------------
IF OBJECT_ID('dbo.Participantes', 'U') IS NOT NULL DROP TABLE dbo.Participantes;
CREATE TABLE dbo.Participantes (
    ParticipanteID   BIGINT IDENTITY(1,1) NOT NULL,
    TorneoID         INT NOT NULL,
    Gamertag         NVARCHAR(50) NOT NULL,
    Email            NVARCHAR(120) NOT NULL,
    DiscordTag       NVARCHAR(50) NULL,              -- Opcional para coordinación rápida
    Plataforma       NVARCHAR(30) NOT NULL CONSTRAINT DF_Participantes_Plataforma DEFAULT 'PC',
    CodigoCheckIn    VARCHAR(20) NOT NULL,           -- Código alfanumérico único para el torneo
    NumeroSeed       INT NOT NULL,                   -- Posición/Semilla en el orden de llegada
    Estado           VARCHAR(20) NOT NULL CONSTRAINT DF_Participantes_Estado DEFAULT 'CONFIRMED',
                     -- 'CONFIRMED', 'CHECKED_IN', 'DISQUALIFIED', 'WAITLIST'
    FechaRegistro    DATETIME2(0) NOT NULL CONSTRAINT DF_Participantes_FechaRegistro DEFAULT SYSDATETIME(),
    IPRegistro       VARCHAR(45) NULL,               -- Prevención básica de multi-cuentas abusivas
    
    CONSTRAINT PK_Participantes PRIMARY KEY CLUSTERED (ParticipanteID),
    CONSTRAINT FK_Participantes_Torneos FOREIGN KEY (TorneoID) REFERENCES dbo.Torneos(TorneoID) ON DELETE CASCADE,
    
    -- REGLA CRÍTICA: Un Gamertag NO puede repetirse en el MISMO torneo
    CONSTRAINT UQ_Participantes_Torneo_Gamertag UNIQUE NONCLUSTERED (TorneoID, Gamertag),
    
    -- REGLA CRÍTICA: Un Correo NO puede inscribirse dos veces al MISMO torneo
    CONSTRAINT UQ_Participantes_Torneo_Email UNIQUE NONCLUSTERED (TorneoID, Email),
    
    CONSTRAINT CK_Participantes_GamertagMinLength CHECK (LEN(TRIM(Gamertag)) >= 3),
    CONSTRAINT CK_Participantes_EmailFormato CHECK (Email LIKE '%_@__%.__%')
);
GO

-- Índice para agilizar la búsqueda por código de Check-in en el día del evento
CREATE UNIQUE NONCLUSTERED INDEX UQ_Participantes_CodigoCheckIn 
ON dbo.Participantes (CodigoCheckIn);
GO`,

  storedProcedureSql: `-- ==============================================================
-- 2. PROCEDIMIENTO ALMACENADO: sp_InsertarParticipante
-- Motor: T-SQL SQL Server
-- Descripción: Registro transaccional seguro con control de concurrencia,
--              validación de cupos y retorno de confirmación estructurada.
-- ==============================================================

CREATE OR ALTER PROCEDURE dbo.sp_InsertarParticipante
    @TorneoID        INT,
    @Gamertag        NVARCHAR(50),
    @Email           NVARCHAR(120),
    @DiscordTag      NVARCHAR(50) = NULL,
    @Plataforma      NVARCHAR(30) = 'PC',
    @IPRegistro      VARCHAR(45)  = NULL,
    
    -- Parámetros de salida para consumo directo por el Backend
    @NuevoID         BIGINT       = NULL OUTPUT,
    @CodigoCheckIn   VARCHAR(20)  = NULL OUTPUT,
    @NumeroSeed      INT          = NULL OUTPUT,
    @CodigoEstado    INT          = NULL OUTPUT, -- 0: Éxito, 1: Torneo lleno, 2: Gamertag existe, 3: Email existe, 4: Torneo cerrado, 99: Error
    @Mensaje         NVARCHAR(250)= NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; -- Si ocurre un error fatal, revierte la transacción automáticamente

    -- Limpieza de entradas
    SET @Gamertag   = TRIM(@Gamertag);
    SET @Email      = LOWER(TRIM(@Email));
    SET @DiscordTag = NULLIF(TRIM(@DiscordTag), '');
    SET @Plataforma = ISNULL(NULLIF(TRIM(@Plataforma), ''), 'PC');

    -- Variables locales de control
    DECLARE @CuposMax INT;
    DECLARE @CuposAct INT;
    DECLARE @EstadoTorneo VARCHAR(20);
    DECLARE @PrefijoCodigo VARCHAR(5);

    BEGIN TRY
        -- ----------------------------------------------------------
        -- INICIO DE LA TRANSACCIÓN CON BLOQUEO EXCLUSIVO (UPDLOCK)
        -- Evita condición de carrera cuando dos usuarios intentan
        -- ocupar el último cupo en el mismo milisegundo.
        -- ----------------------------------------------------------
        BEGIN TRANSACTION;

        -- 1. Verificar existencia y estado del Torneo con UPDLOCK
        SELECT 
            @CuposMax = T.CuposMaximos,
            @CuposAct = T.CuposActuales,
            @EstadoTorneo = T.Estado,
            @PrefijoCodigo = UPPER(SUBSTRING(J.Slug, 1, 3))
        FROM dbo.Torneos T WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.Juegos J ON T.JuegoID = J.JuegoID
        WHERE T.TorneoID = @TorneoID;

        IF @CuposMax IS NULL
        BEGIN
            SET @CodigoEstado = 4;
            SET @Mensaje = N'El torneo especificado no existe.';
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @EstadoTorneo NOT IN ('OPEN', 'CLOSING_SOON')
        BEGIN
            SET @CodigoEstado = 4;
            SET @Mensaje = N'Las inscripciones para este torneo se encuentran cerradas (' + @EstadoTorneo + N').';
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2. Validar disponibilidad de cupos
        IF @CuposAct >= @CuposMax
        BEGIN
            -- Actualizar estado a FULL si aún no lo estaba
            UPDATE dbo.Torneos 
            SET Estado = 'FULL' 
            WHERE TorneoID = @TorneoID;

            SET @CodigoEstado = 1;
            SET @Mensaje = N'No hay cupos disponibles. El torneo ha alcanzado su capacidad máxima (' + CAST(@CuposMax AS NVARCHAR(10)) + N').';
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 3. Validar si el Gamertag ya está registrado en este torneo
        IF EXISTS (
            SELECT 1 
            FROM dbo.Participantes WITH (UPDLOCK)
            WHERE TorneoID = @TorneoID AND Gamertag = @Gamertag
        )
        BEGIN
            SET @CodigoEstado = 2;
            SET @Mensaje = N'El Gamertag "' + @Gamertag + N'" ya se encuentra registrado en este torneo.';
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 4. Validar si el Correo ya está registrado en este torneo
        IF EXISTS (
            SELECT 1 
            FROM dbo.Participantes WITH (UPDLOCK)
            WHERE TorneoID = @TorneoID AND Email = @Email
        )
        BEGIN
            SET @CodigoEstado = 3;
            SET @Mensaje = N'El correo electrónico "' + @Email + N'" ya tiene una inscripción activa en este torneo.';
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 5. Generar Semilla (Seed) y Código de Check-in Criptográfico
        SET @NumeroSeed = @CuposAct + 1;
        
        -- Formato de código: [PRE]-[TORNEO_ID]-[HEX_ALEATORIO] (ej: VAL-101-A9F4)
        SET @CodigoCheckIn = ISNULL(@PrefijoCodigo, 'ES') + '-' 
                           + CAST(@TorneoID AS VARCHAR(10)) + '-' 
                           + SUBSTRING(CONVERT(VARCHAR(40), NEWID()), 1, 6);

        -- 6. Insertar el nuevo participante
        INSERT INTO dbo.Participantes (
            TorneoID,
            Gamertag,
            Email,
            DiscordTag,
            Plataforma,
            CodigoCheckIn,
            NumeroSeed,
            Estado,
            FechaRegistro,
            IPRegistro
        )
        VALUES (
            @TorneoID,
            @Gamertag,
            @Email,
            @DiscordTag,
            @Plataforma,
            @CodigoCheckIn,
            @NumeroSeed,
            'CONFIRMED',
            SYSDATETIME(),
            @IPRegistro
        );

        -- Obtener ID generado
        SET @NuevoID = SCOPE_IDENTITY();

        -- 7. Incrementar cupos del torneo y actualizar estado si se llenó
        UPDATE dbo.Torneos
        SET 
            CuposActuales = CuposActuales + 1,
            Estado = CASE 
                        WHEN CuposActuales + 1 >= CuposMaximos THEN 'FULL'
                        WHEN CuposActuales + 1 >= (CuposMaximos * 0.85) THEN 'CLOSING_SOON'
                        ELSE Estado 
                     END
        WHERE TorneoID = @TorneoID;

        -- 8. Confirmación exitosa
        SET @CodigoEstado = 0;
        SET @Mensaje = N'Participante registrado con éxito. ¡Bienvenido a la arena!';

        COMMIT TRANSACTION;

        -- Retornar también un Result Set para clientes que consuman directamente el SP
        SELECT 
            @NuevoID       AS ParticipanteID,
            @TorneoID      AS TorneoID,
            @Gamertag      AS Gamertag,
            @Email         AS Email,
            @CodigoCheckIn AS CodigoCheckIn,
            @NumeroSeed    AS NumeroSeed,
            @CodigoEstado  AS CodigoEstado,
            @Mensaje       AS Mensaje;

    END TRY
    BEGIN CATCH
        -- Manejo ante cualquier fallo inesperado o violación de constraint
        IF XACT_STATE() <> 0
        BEGIN
            ROLLBACK TRANSACTION;
        END

        SET @CodigoEstado = 99;
        SET @Mensaje = N'Error inesperado en BD: ' + ERROR_MESSAGE();

        -- Relanzar o registrar error en logs internos
        SELECT 
            NULL AS ParticipanteID,
            @TorneoID AS TorneoID,
            @Gamertag AS Gamertag,
            @Email AS Email,
            NULL AS CodigoCheckIn,
            NULL AS NumeroSeed,
            @CodigoEstado AS CodigoEstado,
            @Mensaje AS Mensaje;
    END CATCH
END;
GO

-- --------------------------------------------------------------
-- Ejemplo de Ejecución de Prueba:
-- --------------------------------------------------------------
/*
DECLARE @ID BIGINT, @Codigo VARCHAR(20), @Seed INT, @Estado INT, @Msg NVARCHAR(250);

EXEC dbo.sp_InsertarParticipante
    @TorneoID      = 101,
    @Gamertag      = N'Kenshi_Pro',
    @Email         = N'kenshi@esports.gg',
    @DiscordTag    = N'kenshi#1234',
    @Plataforma    = N'PC',
    @NuevoID       = @ID OUTPUT,
    @CodigoCheckIn = @Codigo OUTPUT,
    @NumeroSeed    = @Seed OUTPUT,
    @CodigoEstado  = @Estado OUTPUT,
    @Mensaje       = @Msg OUTPUT;

SELECT @ID AS ParticipanteID, @Codigo AS CheckIn, @Seed AS Seed, @Estado AS Codigo, @Msg AS Mensaje;
*/`
};

export const BACKEND_CODE = {
  overview: `
El backend está estructurado siguiendo los principios de **Clean Architecture** (Controlador - Servicio - Repositorio) en **Node.js + Express** con **TypeScript**.
Puntos clave de la solución:
1. **Validación temprana con Zod**: Antes de tocar la base de datos, valida formato de email, longitud de gamertag (3-30 caracteres, sin espacios prohibidos) y sanitización.
2. **Códigos de estado HTTP semánticos**:
   - \`201 Created\` con payload del participante y código de confirmación.
   - \`400 Bad Request\` para errores de validación de formato.
   - \`409 Conflict\` si el Gamertag o Correo ya están en uso para ese torneo.
   - \`422 Unprocessable Entity\` si el torneo está lleno o cerrado.
3. **Manejo de Conexiones**: Pool transaccional con la librería oficial \`mssql\` ejecutando el Stored Procedure de manera parametrizada.
  `,
  validatorTs: `import { z } from 'zod';

export const registerParticipantSchema = z.object({
  tournamentId: z.number({
    required_error: 'El ID del torneo es obligatorio',
    invalid_type_error: 'El ID del torneo debe ser numérico'
  }).int().positive(),

  gamertag: z.string({
    required_error: 'El Gamertag es obligatorio'
  })
    .trim()
    .min(3, 'El Gamertag debe tener al menos 3 caracteres')
    .max(30, 'El Gamertag no puede superar 30 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'El Gamertag solo puede contener letras, números, guiones y puntos'),

  email: z.string({
    required_error: 'El correo electrónico es obligatorio'
  })
    .trim()
    .toLowerCase()
    .email('Debe ingresar un formato de correo válido'),

  discordTag: z.string()
    .trim()
    .max(50, 'El tag de Discord no puede superar 50 caracteres')
    .optional()
    .or(z.literal('')),

  platform: z.enum(['PC', 'PlayStation 5', 'Xbox Series X/S', 'Nintendo Switch', 'Mobile'], {
    invalid_type_error: 'Plataforma de juego no soportada'
  }).default('PC'),

  acceptRules: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar el reglamento del torneo para participar'
  })
});

export type RegisterParticipantInput = z.infer<typeof registerParticipantSchema>;`,

  controllerTs: `import { Request, Response, NextFunction } from 'express';
import { ParticipantService } from './participant.service';
import { registerParticipantSchema } from './participant.validator';

export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  /**
   * POST /api/v1/tournaments/:tournamentId/participants
   * Registra a un nuevo jugador en el torneo
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tournamentId = parseInt(req.params.tournamentId, 10);
      
      // 1. Validar y tipar la entrada con Zod
      const parseResult = registerParticipantSchema.safeParse({
        ...req.body,
        tournamentId: isNaN(tournamentId) ? req.body.tournamentId : tournamentId
      });

      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Los datos proporcionados no cumplen con el formato requerido.',
          details: parseResult.error.format()
        });
        return;
      }

      const clientIp = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || '127.0.0.1';

      // 2. Invocar capa de servicio que ejecuta el Stored Procedure
      const result = await this.participantService.registerParticipant(parseResult.data, clientIp);

      // 3. Mapeo de Códigos de Respuesta HTTP Semánticos
      switch (result.codigoEstado) {
        case 0: // Éxito
          res.status(201).json({
            success: true,
            message: result.mensaje,
            data: {
              participantId: result.participanteId,
              tournamentId: parseResult.data.tournamentId,
              gamertag: parseResult.data.gamertag,
              email: parseResult.data.email,
              platform: parseResult.data.platform,
              seedNumber: result.numeroSeed,
              checkInCode: result.codigoCheckIn,
              registeredAt: new Date().toISOString()
            }
          });
          return;

        case 1: // Torneo Lleno
          res.status(422).json({
            success: false,
            error: 'TOURNAMENT_FULL',
            message: result.mensaje
          });
          return;

        case 2: // Gamertag duplicado en el mismo torneo
          res.status(409).json({
            success: false,
            error: 'DUPLICATE_GAMERTAG',
            field: 'gamertag',
            message: result.mensaje
          });
          return;

        case 3: // Email duplicado en el mismo torneo
          res.status(409).json({
            success: false,
            error: 'DUPLICATE_EMAIL',
            field: 'email',
            message: result.mensaje
          });
          return;

        case 4: // Torneo cerrado o inexistente
          res.status(404).json({
            success: false,
            error: 'TOURNAMENT_UNAVAILABLE',
            message: result.mensaje
          });
          return;

        default:
          res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: result.mensaje || 'Error procesando el registro en el torneo.'
          });
          return;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/tournaments/:tournamentId/check-gamertag?gamertag=xyz
   * Endpoint de debounce para validación en tiempo real sin recargar
   */
  public checkGamertagAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tournamentId = parseInt(req.params.tournamentId, 10);
      const gamertag = req.query.gamertag?.toString().trim();

      if (!gamertag || isNaN(tournamentId)) {
        res.status(400).json({ available: false, message: 'Parámetros inválidos' });
        return;
      }

      const isAvailable = await this.participantService.isGamertagAvailable(tournamentId, gamertag);
      res.json({
        available: isAvailable,
        gamertag,
        tournamentId,
        message: isAvailable ? 'Gamertag disponible' : 'Este Gamertag ya está registrado en el torneo'
      });
    } catch (error) {
      next(error);
    }
  };
}`,

  serviceTs: `import sql from 'mssql';
import { RegisterParticipantInput } from './participant.validator';

export interface StoredProcResult {
  participanteId: number | null;
  codigoCheckIn: string | null;
  numeroSeed: number | null;
  codigoEstado: number;
  mensaje: string;
}

export class ParticipantService {
  constructor(private readonly dbPool: sql.ConnectionPool) {}

  public async registerParticipant(
    input: RegisterParticipantInput,
    clientIp: string
  ): Promise<StoredProcResult> {
    const request = this.dbPool.request();

    // Configuración de parámetros de entrada
    request.input('TorneoID', sql.Int, input.tournamentId);
    request.input('Gamertag', sql.NVarChar(50), input.gamertag);
    request.input('Email', sql.NVarChar(120), input.email);
    request.input('DiscordTag', sql.NVarChar(50), input.discordTag || null);
    request.input('Plataforma', sql.NVarChar(30), input.platform);
    request.input('IPRegistro', sql.VarChar(45), clientIp);

    // Parámetros de salida del Stored Procedure
    request.output('NuevoID', sql.BigInt);
    request.output('CodigoCheckIn', sql.VarChar(20));
    request.output('NumeroSeed', sql.Int);
    request.output('CodigoEstado', sql.Int);
    request.output('Mensaje', sql.NVarChar(250));

    const result = await request.execute('dbo.sp_InsertarParticipante');

    return {
      participanteId: result.output.NuevoID ?? null,
      codigoCheckIn: result.output.CodigoCheckIn ?? null,
      numeroSeed: result.output.NumeroSeed ?? null,
      codigoEstado: result.output.CodigoEstado,
      mensaje: result.output.Mensaje
    };
  }

  public async isGamertagAvailable(tournamentId: number, gamertag: string): Promise<boolean> {
    const request = this.dbPool.request();
    request.input('TorneoID', sql.Int, tournamentId);
    request.input('Gamertag', sql.NVarChar(50), gamertag);

    const query = \`
      SELECT 1 
      FROM dbo.Participantes WITH (NOLOCK) 
      WHERE TorneoID = @TorneoID AND Gamertag = @Gamertag;
    \`;
    const result = await request.query(query);
    return result.recordset.length === 0;
  }
}`,

  routesTs: `import { Router } from 'express';
import { ParticipantController } from './participant.controller';
import { ParticipantService } from './participant.service';
import { getDatabasePool } from '../config/database';

export function createParticipantRouter(): Router {
  const router = Router();
  const pool = getDatabasePool();
  const service = new ParticipantService(pool);
  const controller = new ParticipantController(service);

  // Registro rápido de participante
  router.post('/tournaments/:tournamentId/participants', controller.register);

  // Comprobación de disponibilidad de Gamertag en tiempo real
  router.get('/tournaments/:tournamentId/check-gamertag', controller.checkGamertagAvailability);

  return router;
}`
};

export const ANGULAR_CODE = {
  overview: `
En Angular 17/18+, la arquitectura moderna aprovecha **Signals** (\`signal\`, \`computed\`, \`effect\`) y componentes **Standalone** sin la sobrecarga de NgModules.
Beneficios para este módulo:
1. **Reactividad de Grano Fino**: Validación instantánea sin disparar ciclos globales pesados de Change Detection.
2. **Signals Derivados**: \`isFormValid\`, \`remainingSlots\`, \`canSubmit\` calculados de forma ultra-eficiente con \`computed()\`.
3. **Flujo de Control Moderno**: \`@if\`, \`@for\` en la plantilla HTML sin directivas obsoletas (*ngIf).
4. **Tailwind Gaming Theme**: Colores slate-900/950, acentos neón índigo/cyan/rose, y microinteracciones de feedback háptico/visual.
  `,
  componentTs: `import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface TournamentOption {
  id: number;
  name: string;
  game: string;
  maxSlots: number;
  currentSlots: number;
  badgeColor: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    participantId: number;
    gamertag: string;
    checkInCode: string;
    seedNumber: number;
  };
}

@Component({
  selector: 'app-participant-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './participant-registration.component.html',
  styleUrls: ['./participant-registration.component.css']
})
export class ParticipantRegistrationComponent {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1';

  // --- SIGNALS DE ESTADO DEL FORMULARIO ---
  selectedTournamentId = signal<number>(101);
  gamertag = signal<string>('');
  email = signal<string>('');
  discordTag = signal<string>('');
  platform = signal<'PC' | 'PlayStation 5' | 'Xbox Series X/S' | 'Nintendo Switch' | 'Mobile'>('PC');
  acceptRules = signal<boolean>(false);

  // --- SIGNALS DE PROCESO Y FEEDBACK ---
  isLoading = signal<boolean>(false);
  isCheckingGamertag = signal<boolean>(false);
  gamertagError = signal<string | null>(null);
  emailError = signal<string | null>(null);
  serverError = signal<string | null>(null);
  
  // Estado de éxito y ticket generado
  registrationSuccess = signal<RegisterResponse['data'] | null>(null);

  // Torneos disponibles (idealmente provisto por un TournamentService)
  tournaments = signal<TournamentOption[]>([
    { id: 101, name: 'Copa Titanes Valorant', game: 'Valorant', maxSlots: 32, currentSlots: 29, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    { id: 102, name: 'Rift Challenger LoL Cup', game: 'League of Legends', maxSlots: 64, currentSlots: 42, badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
    { id: 103, name: 'Dojo Masters SF6', game: 'Street Fighter 6', maxSlots: 16, currentSlots: 16, badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
  ]);

  // --- COMPUTED SIGNALS (Lógica Reactiva Derivada) ---
  selectedTournament = computed(() => {
    return this.tournaments().find(t => t.id === this.selectedTournamentId());
  });

  isTournamentFull = computed(() => {
    const t = this.selectedTournament();
    return t ? t.currentSlots >= t.maxSlots : false;
  });

  remainingSlots = computed(() => {
    const t = this.selectedTournament();
    return t ? Math.max(0, t.maxSlots - t.currentSlots) : 0;
  });

  // Validación de Gamertag en caliente
  isGamertagValid = computed(() => {
    const tag = this.gamertag().trim();
    return tag.length >= 3 && tag.length <= 30 && /^[a-zA-Z0-9_.-]+$/.test(tag);
  });

  // Validación de Email con regex estándar
  isEmailValid = computed(() => {
    const mail = this.email().trim();
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/.test(mail);
  });

  // Habilitación estricta del botón de registro ("Zero Friction")
  canSubmit = computed(() => {
    return (
      this.isGamertagValid() &&
      this.isEmailValid() &&
      this.acceptRules() &&
      !this.isTournamentFull() &&
      !this.isLoading()
    );
  });

  // --- MÉTODOS DE ACCIÓN ---
  selectTournament(id: number): void {
    this.selectedTournamentId.set(id);
    this.serverError.set(null);
  }

  onGamertagChange(value: string): void {
    this.gamertag.set(value);
    this.gamertagError.set(null);
    this.serverError.set(null);
  }

  onEmailChange(value: string): void {
    this.email.set(value);
    this.emailError.set(null);
    this.serverError.set(null);
  }

  async submitRegistration(): Promise<void> {
    if (!this.canSubmit()) return;

    this.isLoading.set(true);
    this.serverError.set(null);
    this.gamertagError.set(null);
    this.emailError.set(null);

    const payload = {
      tournamentId: this.selectedTournamentId(),
      gamertag: this.gamertag().trim(),
      email: this.email().trim().toLowerCase(),
      discordTag: this.discordTag().trim() || undefined,
      platform: this.platform(),
      acceptRules: this.acceptRules()
    };

    try {
      const response = await firstValueFrom(
        this.http.post<RegisterResponse>(
          \`\${this.apiUrl}/tournaments/\${payload.tournamentId}/participants\`,
          payload
        )
      );

      // Guardar ticket y celebrar éxito
      this.registrationSuccess.set(response.data);
      
      // Actualizar contador visual de cupos
      this.tournaments.update(list =>
        list.map(t => t.id === payload.tournamentId 
          ? { ...t, currentSlots: t.currentSlots + 1 } 
          : t
        )
      );
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 409) {
          if (err.error?.field === 'gamertag') {
            this.gamertagError.set(err.error?.message || 'Este Gamertag ya está en uso');
          } else if (err.error?.field === 'email') {
            this.emailError.set(err.error?.message || 'Este correo ya tiene un registro activo');
          } else {
            this.serverError.set(err.error?.message || 'Conflicto con los datos ingresados');
          }
        } else if (err.status === 422) {
          this.serverError.set(err.error?.message || 'Los cupos para este torneo se han agotado');
        } else {
          this.serverError.set(err.error?.message || 'Error de conexión con el servidor de torneos');
        }
      } else {
        this.serverError.set('Ocurrió un error inesperado al procesar el registro.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  resetForm(): void {
    this.gamertag.set('');
    this.email.set('');
    this.discordTag.set('');
    this.acceptRules.set(false);
    this.registrationSuccess.set(null);
    this.serverError.set(null);
    this.gamertagError.set(null);
    this.emailError.set(null);
  }
}`,

  componentHtml: `<!-- ============================================================== -->
<!-- TEMPLATE ANGULAR 17/18+ (Control Flow @if/@for + Tailwind CSS) -->
<!-- ============================================================== -->

<div class="max-w-2xl mx-auto p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100">
  
  <!-- CABECERA DEL MÓDULO -->
  <header class="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
    <div>
      <div class="flex items-center gap-2">
        <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="text-xs uppercase tracking-widest font-mono text-emerald-400 font-semibold">Registro Oficial</span>
      </div>
      <h2 class="text-2xl font-bold font-heading text-white tracking-wide mt-1">Inscripción al Torneo</h2>
    </div>
    
    @if (selectedTournament()) {
      <div class="text-right">
        <span class="text-xs text-slate-400 font-mono">Cupos Restantes</span>
        <div class="text-lg font-bold font-mono" [class.text-rose-400]="remainingSlots() <= 3" [class.text-emerald-400]="remainingSlots() > 3">
          {{ remainingSlots() }} / {{ selectedTournament()?.maxSlots }}
        </div>
      </div>
    }
  </header>

  <!-- PANTALLA DE ÉXITO (TICKET / GAMER PASS) -->
  @if (registrationSuccess(); as ticket) {
    <div class="p-6 bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-indigo-500/40 rounded-xl text-center space-y-5 animate-fade-in">
      <div class="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-3xl">
        🎮
      </div>
      <div>
        <h3 class="text-xl font-bold text-white font-heading">¡Inscripción Confirmada!</h3>
        <p class="text-slate-300 text-sm mt-1">Tu pase de entrada al torneo ha sido generado exitosamente.</p>
      </div>

      <!-- Tarjeta de Pase Gamer -->
      <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-lg text-left font-mono space-y-2 text-xs">
        <div class="flex justify-between border-b border-slate-800 pb-2">
          <span class="text-slate-400">GAMERTAG:</span>
          <span class="font-bold text-indigo-300">{{ ticket.gamertag }}</span>
        </div>
        <div class="flex justify-between border-b border-slate-800 pb-2">
          <span class="text-slate-400">SEED DE PARTIDA:</span>
          <span class="font-bold text-amber-300">#{{ ticket.seedNumber }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">CÓDIGO CHECK-IN:</span>
          <span class="font-bold text-emerald-400 tracking-wider text-sm">{{ ticket.checkInCode }}</span>
        </div>
      </div>

      <button 
        type="button"
        (click)="resetForm()"
        class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/30">
        Registrar a Otro Participante
      </button>
    </div>
  } @else {

    <!-- FORMULARIO DE REGISTRO RÁPIDO -->
    <form (ngSubmit)="submitRegistration()" class="space-y-5">
      
      <!-- 1. SELECTOR RÁPIDO DE TORNEO (Visual Chips) -->
      <div>
        <label class="block text-xs uppercase tracking-wider text-slate-400 font-mono mb-2">
          Seleccionar Torneo Activo <span class="text-rose-400">*</span>
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          @for (tournament of tournaments(); track tournament.id) {
            <button
              type="button"
              (click)="selectTournament(tournament.id)"
              [class.border-indigo-500]="selectedTournamentId() === tournament.id"
              [class.bg-indigo-950/40]="selectedTournamentId() === tournament.id"
              [class.border-slate-800]="selectedTournamentId() !== tournament.id"
              [class.opacity-50]="tournament.currentSlots >= tournament.maxSlots"
              [disabled]="tournament.currentSlots >= tournament.maxSlots"
              class="p-3 text-left border rounded-xl transition-all duration-150 hover:border-slate-700 relative">
              <span class="text-xs font-semibold px-2 py-0.5 rounded border inline-block mb-1" [class]="tournament.badgeColor">
                {{ tournament.game }}
              </span>
              <p class="font-semibold text-sm text-white truncate">{{ tournament.name }}</p>
              <div class="text-[11px] text-slate-400 font-mono mt-1">
                {{ tournament.currentSlots }}/{{ tournament.maxSlots }} Cupos
              </div>
            </button>
          }
        </div>
      </div>

      <!-- ALERTA SI EL TORNEO ESTÁ LLENO -->
      @if (isTournamentFull()) {
        <div class="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          ⚠️ El torneo seleccionado ha completado el 100% de sus plazas. Por favor selecciona otro torneo.
        </div>
      }

      <!-- 2. CAMPO: GAMERTAG (Indispensable) -->
      <div>
        <div class="flex justify-between items-center mb-1">
          <label for="gamertag" class="text-xs uppercase tracking-wider text-slate-300 font-mono">
            Gamertag / Apodo Gamer <span class="text-rose-400">*</span>
          </label>
          <span class="text-[11px] text-slate-400 font-mono">Visible en brackets</span>
        </div>
        <div class="relative">
          <input
            id="gamertag"
            type="text"
            placeholder="Ej. Faker_99, TenZ_Aim"
            [ngModel]="gamertag()"
            (ngModelChange)="onGamertagChange($event)"
            name="gamertag"
            required
            maxlength="30"
            autocomplete="off"
            [class.border-rose-500]="gamertagError() || (gamertag().length > 0 && !isGamertagValid())"
            [class.border-emerald-500]="isGamertagValid() && !gamertagError()"
            class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
          @if (isGamertagValid() && !gamertagError()) {
            <span class="absolute right-3 top-3 text-emerald-400 text-sm">✓</span>
          }
        </div>
        @if (gamertagError()) {
          <p class="text-xs text-rose-400 mt-1 font-mono">{{ gamertagError() }}</p>
        }
      </div>

      <!-- 3. CAMPO: CORREO ELECTRÓNICO (Indispensable) -->
      <div>
        <div class="flex justify-between items-center mb-1">
          <label for="email" class="text-xs uppercase tracking-wider text-slate-300 font-mono">
            Correo Electrónico <span class="text-rose-400">*</span>
          </label>
          <span class="text-[11px] text-slate-400 font-mono">Para código de Check-in</span>
        </div>
        <div class="relative">
          <input
            id="email"
            type="email"
            placeholder="jugador@ejemplo.com"
            [ngModel]="email()"
            (ngModelChange)="onEmailChange($event)"
            name="email"
            required
            autocomplete="email"
            [class.border-rose-500]="emailError() || (email().length > 0 && !isEmailValid())"
            [class.border-emerald-500]="isEmailValid() && !emailError()"
            class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
          @if (isEmailValid() && !emailError()) {
            <span class="absolute right-3 top-3 text-emerald-400 text-sm">✓</span>
          }
        </div>
        @if (emailError()) {
          <p class="text-xs text-rose-400 mt-1 font-mono">{{ emailError() }}</p>
        }
      </div>

      <!-- 4. CAMPOS COMPLEMENTARIOS (Agrupados en 2 columnas para no extender el scroll) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="platform" class="block text-xs uppercase tracking-wider text-slate-300 font-mono mb-1">
            Plataforma
          </label>
          <select
            id="platform"
            [ngModel]="platform()"
            (ngModelChange)="platform.set($event)"
            name="platform"
            class="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="PC">PC (Windows / Steam)</option>
            <option value="PlayStation 5">PlayStation 5</option>
            <option value="Xbox Series X/S">Xbox Series X/S</option>
            <option value="Nintendo Switch">Nintendo Switch</option>
            <option value="Mobile">Mobile (iOS / Android)</option>
          </select>
        </div>

        <div>
          <label for="discord" class="block text-xs uppercase tracking-wider text-slate-300 font-mono mb-1">
            Discord Tag <span class="text-slate-500 text-[10px]">(Opcional)</span>
          </label>
          <input
            id="discord"
            type="text"
            placeholder="usuario#0000 o @usuario"
            [ngModel]="discordTag()"
            (ngModelChange)="discordTag.set($event)"
            name="discordTag"
            class="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      <!-- 5. CHECKBOX DE REGLAS (Obligatorio pero simplificado) -->
      <label class="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          [ngModel]="acceptRules()"
          (ngModelChange)="acceptRules.set($event)"
          name="acceptRules"
          class="mt-1 w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
        />
        <span class="text-xs text-slate-400">
          Acepto las reglas oficiales de conducta deportiva y confirmo mi asistencia al horario programado.
        </span>
      </label>

      <!-- MENSAJE DE ERROR GLOBAL DEL SERVIDOR -->
      @if (serverError()) {
        <div class="p-3 bg-rose-950/60 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <span>❌</span>
          <span>{{ serverError() }}</span>
        </div>
      }

      <!-- BOTÓN DE ENVÍO CON ESTADO DE CARGA -->
      <button
        type="submit"
        [disabled]="!canSubmit()"
        class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
        @if (isLoading()) {
          <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Registrando Participante...</span>
        } @else {
          <span>Completar Inscripción Inmediata</span>
          <span>⚡</span>
        }
      </button>

    </form>
  }
</div>`
};
