# 🗺️ Roadmap de Autorización y Seguridad - Galilea Backend

**Fecha de análisis:** 2025-01-XX  
**Estado actual:** Autenticación implementada, autorización básica implementada

---

## 📊 ESTADO ACTUAL

### ✅ **LO QUE YA ESTÁ IMPLEMENTADO**

#### 1. **Sistema de Autenticación** ✅
- ✅ Validación de tokens JWT de Supabase (`checkAuth`)
- ✅ Verificación de perfil de admin en tabla `admin_profiles`
- ✅ Validación de usuario activo (`is_active`)
- ✅ Contexto de autenticación disponible en `c.get('auth')`

**Archivos:**
- `src/shared/auth.ts` - Funciones `checkAuth()` y `checkRole()`
- `src/endpoints/auth/authMe.ts` - Endpoint para obtener info del usuario autenticado

#### 2. **Protección de Rutas** ✅
Los siguientes endpoints están protegidos con `checkAuth()` + `checkRole('admin')`:

**Posts:**
- ✅ `POST /posts` - Crear post (requiere admin)
- ✅ `PUT /posts/:id` - Actualizar post (requiere admin)
- ✅ `DELETE /posts/:id` - Eliminar post (requiere admin)

**Categories:**
- ✅ `POST /categories` - Crear categoría (requiere admin)
- ✅ `PUT /categories/:id` - Actualizar categoría (requiere admin)
- ✅ `DELETE /categories/:id` - Eliminar categoría (requiere admin)

**Consultations:**
- ✅ `GET /consultations` - Listar consultas (requiere admin)
- ✅ `GET /consultations/:id` - Leer consulta (requiere admin)
- ✅ `PUT /consultations/:id` - Actualizar consulta (requiere admin)
- ✅ `DELETE /consultations/:id` - Eliminar consulta (requiere admin)

**Upload:**
- ✅ `POST /upload` - Subir imagen (requiere admin)
- ✅ `DELETE /upload/:name` - Eliminar imagen (requiere admin)

**Auth:**
- ✅ `GET /auth/me` - Obtener info del usuario autenticado (requiere auth)

#### 3. **Rate Limiting** ✅
- ✅ Implementado en `src/shared/rateLimit.ts`
- ✅ Aplicado en endpoints públicos: `POST /email` y `POST /consultations`
- ✅ Configurable mediante variables de entorno

---

### ❌ **LO QUE FALTA (AUTORIZACIÓN GRANULAR)**

#### 1. **Sistema de Roles Limitado** 🔴 CRÍTICO
**Problema actual:**
- Solo existe un rol: `"admin"`
- No hay roles intermedios como `"editor"`, `"viewer"`, `"moderator"`
- La función `checkRole()` solo verifica si es `"admin"` o no

**Impacto:**
- No puedes tener usuarios con permisos parciales
- Todos los usuarios autenticados necesitan ser admin para hacer cualquier operación

**Ejemplo de lo que falta:**
```typescript
// Actualmente solo:
checkRole(c, 'admin')

// Debería soportar:
checkRole(c, ['admin', 'editor'])  // admin O editor
checkPermission(c, 'posts:write')  // Permiso específico
```

#### 2. **Autorización Basada en Recursos** 🔴 CRÍTICO
**Problema actual:**
- No se verifica si un usuario puede modificar solo SUS propios recursos
- Un usuario podría modificar posts de otros usuarios si tuviera acceso

**Ejemplo de lo que falta:**
```typescript
// En postUpdate.ts debería verificar:
const post = await getPost(id);
if (post.author_id !== auth.userId && auth.role !== 'admin') {
  return c.json({ error: 'No puedes modificar posts de otros usuarios' }, 403);
}
```

**Endpoints afectados:**
- `PUT /posts/:id` - Debería permitir al autor editar su propio post
- `DELETE /posts/:id` - Debería permitir al autor eliminar su propio post

#### 3. **Endpoints de Lectura Sin Protección** 🟠 ALTA
**Problema actual:**
Los siguientes endpoints son completamente públicos (sin autenticación):

- ❌ `GET /posts` - Listar posts (público)
- ❌ `GET /posts/:id` - Leer post (público)
- ❌ `GET /categories` - Listar categorías (público)
- ❌ `GET /categories/:id` - Leer categoría (público)
- ❌ `GET /upload/list` - Listar imágenes (público)

**Consideraciones:**
- Algunos pueden ser intencionalmente públicos (ej: posts del blog)
- Pero deberías poder tener posts privados o borradores
- Deberías poder controlar qué usuarios pueden ver qué contenido

#### 4. **OpenAPI Docs Sin Protección** 🔴 CRÍTICO
**Problema actual:**
- La documentación completa de la API está en `/` (raíz)
- Cualquiera puede ver todos los endpoints, schemas, validaciones
- Expone información sensible sobre la estructura de la API

**Ubicación:** `src/index.ts:122-131`

#### 5. **Falta de Permisos Granulares** 🟠 ALTA
**Problema actual:**
- No hay sistema de permisos específicos por acción
- No puedes tener usuarios que puedan crear pero no eliminar
- No puedes tener usuarios que solo puedan ver ciertos recursos

**Ejemplo de lo que falta:**
```typescript
// Permisos que deberías poder verificar:
- 'posts:read'    - Puede leer posts
- 'posts:write'   - Puede crear/editar posts
- 'posts:delete'  - Puede eliminar posts
- 'categories:read'
- 'categories:write'
- 'consultations:read'
- 'consultations:write'
- 'upload:write'
```

#### 6. **Falta de Middleware de Autorización** 🟡 MEDIA
**Problema actual:**
- Cada endpoint llama manualmente a `checkAuth()` y `checkRole()`
- Código repetitivo
- Fácil olvidar proteger un endpoint nuevo

**Solución sugerida:**
- Middleware a nivel de router que proteja automáticamente
- Decoradores o helpers que simplifiquen la protección

---

## 🎯 ROADMAP DE PRÓXIMOS PASOS

### **FASE 1: Autorización Granular (Prioridad ALTA)** 🔴

#### **Paso 1.1: Expandir Sistema de Roles**
**Objetivo:** Implementar múltiples roles con jerarquía

**Tareas:**
1. Definir roles en la base de datos:
   - `admin` - Acceso completo
   - `editor` - Puede crear/editar posts y categorías
   - `viewer` - Solo lectura
   - `moderator` - Puede moderar consultas

2. Actualizar función `checkRole()` para soportar múltiples roles:
```typescript
// Permitir múltiples roles
checkRole(c, ['admin', 'editor'])

// O verificar jerarquía de roles
checkRoleOrHigher(c, 'editor')  // editor, admin
```

3. Actualizar tabla `admin_profiles` si es necesario para soportar nuevos roles

**Archivos a modificar:**
- `src/shared/auth.ts` - Función `checkRole()`
- Migración de BD si es necesario

**Tiempo estimado:** 2-3 horas

---

#### **Paso 1.2: Implementar Autorización Basada en Recursos**
**Objetivo:** Verificar ownership de recursos antes de permitir modificaciones

**Tareas:**
1. Crear función helper `checkResourceOwnership()`:
```typescript
async function checkResourceOwnership(
  c: AppContext,
  resourceType: 'post' | 'consultation',
  resourceId: string
): Promise<Response | null>
```

2. Actualizar endpoints de modificación:
   - `PUT /posts/:id` - Verificar que `post.author_id === auth.userId` O `auth.role === 'admin'`
   - `DELETE /posts/:id` - Misma verificación
   - `PUT /consultations/:id` - Verificar ownership si aplica

**Archivos a modificar:**
- `src/shared/auth.ts` - Nueva función `checkResourceOwnership()`
- `src/endpoints/posts/postUpdate.ts`
- `src/endpoints/posts/postDelete.ts`

**Tiempo estimado:** 3-4 horas

---

#### **Paso 1.3: Proteger Endpoints de Lectura**
**Objetivo:** Hacer que los endpoints de lectura requieran autenticación (opcionalmente)

**Decisiones a tomar:**
- ¿Los posts deben ser públicos o privados?
- ¿Algunos posts pueden ser públicos y otros privados?
- ¿Los usuarios autenticados ven más información que los públicos?

**Opciones de implementación:**

**Opción A: Autenticación opcional (recomendado)**
```typescript
// Permitir acceso público pero dar más info si está autenticado
const auth = await checkAuth(c);  // No retorna error si no hay token
if (auth) {
  // Mostrar posts privados también
} else {
  // Solo posts públicos
}
```

**Opción B: Autenticación requerida**
```typescript
// Requerir autenticación para todos los endpoints de lectura
const authError = await checkAuth(c);
if (authError) return authError;
```

**Archivos a modificar:**
- `src/endpoints/posts/postList.ts`
- `src/endpoints/posts/postRead.ts`
- `src/endpoints/categories/categoryList.ts`
- `src/endpoints/categories/categoryRead.ts`

**Tiempo estimado:** 2-3 horas

---

### **FASE 2: Seguridad Adicional (Prioridad MEDIA)** 🟠

#### **Paso 2.1: Proteger OpenAPI Docs**
**Objetivo:** Requerir autenticación para acceder a la documentación

**Tareas:**
1. Crear middleware que proteja la ruta `/`
2. O mover docs a `/docs` y protegerla
3. O deshabilitar en producción

**Implementación sugerida:**
```typescript
// En index.ts, antes de crear openapi
app.get("/", async (c) => {
  const authError = await checkAuth(c);
  if (authError) return authError;
  // Redirigir a docs o mostrar contenido
});
```

**Archivos a modificar:**
- `src/index.ts`

**Tiempo estimado:** 1 hora

---

#### **Paso 2.2: Implementar Sistema de Permisos Granulares**
**Objetivo:** Sistema de permisos específicos por acción y recurso

**Tareas:**
1. Definir estructura de permisos:
   - Tabla `permissions` o campo JSON en `admin_profiles`
   - O usar roles con permisos predefinidos

2. Crear función `checkPermission()`:
```typescript
function checkPermission(
  c: AppContext,
  permission: string  // ej: 'posts:write', 'categories:delete'
): Response | null
```

3. Mapear roles a permisos:
```typescript
const rolePermissions = {
  admin: ['*'],  // Todos los permisos
  editor: ['posts:read', 'posts:write', 'categories:read', 'categories:write'],
  viewer: ['posts:read', 'categories:read'],
  moderator: ['consultations:read', 'consultations:write']
};
```

**Archivos a modificar:**
- `src/shared/auth.ts` - Nueva función `checkPermission()`
- Actualizar endpoints para usar permisos en lugar de solo roles

**Tiempo estimado:** 4-5 horas

---

#### **Paso 2.3: Crear Middleware de Autorización**
**Objetivo:** Simplificar la protección de endpoints

**Tareas:**
1. Crear middleware reutilizable:
```typescript
function requireAuth(requiredRole?: string | string[]) {
  return async (c: AppContext, next: Next) => {
    const authError = await checkAuth(c);
    if (authError) return authError;
    
    if (requiredRole) {
      const roleError = checkRole(c, requiredRole);
      if (roleError) return roleError;
    }
    
    await next();
  };
}
```

2. Aplicar en routers:
```typescript
postsRouter.use("/*", requireAuth(['admin', 'editor']));
postsRouter.post("/", requireAuth('admin'));
```

**Archivos a modificar:**
- `src/shared/auth.ts` - Nuevo middleware
- Todos los routers

**Tiempo estimado:** 2-3 horas

---

### **FASE 3: Mejoras y Optimizaciones (Prioridad BAJA)** 🟡

#### **Paso 3.1: Implementar Caché de Permisos**
**Objetivo:** Evitar consultas repetidas a la BD por permisos

**Tareas:**
1. Cachear permisos del usuario en memoria (durante la request)
2. O usar Cloudflare KV para cachear entre requests

**Tiempo estimado:** 2-3 horas

---

#### **Paso 3.2: Logging de Accesos**
**Objetivo:** Registrar quién accede a qué recursos

**Tareas:**
1. Crear tabla `access_logs` o usar servicio de logging
2. Registrar accesos a recursos sensibles
3. Alertas para accesos sospechosos

**Tiempo estimado:** 3-4 horas

---

#### **Paso 3.3: Tests de Autorización**
**Objetivo:** Asegurar que la autorización funciona correctamente

**Tareas:**
1. Tests unitarios para funciones de auth
2. Tests de integración para endpoints protegidos
3. Tests de casos edge (usuario sin permisos, recursos de otros usuarios, etc.)

**Tiempo estimado:** 4-5 horas

---

## 📋 RESUMEN DE PRIORIDADES

### 🔴 **CRÍTICO (Hacer primero)**
1. ✅ Expandir sistema de roles (Paso 1.1)
2. ✅ Autorización basada en recursos (Paso 1.2)
3. ✅ Proteger OpenAPI docs (Paso 2.1)

### 🟠 **ALTA (Hacer después)**
4. ✅ Proteger endpoints de lectura (Paso 1.3)
5. ✅ Sistema de permisos granulares (Paso 2.2)
6. ✅ Middleware de autorización (Paso 2.3)

### 🟡 **MEDIA (Mejoras)**
7. ✅ Caché de permisos (Paso 3.1)
8. ✅ Logging de accesos (Paso 3.2)
9. ✅ Tests de autorización (Paso 3.3)

---

## 🎯 ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### **Semana 1: Fundamentos**
1. **Día 1-2:** Paso 1.1 (Expandir roles)
2. **Día 3-4:** Paso 1.2 (Autorización basada en recursos)
3. **Día 5:** Paso 2.1 (Proteger OpenAPI docs)

### **Semana 2: Granularidad**
4. **Día 1-2:** Paso 1.3 (Proteger lectura)
5. **Día 3-4:** Paso 2.2 (Permisos granulares)
6. **Día 5:** Paso 2.3 (Middleware)

### **Semana 3: Optimizaciones**
7. **Día 1-2:** Paso 3.1 (Caché)
8. **Día 3-4:** Paso 3.2 (Logging)
9. **Día 5:** Paso 3.3 (Tests)

---

## 📝 NOTAS IMPORTANTES

### **Decisiones Pendientes**
1. **Posts públicos vs privados:** ¿Deben ser públicos por defecto o privados?
2. **Roles adicionales:** ¿Qué roles necesitas además de admin?
3. **Permisos específicos:** ¿Necesitas control fino o con roles es suficiente?

### **Consideraciones de Seguridad**
- Todos los cambios deben mantener la compatibilidad con la extensión
- Probar que los tokens JWT siguen funcionando correctamente
- Verificar que RLS en Supabase no interfiera con la autorización

### **Compatibilidad con Extensión**
- La extensión ya envía tokens en `Authorization: Bearer <token>`
- Asegurar que los nuevos checks de autorización no rompan el flujo existente
- Considerar versionado de API si haces cambios breaking

---

## 🔍 ARCHIVOS CLAVE PARA REVISAR

### **Backend:**
- `src/shared/auth.ts` - Lógica de autenticación/autorización
- `src/endpoints/*/router.ts` - Routers que necesitan protección
- `src/index.ts` - Configuración de OpenAPI docs

### **Extensión:**
- `src/utils/auth.ts` - Autenticación del cliente
- `src/utils/apiClient.ts` - Cliente API que envía tokens

### **Base de Datos:**
- Tabla `admin_profiles` - Roles de usuarios
- Políticas RLS en Supabase (si aplican)

---

**Última actualización:** 2025-01-XX  
**Próxima revisión:** Después de implementar Fase 1

