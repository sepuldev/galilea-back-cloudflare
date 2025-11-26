# 🌐 Endpoints Públicos - Configuración

**Fecha:** 2025-01-XX  
**Estado:** ✅ Configurado

---

## 📋 Endpoints Públicos (Sin Autenticación)

Estos endpoints son accesibles para **cualquier usuario** sin necesidad de autenticación. Están diseñados para el frontend público.

### **Posts (Lectura)**
- ✅ `GET /posts` - Listar todos los posts
- ✅ `GET /posts/:id` - Leer un post específico

**Uso:** Permite que cualquier visitante del sitio web pueda ver el blog y los posts.

---

### **Categorías (Lectura)**
- ✅ `GET /categories` - Listar todas las categorías
- ✅ `GET /categories/:id` - Leer una categoría específica

**Uso:** Permite que cualquier visitante pueda ver las categorías disponibles.

---

### **Imágenes (Lectura)**
- ✅ `GET /upload/list` - Listar imágenes disponibles

**Uso:** Permite que cualquier visitante pueda ver las imágenes públicas.

---

### **Consultas (Creación)**
- ✅ `POST /consultations` - Crear una consulta

**Protección:** Rate limiting (100 requests por minuto por defecto)

**Uso:** Permite que cualquier usuario pueda enviar una consulta sin necesidad de autenticarse.

---

### **Emails (Envío)**
- ✅ `POST /email` - Enviar email de contacto

**Protección:** Rate limiting estricto (5 requests por minuto)

**Uso:** Permite que cualquier usuario pueda enviar un email de contacto.

---

## 🔒 Endpoints Protegidos (Requieren Autenticación)

Estos endpoints **SÍ requieren autenticación** y roles específicos:

### **Posts (Escritura/Eliminación)**
- 🔒 `POST /posts` - Crear post (requiere `editor` o superior)
- 🔒 `PUT /posts/:id` - Actualizar post (requiere `editor` o superior)
- 🔒 `DELETE /posts/:id` - Eliminar post (requiere `moderator` o superior)

### **Categorías (Escritura/Eliminación)**
- 🔒 `POST /categories` - Crear categoría (requiere `editor` o superior)
- 🔒 `PUT /categories/:id` - Actualizar categoría (requiere `editor` o superior)
- 🔒 `DELETE /categories/:id` - Eliminar categoría (requiere `moderator` o superior)

### **Consultas (Lectura/Modificación)**
- 🔒 `GET /consultations` - Listar consultas (requiere `moderator` o superior)
- 🔒 `GET /consultations/:id` - Leer consulta (requiere `moderator` o superior)
- 🔒 `PUT /consultations/:id` - Actualizar consulta (requiere `moderator` o superior)
- 🔒 `DELETE /consultations/:id` - Eliminar consulta (requiere `moderator` o superior)

### **Upload (Escritura/Eliminación)**
- 🔒 `POST /upload` - Subir imagen (requiere `editor` o superior)
- 🔒 `DELETE /upload/:name` - Eliminar imagen (requiere `moderator` o superior)

### **Auth**
- 🔒 `GET /auth/me` - Obtener info del usuario autenticado (requiere autenticación)

---

## 🛡️ Protección de Endpoints Públicos

Aunque los endpoints públicos no requieren autenticación, tienen protección contra abuso:

### **Rate Limiting**

1. **Consultas (`POST /consultations`):**
   - Límite: 100 requests por minuto (configurable)
   - Tracking: Por IP del cliente

2. **Emails (`POST /email`):**
   - Límite: 5 requests por minuto (configurable)
   - Tracking: Por IP del cliente
   - **Más estricto** porque envía emails reales

### **CORS**

Los endpoints públicos respetan la configuración CORS:
- Solo dominios permitidos pueden hacer requests
- Configurado en `src/shared/corsConfig.ts`

---

## 📊 Resumen

| Tipo de Endpoint | Público | Protegido | Total |
|------------------|---------|-----------|-------|
| **Lectura (GET)** | 5 | 2 | 7 |
| **Escritura (POST)** | 2 | 3 | 5 |
| **Actualización (PUT)** | 0 | 3 | 3 |
| **Eliminación (DELETE)** | 0 | 4 | 4 |
| **TOTAL** | **7** | **12** | **19** |

---

## 🔍 Verificación

### **Endpoints Públicos - Sin Token:**

```bash
# Debería funcionar sin Authorization header
curl -X GET https://tu-api.com/posts
curl -X GET https://tu-api.com/posts/123
curl -X GET https://tu-api.com/categories
curl -X POST https://tu-api.com/consultations \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Test", ...}'
```

### **Endpoints Protegidos - Con Token:**

```bash
# Requiere Authorization header
curl -X POST https://tu-api.com/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", ...}'
```

---

## ⚠️ Notas Importantes

1. **Posts y Categorías:** Son completamente públicos para lectura. Cualquier visitante puede verlos.

2. **Consultas y Emails:** Son públicos para creación, pero están protegidos con rate limiting para prevenir spam.

3. **Modificaciones:** Todas las operaciones de escritura, actualización y eliminación requieren autenticación y roles apropiados.

4. **Frontend Público:** Puede usar los endpoints públicos sin necesidad de autenticación.

5. **Frontend Admin (Extensión):** Requiere autenticación para todas las operaciones de gestión.

---

**Última actualización:** 2025-01-XX

