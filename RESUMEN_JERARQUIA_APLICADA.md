# ✅ Jerarquía de Roles Aplicada a Todos los Endpoints

**Fecha:** 2025-01-XX  
**Estado:** ✅ Completado

---

## 📊 Resumen de Cambios

Se ha aplicado jerarquía de roles a **todos los endpoints** del sistema. Ahora cada endpoint requiere un nivel mínimo de privilegios según su función.

---

## 🎯 Estrategia de Niveles Aplicada

### **Nivel `viewer` (Nivel 1) - Lectura Básica**
Cualquier usuario autenticado puede leer contenido público.

**Endpoints actualizados:**
- ✅ `GET /posts` - Listar posts
- ✅ `GET /posts/:id` - Leer post
- ✅ `GET /categories` - Listar categorías
- ✅ `GET /categories/:id` - Leer categoría
- ✅ `GET /upload/list` - Listar imágenes

**Roles que pueden acceder:** `viewer`, `editor`, `moderator`, `admin`

---

### **Nivel `editor` (Nivel 2) - Escritura**
Usuarios con permisos de escritura pueden crear y editar contenido.

**Endpoints actualizados:**
- ✅ `POST /posts` - Crear post
- ✅ `PUT /posts/:id` - Actualizar post
- ✅ `POST /categories` - Crear categoría
- ✅ `PUT /categories/:id` - Actualizar categoría
- ✅ `POST /upload` - Subir imagen

**Roles que pueden acceder:** `editor`, `moderator`, `admin`

---

### **Nivel `moderator` (Nivel 3) - Moderación y Eliminación**
Usuarios con permisos de moderación pueden eliminar contenido y gestionar consultas.

**Endpoints actualizados:**
- ✅ `DELETE /posts/:id` - Eliminar post
- ✅ `DELETE /categories/:id` - Eliminar categoría
- ✅ `DELETE /upload/:name` - Eliminar imagen
- ✅ `GET /consultations` - Listar consultas
- ✅ `GET /consultations/:id` - Leer consulta
- ✅ `PUT /consultations/:id` - Actualizar consulta
- ✅ `DELETE /consultations/:id` - Eliminar consulta

**Roles que pueden acceder:** `moderator`, `admin`

---

### **Nivel `admin` (Nivel 4) - Acceso Completo**
Solo administradores tienen acceso completo a todas las operaciones.

**Nota:** Aunque algunos endpoints requieren niveles inferiores, los admins siempre tienen acceso debido a la jerarquía.

---

## 📋 Tabla Completa de Endpoints

| Endpoint | Método | Nivel Requerido | Roles Permitidos |
|----------|--------|-----------------|------------------|
| `/posts` | GET | `viewer` | viewer, editor, moderator, admin |
| `/posts/:id` | GET | `viewer` | viewer, editor, moderator, admin |
| `/posts` | POST | `editor` | editor, moderator, admin |
| `/posts/:id` | PUT | `editor` | editor, moderator, admin |
| `/posts/:id` | DELETE | `moderator` | moderator, admin |
| `/categories` | GET | `viewer` | viewer, editor, moderator, admin |
| `/categories/:id` | GET | `viewer` | viewer, editor, moderator, admin |
| `/categories` | POST | `editor` | editor, moderator, admin |
| `/categories/:id` | PUT | `editor` | editor, moderator, admin |
| `/categories/:id` | DELETE | `moderator` | moderator, admin |
| `/consultations` | GET | `moderator` | moderator, admin |
| `/consultations/:id` | GET | `moderator` | moderator, admin |
| `/consultations/:id` | PUT | `moderator` | moderator, admin |
| `/consultations/:id` | DELETE | `moderator` | moderator, admin |
| `/upload` | POST | `editor` | editor, moderator, admin |
| `/upload/:name` | DELETE | `moderator` | moderator, admin |
| `/upload/list` | GET | `viewer` | viewer, editor, moderator, admin |
| `/auth/me` | GET | `checkAuth` | Cualquier usuario autenticado |

---

## 🔄 Compatibilidad

### **Para tu Usuario Admin Actual:**

✅ **Todo sigue funcionando igual**

Tu usuario con rol `admin` (nivel 4) tiene acceso a **todos** los endpoints porque:
- `admin` tiene nivel 4, que es superior a todos los demás
- La jerarquía permite que roles superiores accedan a endpoints de niveles inferiores

### **Ejemplo:**

```typescript
// Endpoint requiere nivel 'editor' (nivel 2)
checkRole(c, 'editor')

// Tu usuario admin (nivel 4) → ✅ Acceso permitido
// Usuario editor (nivel 2) → ✅ Acceso permitido
// Usuario viewer (nivel 1) → ❌ Acceso denegado
```

---

## 🎯 Ventajas de esta Implementación

1. **Escalabilidad:** Fácil agregar nuevos roles en el futuro
2. **Seguridad:** Control granular de permisos por operación
3. **Flexibilidad:** Puedes tener usuarios con diferentes niveles de acceso
4. **Mantenibilidad:** Código más claro y fácil de entender

---

## 📝 Archivos Modificados

### **Endpoints de Lectura (GET):**
- ✅ `src/endpoints/posts/postList.ts` - Agregado `checkRole(c, "viewer")`
- ✅ `src/endpoints/posts/postRead.ts` - Agregado `checkRole(c, "viewer")`
- ✅ `src/endpoints/categories/categoryList.ts` - Agregado `checkRole(c, "viewer")`
- ✅ `src/endpoints/categories/categoryRead.ts` - Agregado `checkRole(c, "viewer")`
- ✅ `src/endpoints/upload/listImages.ts` - Agregado `checkRole(c, "viewer")`

### **Endpoints de Escritura (POST/PUT):**
- ✅ `src/endpoints/posts/postCreate.ts` - Cambiado a `checkRole(c, "editor")`
- ✅ `src/endpoints/posts/postUpdate.ts` - Cambiado a `checkRole(c, "editor")`
- ✅ `src/endpoints/categories/categoryCreate.ts` - Cambiado a `checkRole(c, "editor")`
- ✅ `src/endpoints/categories/categoryUpdate.ts` - Cambiado a `checkRole(c, "editor")`
- ✅ `src/endpoints/upload/uploadImage.ts` - Cambiado a `checkRole(c, "editor")`

### **Endpoints de Eliminación (DELETE):**
- ✅ `src/endpoints/posts/postDelete.ts` - Cambiado a `checkRole(c, "moderator")`
- ✅ `src/endpoints/categories/categoryDelete.ts` - Cambiado a `checkRole(c, "moderator")`
- ✅ `src/endpoints/upload/deleteImage.ts` - Cambiado a `checkRole(c, "moderator")`

### **Endpoints de Consultas:**
- ✅ `src/endpoints/consultations/consultationList.ts` - Cambiado a `checkRole(c, "moderator")`
- ✅ `src/endpoints/consultations/consultationRead.ts` - Cambiado a `checkRole(c, "moderator")`
- ✅ `src/endpoints/consultations/consultationUpdate.ts` - Cambiado a `checkRole(c, "moderator")`
- ✅ `src/endpoints/consultations/consultationDelete.ts` - Cambiado a `checkRole(c, "moderator")`

---

## 🧪 Cómo Probar

### **1. Verificar que tu usuario admin sigue funcionando:**

```bash
# Todos estos deberían funcionar con tu usuario admin:
curl -X GET https://tu-api.com/posts \
  -H "Authorization: Bearer <tu-token>"

curl -X POST https://tu-api.com/posts \
  -H "Authorization: Bearer <tu-token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "Test"}'

curl -X DELETE https://tu-api.com/posts/<id> \
  -H "Authorization: Bearer <tu-token>"
```

### **2. Cuando agregues más usuarios:**

```sql
-- Crear usuario con rol 'editor'
INSERT INTO admin_profiles (user_id, role, username, is_active)
VALUES ('uuid-del-usuario', 'editor', 'editor_user', true);

-- Este usuario podrá:
-- ✅ Leer posts y categorías (viewer)
-- ✅ Crear y editar posts y categorías (editor)
-- ❌ NO podrá eliminar (requiere moderator)
-- ❌ NO podrá ver consultas (requiere moderator)
```

---

## ✅ Estado Final

- ✅ Todos los endpoints protegidos con jerarquía
- ✅ Niveles asignados según función del endpoint
- ✅ Compatibilidad mantenida con usuario admin actual
- ✅ Preparado para agregar más roles en el futuro
- ✅ Sin errores de linting
- ✅ Código documentado

---

## 🚀 Próximos Pasos (Opcional)

Cuando necesites agregar más usuarios con diferentes roles:

1. **Crear usuarios en Supabase Auth**
2. **Agregar registros en `admin_profiles` con el rol apropiado:**
   ```sql
   INSERT INTO admin_profiles (user_id, role, username, is_active)
   VALUES ('uuid', 'editor', 'nombre', true);
   ```
3. **Los permisos se aplicarán automáticamente según la jerarquía**

---

**Última actualización:** 2025-01-XX

