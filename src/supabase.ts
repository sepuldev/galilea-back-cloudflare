import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient(env: Env) {
  console.log("[CLIENTE SUPABASE] Inicializando cliente de Supabase...");
  
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
  console.log("[CLIENTE SUPABASE] Cliente creado exitosamente");
  
  return client;
}

