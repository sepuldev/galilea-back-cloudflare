import { AppContext, ExtendedEnv } from "../types";

/**
 * Rate Limiting para proteger endpoints contra abuso y DDoS
 * 
 * CONFIGURACIÓN MEDIANTE VARIABLES DE ENTORNO:
 * 
 * - RATE_LIMIT_REQUESTS: Número máximo de requests permitidos (default: 100)
 * - RATE_LIMIT_WINDOW: Ventana de tiempo en segundos (default: 60)
 * 
 * Ejemplo:
 * RATE_LIMIT_REQUESTS=100
 * RATE_LIMIT_WINDOW=60
 * (100 requests por minuto)
 * 
 * TRACKING:
 * - Si hay API Key en el header Authorization: tracking por API Key
 * - Si no hay API Key: tracking por IP del cliente
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitCache = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanupExpiredEntries() {
  const now = Date.now();
  
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }
  
  lastCleanup = now;
  
  for (const [key, entry] of rateLimitCache.entries()) {
    if (now > entry.resetTime) {
      rateLimitCache.delete(key);
    }
  }
}

function getRateLimitKey(c: AppContext): string {
  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    const apiKey = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : authHeader.trim();
    
    if (apiKey) {
      return `api_key:${apiKey}`;
    }
  }
  
  const ip = c.req.header("CF-Connecting-IP") || 
             c.req.header("X-Forwarded-For") || 
             "unknown";
  
  return `ip:${ip}`;
}

/**
 * Obtiene la configuración de rate limiting desde variables de entorno
 * Si no están configuradas, usa valores por defecto
 */
function getRateLimitConfig(env: Env): { requests: number; window: number } {
  const extendedEnv = env as ExtendedEnv;
  
  const requests = extendedEnv.RATE_LIMIT_REQUESTS 
    ? parseInt(extendedEnv.RATE_LIMIT_REQUESTS, 10) 
    : 100; // Default: 100 requests
  
  const window = extendedEnv.RATE_LIMIT_WINDOW 
    ? parseInt(extendedEnv.RATE_LIMIT_WINDOW, 10) 
    : 60; // Default: 60 segundos
  
  return { requests, window };
}

export function checkRateLimit(
  c: AppContext,
  customLimit?: number,
  customWindow?: number
): Response | null {
  cleanupExpiredEntries();
  
  const config = getRateLimitConfig(c.env);
  const limit = customLimit ?? config.requests;
  const window = customWindow ?? config.window;
  
  const key = getRateLimitKey(c);
  const now = Date.now();
  
  let entry = rateLimitCache.get(key);
  
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + (window * 1000),
    };
    rateLimitCache.set(key, entry);
    return null;
  }
  
  entry.count++;
  
  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    console.warn(`[RATE LIMIT] Límite excedido para ${key}. Requests: ${entry.count}/${limit}`);
    
    return c.json(
      {
        success: false,
        errors: [
          {
            code: 429,
            message: `Too Many Requests - Límite de ${limit} requests por ${window} segundos excedido. Intenta de nuevo en ${retryAfter} segundos.`,
          },
        ],
      },
      429,
      {
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
      }
    );
  }
  
  return null;
}

