import type { Context } from "hono";

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

export type AppContext = Context<{ Bindings: Env }>;
export type HandleArgs = [AppContext];
