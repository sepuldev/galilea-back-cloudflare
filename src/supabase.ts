import { createClient } from "@supabase/supabase-js";

/**
 * Obtiene un cliente de Supabase con la clave anónima (para lecturas)
 */
export function getSupabaseClient(env: Env) {
  console.log("[CLIENTE SUPABASE] Inicializando cliente de Supabase (ANON_KEY)...");
  
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY;

  console.log("[CLIENTE SUPABASE] URL configurada:", !!supabaseUrl);
  if (supabaseUrl) {
    console.log("[CLIENTE SUPABASE] URL (parcial):", `${supabaseUrl.substring(0, 40)}...`);
  } else {
    console.error("[CLIENTE SUPABASE] ERROR: SUPABASE_URL no está configurada");
  }

  console.log("[CLIENTE SUPABASE] Clave anónima configurada:", !!supabaseKey);
  if (supabaseKey) {
    console.log("[CLIENTE SUPABASE] Clave (parcial):", `${supabaseKey.substring(0, 30)}...`);
  } else {
    console.error("[CLIENTE SUPABASE] ERROR: SUPABASE_ANON_KEY no está configurada");
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error("[CLIENTE SUPABASE] ERROR CRÍTICO: Variables de entorno faltantes");
    throw new Error(
      "SUPABASE_URL y SUPABASE_ANON_KEY deben estar configuradas en las variables de entorno"
    );
  }

  const client = createClient(supabaseUrl, supabaseKey);
  console.log("[CLIENTE SUPABASE] Cliente creado exitosamente (ANON_KEY)");
  
  return client;
}

/**
 * Obtiene un cliente de Supabase con la Service Role Key (para escrituras - bypass RLS)
 * Usa esta función para operaciones INSERT, UPDATE, DELETE que requieren permisos elevados
 */
export function getSupabaseServiceClient(env: Env) {
  console.log("[CLIENTE SUPABASE] Inicializando cliente de Supabase (SERVICE_ROLE_KEY)...");
  
  const supabaseUrl = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("[CLIENTE SUPABASE] URL configurada:", !!supabaseUrl);
  if (supabaseUrl) {
    console.log("[CLIENTE SUPABASE] URL (parcial):", `${supabaseUrl.substring(0, 40)}...`);
  } else {
    console.error("[CLIENTE SUPABASE] ERROR: SUPABASE_URL no está configurada");
  }

  console.log("[CLIENTE SUPABASE] Service Role Key configurada:", !!serviceRoleKey);
  if (serviceRoleKey) {
    console.log("[CLIENTE SUPABASE] Service Role Key (parcial):", `${serviceRoleKey.substring(0, 30)}...`);
  } else {
    console.error("[CLIENTE SUPABASE] ERROR: SUPABASE_SERVICE_ROLE_KEY no está configurada");
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[CLIENTE SUPABASE] ERROR CRÍTICO: Variables de entorno faltantes");
    throw new Error(
      "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas en las variables de entorno"
    );
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log("[CLIENTE SUPABASE] Cliente creado exitosamente (SERVICE_ROLE_KEY)");
  
  return client;
}

