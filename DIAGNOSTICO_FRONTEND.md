# 🔍 Diagnóstico: Posts no se Listan en Página Principal

**Problema reportado:** Los posts se listan correctamente en la página del blog, pero no aparecen en la página principal.

---

## ✅ Cambios Realizados en el Backend

He hecho **públicos** los siguientes endpoints (sin autenticación):

- ✅ `GET /posts` - Listar posts
- ✅ `GET /posts/:id` - Leer post específico
- ✅ `GET /categories` - Listar categorías
- ✅ `GET /categories/:id` - Leer categoría específica
- ✅ `GET /upload/list` - Listar imágenes

Estos endpoints ahora pueden ser llamados **sin token de autenticación** desde el frontend público.

---

## 🔍 Posibles Causas del Problema

### **1. CORS - Origen No Permitido**

**Síntoma:** El navegador bloquea las peticiones con error de CORS.

**Verificación:**
```javascript
// En la consola del navegador, verificar errores:
// "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
```

**Solución:**
- Verificar que el dominio del frontend está en `CORS_ORIGINS` en Cloudflare Workers
- Verificar configuración en `src/shared/corsConfig.ts`

---

### **2. URL de API Incorrecta**

**Síntoma:** Las peticiones fallan con 404 o no llegan al servidor.

**Verificación:**
```javascript
// Verificar en Network tab del navegador:
// - ¿La URL es correcta?
// - ¿El método es GET?
// - ¿Hay algún error 404, 500, etc?
```

**Solución:**
- Verificar que la URL base de la API es correcta
- Verificar que no hay diferencias entre la URL del blog y la página principal

---

### **3. Diferencias en el Código del Frontend**

**Síntoma:** El blog funciona pero la página principal no, aunque usan el mismo endpoint.

**Posibles causas:**
- La página principal podría estar usando un endpoint diferente
- La página principal podría estar esperando un formato de respuesta diferente
- La página principal podría tener un error de JavaScript que impide mostrar los posts

**Verificación:**
```javascript
// Comparar el código que hace fetch en:
// - Página del blog (que funciona)
// - Página principal (que no funciona)

// Verificar:
// 1. ¿Usan la misma URL?
// 2. ¿Usan el mismo método (GET)?
// 3. ¿Procesan la respuesta de la misma manera?
// 4. ¿Hay diferencias en headers?
```

---

### **4. Problema de Timing/Carga**

**Síntoma:** Los posts no aparecen porque el componente se renderiza antes de que llegue la respuesta.

**Verificación:**
```javascript
// Verificar en Network tab:
// - ¿La petición se completa exitosamente?
// - ¿La respuesta tiene datos?
// - ¿Hay algún error en la consola de JavaScript?
```

**Solución:**
- Verificar que el código espera la respuesta antes de renderizar
- Verificar manejo de estados de carga (loading, error, success)

---

### **5. Filtros o Parámetros Diferentes**

**Síntoma:** La página principal podría estar usando filtros que no devuelven resultados.

**Verificación:**
```javascript
// Comparar las URLs completas:
// Blog: GET /posts?limit=10&offset=0
// Principal: GET /posts?category_id=1&limit=5

// Verificar si hay diferencias en:
// - Query parameters
// - Headers
// - Body (aunque GET no debería tener body)
```

---

## 🧪 Pasos para Diagnosticar

### **Paso 1: Verificar que el Backend Responde Correctamente**

```bash
# Probar directamente el endpoint sin autenticación
curl -X GET https://tu-api.com/posts

# Debería devolver un JSON con los posts
# Si devuelve 401, hay un problema de autenticación
# Si devuelve 200 pero vacío, no hay posts en la BD
```

### **Paso 2: Verificar en el Navegador**

1. Abrir la página principal en el navegador
2. Abrir DevTools (F12)
3. Ir a la pestaña **Network**
4. Recargar la página
5. Buscar la petición a `/posts`
6. Verificar:
   - **Status:** ¿200 OK?
   - **Response:** ¿Tiene datos?
   - **Headers:** ¿Hay algún error de CORS?

### **Paso 3: Comparar con la Página del Blog**

1. Abrir la página del blog
2. Repetir el proceso anterior
3. Comparar:
   - ¿Las URLs son iguales?
   - ¿Los métodos son iguales?
   - ¿Las respuestas son iguales?
   - ¿Hay diferencias en headers?

### **Paso 4: Verificar Código del Frontend**

```javascript
// Buscar en el código del frontend:
// 1. ¿Cómo se hace fetch en la página principal?
// 2. ¿Cómo se hace fetch en la página del blog?
// 3. ¿Hay diferencias?

// Ejemplo de código que debería funcionar:
fetch('https://tu-api.com/posts')
  .then(response => response.json())
  .then(data => {
    console.log('Posts:', data);
    // Renderizar posts
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

---

## 🔧 Soluciones Comunes

### **Si el problema es CORS:**

1. Verificar `CORS_ORIGINS` en Cloudflare Workers
2. Agregar el dominio del frontend a la lista de orígenes permitidos
3. Verificar que el protocolo (http/https) coincida

### **Si el problema es la URL:**

1. Verificar que la URL base de la API es correcta
2. Verificar que no hay diferencias entre entornos (dev/prod)
3. Verificar que no hay typos en la URL

### **Si el problema es el código del frontend:**

1. Comparar el código de la página del blog (que funciona) con la página principal
2. Verificar que se espera la respuesta antes de renderizar
3. Verificar manejo de errores

---

## 📝 Checklist de Verificación

- [ ] El endpoint `GET /posts` responde correctamente sin autenticación
- [ ] No hay errores de CORS en la consola del navegador
- [ ] La URL de la API es correcta en ambas páginas
- [ ] El código del frontend hace fetch correctamente
- [ ] La respuesta del backend tiene el formato esperado
- [ ] No hay errores de JavaScript en la consola
- [ ] Los posts existen en la base de datos

---

## 🆘 Si el Problema Persiste

Si después de verificar todo lo anterior el problema persiste:

1. **Compartir logs del backend:**
   - Verificar en Cloudflare Workers logs si las peticiones llegan
   - Verificar si hay errores en los logs

2. **Compartir información del frontend:**
   - URL exacta que se está usando
   - Código que hace el fetch
   - Errores en la consola del navegador
   - Respuesta del Network tab

3. **Verificar configuración:**
   - Variables de entorno en Cloudflare Workers
   - Configuración de CORS
   - Configuración de rate limiting

---

**Última actualización:** 2025-01-XX

