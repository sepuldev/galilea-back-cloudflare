import { AppContext, AuthContext } from "../types";
import { getSupabaseServiceClient } from "../supabase";
import type { User } from "@supabase/supabase-js";

// ============================================================================
// JERARQUÍA DE ROLES
// ============================================================================

/**
 * Jerarquía de roles (de menor a mayor privilegio)
 * Un rol superior tiene todos los permisos de los roles inferiores
 */
export const ROLE_HIERARCHY = {
  viewer: 1,      // Solo lectura
  editor: 2,      // Lectura + escritura (posts, categories)
  moderator: 3,   // Lectura + escritura + moderación (consultations)
  admin: 4,       // Acceso completo
} as const;

export type Role = keyof typeof ROLE_HIERARCHY;

/**
 * Obtiene el nivel numérico de un rol
 * @param role Rol a verificar
 * @returns Nivel numérico del rol (0 si el rol no existe)
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role as Role] || 0;
}

/**
 * Verifica si un rol tiene al menos el nivel requerido
 * @param userRole Rol del usuario
 * @param requiredLevel Nivel mínimo requerido
 * @returns true si el rol del usuario tiene el nivel requerido o superior
 */
export function hasRoleLevel(userRole: string, requiredLevel: number): boolean {
  const userLevel = getRoleLevel(userRole);
  return userLevel >= requiredLevel;
}

// ============================================================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================================================

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
 * Verifica que el usuario tenga el rol requerido o superior
 * Soporta jerarquía: si requieres 'editor', acepta 'editor', 'moderator' o 'admin'
 * Debe usarse después de checkAuth()
 * 
 * Uso:
 * const authError = await checkAuth(c);
 * if (authError) return authError;
 * 
 * // Opción 1: Rol específico (solo admin - sin jerarquía)
 * const roleError = checkRole(c, 'admin');
 * 
 * // Opción 2: Nivel mínimo (editor o superior - con jerarquía)
 * const roleError = checkRole(c, 'editor');  // Acepta editor, moderator, admin
 * 
 * // Opción 3: Múltiples roles específicos
 * const roleError = checkRole(c, ['admin', 'moderator']);
 * 
 * if (roleError) return roleError;
 */
export function checkRole(
  c: AppContext, 
  requiredRole: string | string[]
): Response | null {
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

  // Si es un array, verificar si el usuario tiene alguno de los roles
  if (Array.isArray(requiredRole)) {
    const hasAnyRole = requiredRole.some(role => {
      // Si el rol requerido es 'admin', solo acepta 'admin' exacto
      if (role === 'admin') {
        return auth.role === 'admin';
      }
      // Para otros roles, usar jerarquía
      const requiredLevel = getRoleLevel(role);
      if (requiredLevel === 0) {
        // Rol no reconocido en la jerarquía, verificar coincidencia exacta
        return auth.role === role;
      }
      return hasRoleLevel(auth.role, requiredLevel);
    });

    if (!hasAnyRole) {
      console.warn(
        `[AUTH] Acceso denegado - Roles requeridos: ${requiredRole.join(', ')}, Rol actual: ${auth.role}`
      );
      return c.json(
        {
          success: false,
          errors: [
            {
              code: 403,
              message: `Forbidden - Se requiere uno de los siguientes roles: ${requiredRole.join(', ')}`,
            },
          ],
        },
        403,
      );
    }
    return null;
  }

  // Si es un solo rol
  // Si el rol requerido es 'admin', solo acepta 'admin' exacto (sin jerarquía)
  if (requiredRole === "admin") {
    if (auth.role !== "admin") {
      console.warn(
        `[AUTH] Acceso denegado - Rol requerido: ${requiredRole}, Rol actual: ${auth.role}`
      );
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

  // Para otros roles, usar jerarquía (el usuario debe tener el rol requerido o superior)
  const requiredLevel = getRoleLevel(requiredRole);
  
  if (requiredLevel === 0) {
    // Rol no reconocido en la jerarquía, verificar coincidencia exacta
    if (auth.role !== requiredRole) {
      console.warn(
        `[AUTH] Acceso denegado - Rol requerido: ${requiredRole}, Rol actual: ${auth.role}`
      );
      return c.json(
        {
          success: false,
          errors: [
            {
              code: 403,
              message: `Forbidden - Se requiere rol de ${requiredRole}`,
            },
          ],
        },
        403,
      );
    }
    return null;
  }

  // Verificar jerarquía: el usuario debe tener el nivel requerido o superior
  if (!hasRoleLevel(auth.role, requiredLevel)) {
    console.warn(
      `[AUTH] Acceso denegado - Nivel requerido: ${requiredRole} (${requiredLevel}), Rol actual: ${auth.role} (${getRoleLevel(auth.role)})`
    );
    return c.json(
      {
        success: false,
        errors: [
          {
            code: 403,
            message: `Forbidden - Se requiere rol de ${requiredRole} o superior`,
          },
        ],
      },
      403,
    );
  }

  return null;
}

