// // src/shared/corsConfig.ts

// import { ExtendedEnv } from "../types";

// /**
//  * Obtiene la configuración de CORS desde variables de entorno
//  * 
//  * CONFIGURACIÓN MEDIANTE VARIABLES DE ENTORNO:
//  * 
//  * 1. CORS_ORIGINS: Lista de orígenes permitidos separados por comas
//  *    Ejemplo: "https://mi-dominio.com,https://www.mi-dominio.com,http://localhost:3000"
//  * 
//  * 2. CORS_CREDENTIALS: "true" o "false" para permitir credenciales (default: "true")
//  * 
//  * 3. CORS_MAX_AGE: Tiempo de cache del preflight en segundos (default: 600)
//  * 
//  * Si CORS_ORIGINS no está configurado, usa valores por defecto para desarrollo local
//  */
// export function getCorsConfig(env: Env) {
//   const extendedEnv = env as ExtendedEnv;

//   // Obtener orígenes permitidos desde variable de entorno CORS_ORIGINS
//   // Formato: "https://dominio1.com,https://dominio2.com" (separados por comas)
//   const corsOriginsEnv = extendedEnv.CORS_ORIGINS;

//   let allowedOrigins: string[];

//   if (corsOriginsEnv) {
//     // Si está configurado, usar los orígenes de la variable de entorno
//     // Separar por comas, limpiar espacios y filtrar vacíos
//     allowedOrigins = corsOriginsEnv
//       .split(",")
//       .map((orig: string) => orig.trim())
//       .filter((orig: string) => orig.length > 0);

//     console.log(`[CORS] Orígenes configurados desde CORS_ORIGINS: ${allowedOrigins.length} orígenes`);
//   } else {
//     // Si no está configurado, usar valores por defecto (desarrollo local)
//     allowedOrigins = [
//       "http://localhost:3000",
//       "http://127.0.0.1:3000",
//       "http://localhost:3001",
//       "http://127.0.0.1:3001",
//       "https://galilea-git-main-sergios-projects-4ee97cc2.vercel.app",
//       "https://galilea-h3r43wxd7-sergios-projects-4ee97cc2.vercel.app",
//     ];

//     console.warn("[CORS] CORS_ORIGINS no configurado - Usando orígenes por defecto (solo localhost)");
//     console.warn("[CORS] Para producción, configura CORS_ORIGINS con los dominios permitidos");
//     console.warn("[CORS] Ejemplo: https://galilea.vercel.app,https://*.vercel.app");
//   }

//   // Obtener configuración de credenciales (default: true)
//   // Permite enviar cookies y headers de autenticación en peticiones cross-origin
//   const corsCredentialsEnv = extendedEnv.CORS_CREDENTIALS;
//   const allowCredentials = corsCredentialsEnv === "false" ? false : true;

//   // Obtener maxAge para cache de preflight requests (default: 600 segundos = 10 minutos)
//   // El navegador cachea la respuesta del preflight durante este tiempo
//   const corsMaxAgeEnv = extendedEnv.CORS_MAX_AGE;
//   const maxAge = corsMaxAgeEnv ? parseInt(corsMaxAgeEnv, 10) : 600;

//   return {
//     origin: allowedOrigins,
//     allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
//     allowHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
//     exposeHeaders: ["Content-Length", "Content-Type"],
//     maxAge: maxAge,
//     credentials: allowCredentials,
//   };
// }

// src/shared/corsConfig.ts
import { ExtendedEnv } from "../types";

/**
 * Configuración CORS dinámica basada en variables de entorno.
 * Admite wildcards (*.vercel.app), varios dominios y localhost.
 */
export function getCorsConfig(env: Env) {
  const extendedEnv = env as ExtendedEnv;

  /** ---------------------------------------------------------
   *  1. ORÍGENES PERMITIDOS
   * ---------------------------------------------------------*/
  const corsOriginsEnv = extendedEnv.CORS_ORIGINS;

  let allowedOrigins: string[];

  if (corsOriginsEnv) {
    allowedOrigins = corsOriginsEnv
      .split(",")
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    console.log(
      `[CORS] Orígenes cargados (${allowedOrigins.length}): ${allowedOrigins.join(
        " | "
      )}`
    );
  } else {
    // Seguridad + funcionalidad por defecto
    allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "https://*.vercel.app", // Previews automáticas
    ];

    console.warn("[CORS] ⚠ No se detectó CORS_ORIGINS. Usando valores por defecto.");
  }

  /** ---------------------------------------------------------
   *  2. CREDENCIALES (cookies, Authorization...)
   * ---------------------------------------------------------*/
  const allowCredentials =
    extendedEnv.CORS_CREDENTIALS === "false" ? false : true;

  /** ---------------------------------------------------------
   *  3. CACHE DE PREFLIGHT
   * ---------------------------------------------------------*/
  const maxAge = extendedEnv.CORS_MAX_AGE
    ? parseInt(extendedEnv.CORS_MAX_AGE, 10)
    : 600;

  /** ---------------------------------------------------------
   *  4. CONFIGURACIÓN FINAL
   * ---------------------------------------------------------*/
  return {
    origin: allowedOrigins,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
    exposeHeaders: ["Content-Length", "Content-Type"],
    credentials: allowCredentials,
    maxAge,
  };
}
