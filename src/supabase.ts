import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cache de clientes de Supabase para reutilización
// En Cloudflare Workers, las variables de entorno son constantes, así que podemos cachear los clientes
let cachedAnonClient: SupabaseClient | null = null;
let cachedServiceClient: SupabaseClient | null = null;
let cachedAnonUrl: string | null = null;
let cachedAnonKey: string | null = null;
let cachedServiceUrl: string | null = null;
let cachedServiceKey: string | null = null;

/**
 * Obtiene un cliente de Supabase con la clave anónima (para lecturas)
 * El cliente se cachea y reutiliza si las credenciales no cambian
 */
export function getSupabaseClient(env: Env): SupabaseClient {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY;

  // Validar variables de entorno
  if (!supabaseUrl || !supabaseKey) {
    console.error("[CLIENTE SUPABASE] ERROR CRÍTICO: Variables de entorno faltantes");
    throw new Error(
      "SUPABASE_URL y SUPABASE_ANON_KEY deben estar configuradas en las variables de entorno"
    );
  }

  // Reutilizar cliente cacheado si las credenciales son las mismas
  if (
    cachedAnonClient &&
    cachedAnonUrl === supabaseUrl &&
    cachedAnonKey === supabaseKey
  ) {
    return cachedAnonClient;
  }

  // Crear nuevo cliente y cachearlo
  console.log("[CLIENTE SUPABASE] Creando nuevo cliente de Supabase (ANON_KEY)...");
  cachedAnonClient = createClient(supabaseUrl, supabaseKey);
  cachedAnonUrl = supabaseUrl;
  cachedAnonKey = supabaseKey;
  console.log("[CLIENTE SUPABASE] Cliente creado y cacheado exitosamente (ANON_KEY)");
  
  return cachedAnonClient;
}

/**
 * Obtiene un cliente de Supabase con la Service Role Key (para escrituras - bypass RLS)
 * Usa esta función para operaciones INSERT, UPDATE, DELETE que requieren permisos elevados
 * El cliente se cachea y reutiliza si las credenciales no cambian
 */
export function getSupabaseServiceClient(env: Env): SupabaseClient {
  const supabaseUrl = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  // Validar variables de entorno
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[CLIENTE SUPABASE] ERROR CRÍTICO: Variables de entorno faltantes");
    throw new Error(
      "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas en las variables de entorno"
    );
  }

  // Reutilizar cliente cacheado si las credenciales son las mismas
  if (
    cachedServiceClient &&
    cachedServiceUrl === supabaseUrl &&
    cachedServiceKey === serviceRoleKey
  ) {
    return cachedServiceClient;
  }

  // Crear nuevo cliente y cachearlo
  console.log("[CLIENTE SUPABASE] Creando nuevo cliente de Supabase (SERVICE_ROLE_KEY)...");
  cachedServiceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  cachedServiceUrl = supabaseUrl;
  cachedServiceKey = serviceRoleKey;
  console.log("[CLIENTE SUPABASE] Cliente creado y cacheado exitosamente (SERVICE_ROLE_KEY)");
  
  return cachedServiceClient;
}

