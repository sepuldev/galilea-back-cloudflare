import type { Context } from "hono";
import { PostgrestError } from "@supabase/supabase-js";
import { UserModel } from "./endpoints/users/base";
import { z } from "zod";

// ============================================================================
// ENVIRONMENT TYPES
// ============================================================================

/**
 * Interfaz extendida de Env con las variables de entorno personalizadas
 * Estas variables son opcionales y se configuran en Cloudflare Workers
 */
export interface ExtendedEnv extends Env {
  API_KEYS?: string;
  CORS_ORIGINS?: string;
  CORS_CREDENTIALS?: string;
  CORS_MAX_AGE?: string;
  RATE_LIMIT_REQUESTS?: string;
  RATE_LIMIT_WINDOW?: string;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export type AppContext = Context<{ Bindings: Env }>;
export type HandleArgs = [AppContext];

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * Tipo para un usuario de la base de datos
 * Basado en el schema de UserModel
 */
export type User = z.infer<typeof UserModel.schema>;

/**
 * Interfaz para los datos necesarios para crear un usuario desde una consulta
 */
export interface CreateUserFromConsultationData {
  dni: string;
  email: string;
  first_name: string;
  last_name?: string;
  phone_number: string;
}

/**
 * Resultado de una operación de búsqueda de usuarios
 */
export interface FindUserResult {
  data: User[] | null;
  error: PostgrestError | null;
}

/**
 * Resultado de una operación de creación de usuario
 */
export interface CreateUserResult {
  data: User | null;
  error: PostgrestError | null;
}

/**
 * Resultado de findOrCreateUser
 */
export interface FindOrCreateUserResult {
  data: User | null;
  error: PostgrestError | null;
  created: boolean;
}

// ============================================================================
// CONSULTATION TYPES
// ============================================================================

/**
 * Tipo para los datos de consulta que se insertarán en Supabase
 */
export interface ConsultationInsertData {
  first_name: string;
  email: string;
  phone_number: string;
  consultation_reason: string;
  last_name?: string;
  dni_or_id?: string;
  nationality?: string;
}

/**
 * Tipo para los campos que se pueden actualizar en una consulta
 */
export interface ConsultationUpdateData {
  dni_or_id?: string | null;
  email?: string | null;
  consultation_reason?: string | null;
  first_name?: string | null;
  phone_number?: string | null;
  status?: string | null;
  last_name?: string | null;
  nationality?: string | null;
}

// ============================================================================
// POST TYPES
// ============================================================================

/**
 * Tipo para los campos que se pueden actualizar en un post
 */
export interface PostUpdateData {
  title?: string | null;
  content?: string | null;
  category_id?: number | null;
  image_url?: string | null;
}

// ============================================================================
// EMAIL TYPES
// ============================================================================

/**
 * Tipo para errores de SendGrid
 */
export interface SendGridError {
  response?: {
    body?: unknown;
  };
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Tipo para las opciones de createCRUDResponses
 */
export interface CRUDResponsesOptions {
  include201?: boolean;
  include200?: boolean;
  custom201Description?: string;
  custom200Description?: string;
  custom404Description?: string;
  excludeCommonResponses?: string[];
}
