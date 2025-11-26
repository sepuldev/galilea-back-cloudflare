# ✅ Implementación de Jerarquía de Roles - Completada

**Fecha:** 2025-01-XX  
**Estado:** ✅ Implementado y listo para usar

---

## 🎯 Lo que se Implementó

### **1. Jerarquía de Roles Definida**

```typescript
ROLE_HIERARCHY = {
  viewer: 1,      // Solo lectura
  editor: 2,      // Lectura + escritura (posts, categories)
  moderator: 3,   // Lectura + escritura + moderación (consultations)
  admin: 4,       // Acceso completo
}
```

### **2. Funciones Helper**

- `getRoleLevel(role: string)`: Obtiene el nivel numérico de un rol
- `hasRoleLevel(userRole: string, requiredLevel: number)`: Verifica si un rol tiene el nivel requerido o superior

### **3. `checkRole()` Mejorado**

Ahora soporta:
- ✅ **Rol específico**: `checkRole(c, 'admin')` - Solo admin (sin jerarquía)
- ✅ **Nivel mínimo**: `checkRole(c, 'editor')` - Acepta editor, moderator o admin (con jerarquía)
- ✅ **Múltiples roles**: `checkRole(c, ['admin', 'moderator'])` - Acepta cualquiera de los roles especificados

---

## 🔄 Compatibilidad

**✅ Todos los endpoints existentes siguen funcionando sin cambios**

El código actual que usa `checkRole(c, 'admin')` sigue funcionando exactamente igual:
- Solo acepta usuarios con rol `'admin'` exacto
- No hay cambios breaking

---

## 📝 Ejemplos de Uso

### **Ejemplo 1: Solo Admin (Actual - Sin Cambios)**
```typescript
// Endpoints que requieren admin completo
const authError = await checkAuth(c);
if (authError) return authError;

const roleError = checkRole(c, 'admin');  // Solo admin
if (roleError) return roleError;
```

**Endpoints que usan esto:**
- `POST /posts` - Crear post
- `PUT /posts/:id` - Actualizar post
- `DELETE /posts/:id` - Eliminar post
- `POST /categories` - Crear categoría
- `PUT /categories/:id` - Actualizar categoría
- `DELETE /categories/:id` - Eliminar categoría
- `DELETE /upload/:name` - Eliminar imagen
- `POST /upload` - Subir imagen

### **Ejemplo 2: Editor o Superior (Nuevo - Con Jerarquía)**
```typescript
// Endpoints que permiten editor, moderator o admin
const authError = await checkAuth(c);
if (authError) return authError;

const roleError = checkRole(c, 'editor');  // Acepta editor, moderator, admin
if (roleError) return roleError;
```

**Casos de uso:**
- Si el usuario tiene rol `'editor'` → ✅ Acceso permitido
- Si el usuario tiene rol `'moderator'` → ✅ Acceso permitido
- Si el usuario tiene rol `'admin'` → ✅ Acceso permitido
- Si el usuario tiene rol `'viewer'` → ❌ Acceso denegado

### **Ejemplo 3: Moderator o Superior**
```typescript
// Endpoints de moderación
const authError = await checkAuth(c);
if (authError) return authError;

const roleError = checkRole(c, 'moderator');  // Acepta moderator, admin
if (roleError) return roleError;
```

**Casos de uso:**
- Si el usuario tiene rol `'moderator'` → ✅ Acceso permitido
- Si el usuario tiene rol `'admin'` → ✅ Acceso permitido
- Si el usuario tiene rol `'editor'` → ❌ Acceso denegado
- Si el usuario tiene rol `'viewer'` → ❌ Acceso denegado

### **Ejemplo 4: Múltiples Roles Específicos**
```typescript
// Endpoints que permiten admin o moderator (pero no editor)
const authError = await checkAuth(c);
if (authError) return authError;

const roleError = checkRole(c, ['admin', 'moderator']);
if (roleError) return roleError;
```

**Casos de uso:**
- Si el usuario tiene rol `'admin'` → ✅ Acceso permitido
- Si el usuario tiene rol `'moderator'` → ✅ Acceso permitido
- Si el usuario tiene rol `'editor'` → ❌ Acceso denegado
- Si el usuario tiene rol `'viewer'` → ❌ Acceso denegado

---

## 🗄️ Configuración en Base de Datos

### **Para tu Usuario Admin Actual:**

El rol se almacena en la tabla `admin_profiles` en Supabase:

```sql
-- Verificar el rol actual
SELECT user_id, role, username, is_active 
FROM admin_profiles;

-- Asegurar que tu usuario tiene rol 'admin'
UPDATE admin_profiles 
SET role = 'admin' 
WHERE user_id = 'tu-user-id-aqui';
```

### **Para Agregar Nuevos Roles en el Futuro:**

```sql
-- Crear un usuario con rol 'editor'
INSERT INTO admin_profiles (user_id, role, username, is_active)
VALUES (
  'uuid-del-usuario-de-supabase-auth',
  'editor',  -- o 'viewer', 'moderator', 'admin'
  'nombre_usuario',
  true
);
```

---

## 🧪 Cómo Probar

### **1. Verificar que tu usuario admin sigue funcionando:**

```bash
# Hacer una request a un endpoint protegido
curl -X POST https://tu-api.com/posts \
  -H "Authorization: Bearer <tu-token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "Test"}'
```

Debería funcionar igual que antes.

### **2. Probar jerarquía (cuando tengas más roles):**

```typescript
// En un endpoint, cambiar temporalmente:
const roleError = checkRole(c, 'editor');  // En lugar de 'admin'

// Si tu usuario tiene rol 'admin', debería seguir funcionando
// porque admin tiene nivel superior a editor
```

---

## 📋 Resumen de Cambios

### **Archivos Modificados:**
- ✅ `src/shared/auth.ts` - Agregada jerarquía y funciones helper

### **Archivos NO Modificados (Compatibilidad):**
- ✅ Todos los endpoints existentes siguen funcionando
- ✅ No se requieren cambios en la extensión
- ✅ No se requieren cambios en la base de datos (por ahora)

---

## 🚀 Próximos Pasos (Opcional)

Cuando necesites agregar más roles:

1. **Crear usuarios con nuevos roles en la BD:**
   ```sql
   INSERT INTO admin_profiles (user_id, role, ...) 
   VALUES (..., 'editor', ...);
   ```

2. **Actualizar endpoints para usar jerarquía:**
   ```typescript
   // Cambiar de:
   checkRole(c, 'admin')
   
   // A:
   checkRole(c, 'editor')  // Permite editor, moderator, admin
   ```

3. **Probar que funciona correctamente**

---

## ✅ Estado Actual

- ✅ Jerarquía implementada
- ✅ Compatibilidad con código existente mantenida
- ✅ Listo para usar con tu usuario admin actual
- ✅ Preparado para agregar más roles en el futuro

**No necesitas hacer nada más por ahora.** Tu código actual sigue funcionando exactamente igual, pero ahora tienes la flexibilidad de agregar más roles cuando lo necesites.

---

**Última actualización:** 2025-01-XX

