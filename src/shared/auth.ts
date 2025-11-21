import { AppContext, ExtendedEnv } from "../types";

/**
 * Autenticación básica usando API Keys
 * Valida que el request tenga un API Key válido en el header Authorization
 * 
 * CONFIGURACIÓN:
 * - Variable de entorno: API_KEYS (separados por comas)
 * - Header en peticiones: Authorization: Bearer <API_KEY>
 * 
 * Ejemplo de configuración:
 * API_KEYS=clave-secreta-1,clave-secreta-2,clave-secreta-3
 */

/**
 * Extrae el API Key del header Authorization
 * Soporta formato "Bearer <API_KEY>" o solo "<API_KEY>"
 */
function extractApiKey(authHeader: string | undefined): string | undefined {
  if (!authHeader) {
    return undefined;
  }

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return authHeader.trim();
}

/**
 * Valida si el API Key proporcionado es válido
 * Compara contra las API Keys configuradas en la variable de entorno API_KEYS
 */
function isValidApiKey(apiKey: string | undefined, env: Env): boolean {
  if (!apiKey) {
    return false;
  }

  const extendedEnv = env as ExtendedEnv;
  const validKeys = extendedEnv.API_KEYS;
  
  if (!validKeys) {
    console.warn("[AUTH] API_KEYS no configurada - Acceso permitido (modo desarrollo)");
    return true;
  }

  const keysArray = validKeys.split(",").map((key: string) => key.trim());
  return keysArray.includes(apiKey);
}

/**
 * Verifica la autenticación y retorna error 401 si no es válida
 * Usar al inicio del método handle() de endpoints protegidos
 */
export function checkAuth(c: AppContext): Response | null {
  const authHeader = c.req.header("Authorization");
  const apiKey = extractApiKey(authHeader);

  if (!isValidApiKey(apiKey, c.env)) {
    console.warn("[AUTH] Intento de acceso no autorizado");
    return c.json(
      {
        success: false,
        errors: [
          {
            code: 401,
            message: "Unauthorized - API Key inválida o faltante",
          },
        ],
      },
      401,
    );
  }

  console.log("[AUTH] Autenticación exitosa");
  return null;
}

