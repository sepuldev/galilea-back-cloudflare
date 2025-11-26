# 🔐 Guía: Roles con Jerarquía - Cómo Funciona

## 📋 CÓMO FUNCIONA ACTUALMENTE

### **Flujo de Autenticación:**

```
1. EXTENSIÓN (Usuario inicia sesión)
   ↓
   Supabase Auth: signInWithPassword(email, password)
   ↓
   Obtiene: { access_token, user }
   ↓
   Guarda token en storage local

2. EXTENSIÓN (Hace request al backend)
   ↓
   Envía: Authorization: Bearer <access_token>
   ↓
   BACKEND recibe el token

3. BACKEND (Valida y obtiene rol)
   ↓
   Valida token con Supabase: getUser(token)
   ↓
   Obtiene user_id del token
   ↓
   Consulta tabla admin_profiles WHERE user_id = <user_id>
   ↓
   Obtiene: { role: "admin", username: "...", is_active: true }
   ↓
   Guarda en contexto: c.set('auth', { user, userId, role, username })
```

### **Dónde se Almacena el Rol:**

El rol **NO** viene en el token JWT de Supabase. Se almacena en la **tabla `admin_profiles`** en Supabase:

```sql
-- Estructura de la tabla admin_profiles
CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),  -- ID del usuario de Supabase Auth
  role TEXT NOT NULL,                        -- 'admin', 'editor', 'viewer', etc.
  username TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Ejemplo de registro:**
```sql
INSERT INTO admin_profiles (user_id, role, username, is_active)
VALUES ('uuid-del-usuario', 'admin', 'admin_user', true);
```

---

## 🎯 IMPLEMENTACIÓN DE JERARQUÍA DE ROLES

### **Paso 1: Definir Jerarquía de Roles**

Define los roles y su orden de jerarquía (de menor a mayor privilegio):

```typescript
// src/shared/auth.ts

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
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role as Role] || 0;
}

/**
 * Verifica si un rol tiene al menos el nivel requerido
 */
export function hasRoleLevel(userRole: string, requiredLevel: number): boolean {
  const userLevel = getRoleLevel(userRole);
  return userLevel >= requiredLevel;
}
```

### **Paso 2: Actualizar `checkRole()` para Soportar Jerarquía**

Modifica la función `checkRole()` para que acepte:
- Un rol específico: `checkRole(c, 'admin')`
- Un nivel mínimo: `checkRole(c, 'editor')` (acepta editor, moderator, admin)
- Múltiples roles: `checkRole(c, ['admin', 'moderator'])`

```typescript
// src/shared/auth.ts

/**
 * Verifica que el usuario tenga el rol requerido o superior
 * Soporta jerarquía: si requieres 'editor', acepta 'editor', 'moderator' o 'admin'
 * 
 * Uso:
 * const authError = await checkAuth(c);
 * if (authError) return authError;
 * 
 * // Opción 1: Rol específico (solo admin)
 * const roleError = checkRole(c, 'admin');
 * 
 * // Opción 2: Nivel mínimo (editor o superior)
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
      // Si el rol requerido es 'admin', solo acepta 'admin'
      if (role === 'admin') {
        return auth.role === 'admin';
      }
      // Para otros roles, usar jerarquía
      const requiredLevel = getRoleLevel(role);
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
  // Si el rol requerido es 'admin', solo acepta 'admin' exacto
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
    // Rol no reconocido
    console.warn(`[AUTH] Rol requerido no reconocido: ${requiredRole}`);
    return c.json(
      {
        success: false,
        errors: [
          {
            code: 500,
            message: "Error interno - Rol no reconocido",
          },
        ],
      },
      500,
    );
  }

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
```

### **Paso 3: Ejemplos de Uso en Endpoints**

```typescript
// Ejemplo 1: Solo admin puede eliminar
export class PostDelete extends OpenAPIRoute {
  public async handle(c: AppContext) {
    const authError = await checkAuth(c);
    if (authError) return authError;

    // Solo admin puede eliminar
    const roleError = checkRole(c, 'admin');
    if (roleError) return roleError;

    // ... resto del código
  }
}

// Ejemplo 2: Editor o superior puede crear/editar
export class PostCreate extends OpenAPIRoute {
  public async handle(c: AppContext) {
    const authError = await checkAuth(c);
    if (authError) return authError;

    // Editor, moderator o admin pueden crear
    const roleError = checkRole(c, 'editor');
    if (roleError) return roleError;

    // ... resto del código
  }
}

// Ejemplo 3: Moderator o admin pueden moderar consultas
export class ConsultationUpdate extends OpenAPIRoute {
  public async handle(c: AppContext) {
    const authError = await checkAuth(c);
    if (authError) return authError;

    // Moderator o admin pueden actualizar consultas
    const roleError = checkRole(c, 'moderator');
    if (roleError) return roleError;

    // ... resto del código
  }
}

// Ejemplo 4: Viewer o superior puede leer
export class PostList extends OpenAPIRoute {
  public async handle(c: AppContext) {
    const authError = await checkAuth(c);
    if (authError) return authError;

    // Viewer, editor, moderator o admin pueden leer
    const roleError = checkRole(c, 'viewer');
    if (roleError) return roleError;

    // ... resto del código
  }
}
```

---

## 📊 TABLA DE JERARQUÍA Y PERMISOS

| Rol | Nivel | Puede Leer | Puede Crear/Editar | Puede Eliminar | Puede Moderar | Acceso Completo |
|-----|-------|------------|-------------------|----------------|---------------|-----------------|
| **viewer** | 1 | ✅ Posts, Categories | ❌ | ❌ | ❌ | ❌ |
| **editor** | 2 | ✅ Posts, Categories | ✅ Posts, Categories | ❌ | ❌ | ❌ |
| **moderator** | 3 | ✅ Todo | ✅ Posts, Categories, Consultations | ❌ | ✅ Consultations | ❌ |
| **admin** | 4 | ✅ Todo | ✅ Todo | ✅ Todo | ✅ Todo | ✅ Todo |

---

## 🔧 CONFIGURACIÓN EN LA BASE DE DATOS

### **Crear/Actualizar Registro en `admin_profiles`:**

```sql
-- Para tu usuario admin actual
UPDATE admin_profiles 
SET role = 'admin' 
WHERE user_id = 'tu-user-id-aqui';

-- O crear un nuevo registro si no existe
INSERT INTO admin_profiles (user_id, role, username, is_active)
VALUES (
  'tu-user-id-de-supabase-auth',
  'admin',
  'admin_user',
  true
)
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';
```

### **Obtener el user_id de Supabase Auth:**

1. En Supabase Dashboard → Authentication → Users
2. Busca tu usuario y copia el UUID
3. O desde la extensión, después de login, el `user.id` es el `user_id`

---

## 🎯 PARA TU CASO (Solo Admin por Ahora)

Si solo vas a tener un usuario admin, puedes:

### **Opción A: Mantener Simple (Recomendado por ahora)**

No necesitas cambiar nada. El código actual ya funciona:
- Solo verifica si el rol es `'admin'`
- Tu usuario en `admin_profiles` tiene `role = 'admin'`

### **Opción B: Preparar para el Futuro**

Implementa la jerarquía ahora, pero solo usa `'admin'`:
- Define la jerarquía de roles
- Actualiza `checkRole()` para soportar jerarquía
- Todos tus endpoints siguen usando `checkRole(c, 'admin')`
- Cuando necesites más roles, solo cambias el valor en la BD

---

## 📝 RESUMEN

1. **El rol se determina al hacer cada request al backend:**
   - El backend consulta `admin_profiles` usando el `user_id` del token JWT
   - **NO** viene en el token JWT de Supabase

2. **La jerarquía se implementa en el backend:**
   - Define niveles numéricos para cada rol
   - `checkRole(c, 'editor')` acepta editor, moderator o admin
   - `checkRole(c, 'admin')` solo acepta admin exacto

3. **Para tu caso (solo admin):**
   - Puedes mantener el código actual
   - O implementar jerarquía ahora para facilitar agregar roles después

---

¿Quieres que implemente la jerarquía ahora o prefieres mantenerlo simple hasta que necesites más roles?

