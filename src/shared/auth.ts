import { AppContext, AuthContext } from "../types";
import { getSupabaseServiceClient } from "../supabase";
import type { User } from "@supabase/supabase-js";

/**
 * Extrae el token JWT del header Authorization
 * Soporta formato "Bearer <token>"
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Valida el token JWT de Supabase y obtiene el usuario
 * Usa el service client para verificar el token con la API de Supabase
 */
async function validateSupabaseToken(
  token: string,
  env: Env
): Promise<{ user: User | null; error: Error | null }> {
  try {
    const supabase = getSupabaseServiceClient(env);
    
    // Usar el método getUser del service client para validar el token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.warn("[AUTH] Token inválido:", error?.message);
      return { user: null, error: error || new Error("Token inválido") };
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error("[AUTH] Error al validar token:", error);
    return {
      user: null,
      error: error instanceof Error ? error : new Error("Error desconocido"),
    };
  }
}

/**
 * Obtiene el perfil de admin del usuario desde la tabla admin_profiles
 */
async function getAdminProfile(
  userId: string,
  env: Env
): Promise<{ role: string; username?: string; isActive: boolean } | null> {
  try {
    const supabase = getSupabaseServiceClient(env);

    const { data, error } = await supabase
      .from("admin_profiles")
      .select("role, username, is_active")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (error || !data) {
      console.warn("[AUTH] Perfil de admin no encontrado para user_id:", userId);
      return null;
    }

    return {
      role: data.role || "viewer",
      username: data.username || undefined,
      isActive: data.is_active ?? true,
    };
  } catch (error) {
    console.error("[AUTH] Error al obtener perfil de admin:", error);
    return null;
  }
}

/**
 * Verifica la autenticación usando Supabase JWT y retorna el contexto de auth
 * Si hay error, retorna una Response con el error, si no retorna null
 * 
 * Uso:
 * const authError = await checkAuth(c);
 * if (authError) return authError;
 * 
 * const auth = c.get('auth') as AuthContext;
 */
export async function checkAuth(c: AppContext): Promise<Response | null> {
  const authHeader = c.req.header("Authorization");
  const token = extractToken(authHeader);

  if (!token) {
    console.warn("[AUTH] Token no proporcionado");
    return c.json(
      {
        success: false,
        errors: [
          {
            code: 401,
            message: "Unauthorized - Token JWT faltante",
          },
        ],
      },
      401,
    );
  }

  // Validar token con Supabase
  const { user, error: tokenError } = await validateSupabaseToken(token, c.env);

  if (tokenError || !user) {
    console.warn("[AUTH] Token inválido o expirado");
    return c.json(
      {
        success: false,
        errors: [
          {
            code: 401,
            message: "Unauthorized - Token inválido o expirado",
          },
        ],
      },
      401,
    );
  }

  // Obtener perfil de admin
  const profile = await getAdminProfile(user.id, c.env);

  if (!profile) {
    console.warn("[AUTH] Usuario sin perfil de admin");
    return c.json(
      {
        success: false,
        errors: [
          {
            code: 403,
            message: "Forbidden - Usuario sin permisos de administrador",
          },
        ],
      },
      403,
    );
  }

  if (!profile.isActive) {
    console.warn("[AUTH] Usuario desactivado");
    return c.json(
      {
        success: false,
        errors: [
          {
            code: 403,
            message: "Forbidden - Usuario desactivado",
          },
        ],
      },
      403,
    );
  }

  // Guardar contexto de auth en el contexto de Hono
  const authContext: AuthContext = {
    user,
    userId: user.id,
    role: profile.role,
    username: profile.username,
  };

  c.set("auth", authContext);

  console.log(`[AUTH] Autenticación exitosa - Usuario: ${user.email}, Rol: ${profile.role}`);
  return null;
}

/**
 * Verifica que el usuario tenga el rol requerido
 * Debe usarse después de checkAuth()
 * 
 * Uso:
 * const authError = await checkAuth(c);
 * if (authError) return authError;
 * 
 * const roleError = checkRole(c, 'admin');
 * if (roleError) return roleError;
 */
export function checkRole(c: AppContext, requiredRole: string): Response | null {
  const auth = c.get("auth") as AuthContext | undefined;

  if (!auth) {
    return c.json(
      {
        success: false,
        errors: [
          {
            code: 401,
            message: "Unauthorized - No autenticado",
          },
        ],
      },
      401,
    );
  }

  // Solo 'admin' tiene acceso completo
  if (requiredRole === "admin" && auth.role !== "admin") {
    console.warn(`[AUTH] Acceso denegado - Rol requerido: ${requiredRole}, Rol actual: ${auth.role}`);
    return c.json(
      {
        success: false,
        errors: [
          {
            code: 403,
            message: "Forbidden - Se requiere rol de administrador",
          },
        ],
      },
      403,
    );
  }

  return null;
}

