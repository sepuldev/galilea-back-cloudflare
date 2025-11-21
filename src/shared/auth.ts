import { AppContext } from "../types";

/**
 * Autenticación básica usando API Keys
 * Valida que el request tenga un API Key válido en el header Authorization
 * 
 * Configuración: Variable de entorno API_KEYS (separados por comas)
 * Header: Authorization: Bearer <API_KEY>
 */

/**
 * Extrae el API Key del header Authorization
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
 */
function isValidApiKey(apiKey: string | undefined, env: Env): boolean {
  if (!apiKey) {
    return false;
  }

  const validKeys = (env as any).API_KEYS as string | undefined;
  
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

