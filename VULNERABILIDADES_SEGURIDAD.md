# 🔒 Auditoría de Seguridad - Galilea Backend

**Fecha:** 2025-01-XX  
**Revisión:** Código base completo

---

## ⚠️ VULNERABILIDADES CRÍTICAS

### 1. **SQL Injection Potencial** 🔴 CRÍTICO
**Ubicación:** `src/endpoints/posts/postList.ts:53` y `src/endpoints/consultations/consultationList.ts:51`

**Problema:**
```typescript
const searchTerm = `%${data.query.search}%`;
const searchConditions = `title.ilike."${searchTerm}",content.ilike."${searchTerm}"`;
query = query.or(searchConditions);
```

**Riesgo:** Aunque Supabase usa parámetros preparados, la construcción de la query con interpolación directa puede ser vulnerable si el input no está completamente sanitizado.

**Recomendación:**
- Usar métodos de Supabase que escapen automáticamente: `query.ilike('title', searchTerm)`
- Validar y sanitizar el input antes de usarlo
- Limitar caracteres especiales permitidos

---

### 2. **Autenticación Débil en Producción** 🔴 CRÍTICO
**Ubicación:** `src/shared/auth.ts:44`

**Problema:**
```typescript
if (!validKeys) {
  console.warn("[AUTH] API_KEYS no configurada - Acceso permitido (modo desarrollo)");
  return true; // ⚠️ PERMITE ACCESO SIN AUTENTICACIÓN
}
```

**Riesgo:** Si `API_KEYS` no está configurado en producción, todos los endpoints protegidos quedan abiertos.

**Recomendación:**
- En producción, SIEMPRE requerir API_KEYS
- Retornar `false` si no está configurado en producción
- Detectar entorno (producción vs desarrollo) y aplicar lógica diferente

---

### 3. **OpenAPI Docs Públicas Sin Protección** 🔴 CRÍTICO
**Ubicación:** `src/index.ts:290`

**Problema:**
```typescript
const openapi = fromHono(app, {
  docs_url: "/", // ⚠️ Accesible públicamente
});
```

**Riesgo:** La documentación completa de la API está expuesta públicamente, revelando:
- Estructura de endpoints
- Esquemas de datos
- Validaciones
- Posibles vectores de ataque

**Recomendación:**
- Proteger `/` con autenticación
- O mover a `/docs` y proteger
- O deshabilitar en producción

---

## 🟠 VULNERABILIDADES ALTAS

### 4. **Exposición de Información Sensible en Logs** 🟠 ALTA
**Ubicación:** Múltiples archivos (266 console.log encontrados)

**Problemas:**
- `postList.ts:109` - Log completo de resultados con datos sensibles
- `consultationList.ts:112` - Log de consultas con datos personales (DNI, email)
- `emailCreate.ts:50` - Log de datos del formulario
- `index.ts:191-192` - Log de orígenes CORS permitidos

**Riesgo:**
- Datos personales (DNI, emails, teléfonos) en logs
- Información de estructura de BD
- Configuración de CORS expuesta

**Recomendación:**
- Eliminar logs en producción o usar niveles de log
- Sanitizar datos antes de loguear (ej: `email.substring(0,3) + "***"`)
- No loguear datos personales completos
- Usar variables de entorno para controlar verbosidad

---

### 5. **CORS con Wildcards Demasiado Permisivos** 🟠 ALTA
**Ubicación:** `src/shared/corsConfig.ts:108`

**Problema:**
```typescript
allowedOrigins = [
  "https://*.vercel.app", // ⚠️ Cualquier subdominio de Vercel
];
```

**Riesgo:** Cualquier aplicación desplegada en Vercel puede hacer peticiones a tu API.

**Recomendación:**
- Listar dominios específicos en producción
- Usar wildcards solo en desarrollo
- Validar dominio exacto en producción

---

### 6. **Falta de Headers de Seguridad** 🟠 ALTA
**Ubicación:** `src/index.ts` (no implementado)

**Problema:** No se establecen headers de seguridad estándar:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy`

**Riesgo:** Vulnerable a:
- Clickjacking
- MIME type sniffing
- XSS attacks

**Recomendación:**
- Añadir middleware que establezca estos headers en todas las respuestas

---

### 7. **Rate Limiting en Memoria (No Persistente)** 🟠 ALTA
**Ubicación:** `src/shared/rateLimit.ts:26`

**Problema:**
```typescript
const rateLimitCache = new Map<string, RateLimitEntry>();
```

**Riesgo:**
- Se resetea en cada reinicio del Worker
- No funciona en múltiples instancias
- Atacante puede hacer muchas requests después de reinicio

**Recomendación:**
- Usar Cloudflare KV o Durable Objects para persistencia
- O usar Cloudflare Rate Limiting nativo

---

### 8. **Falta de Validación de Límites en Paginación** 🟠 ALTA
**Ubicación:** `src/endpoints/posts/postList.ts:79-87`

**Problema:**
```typescript
if (data.query.limit) {
  query = query.limit(data.query.limit); // ⚠️ Sin límite máximo
}
```

**Riesgo:** Atacante puede hacer queries con `limit=1000000`, causando:
- Consumo excesivo de recursos
- Denegación de servicio
- Costos elevados

**Recomendación:**
- Establecer límite máximo (ej: 100)
- Validar que `limit <= 100`
- Validar que `offset` no sea negativo

---

## 🟡 VULNERABILIDADES MEDIAS

### 9. **Exposición de Estructura de BD en Errores** 🟡 MEDIA
**Ubicación:** Múltiples endpoints

**Problema:**
```typescript
return c.json({
  success: false,
  errors: [{ code: 400, message: error.message }], // ⚠️ Puede exponer detalles de BD
}, 400);
```

**Riesgo:** Errores de Supabase pueden exponer:
- Nombres de tablas
- Nombres de columnas
- Estructura de la base de datos

**Recomendación:**
- Sanitizar mensajes de error
- Usar códigos de error genéricos
- Log detallado en servidor, mensaje genérico al cliente

---

### 10. **Falta de Validación de Longitud en Inputs** 🟡 MEDIA
**Ubicación:** `src/endpoints/email/emailCreate.ts`, `consultationCreate.ts`

**Problema:** Aunque hay validación con Zod, algunos campos no tienen límite máximo:
```typescript
consultation_reason: z.string().min(1, "El motivo de consulta es requerido"),
// ⚠️ Sin .max()
```

**Riesgo:**
- Ataques de buffer overflow
- Consumo excesivo de almacenamiento
- Spam con textos muy largos

**Recomendación:**
- Añadir `.max(5000)` o similar a todos los campos de texto
- Validar longitud antes de procesar

---

### 11. **Credenciales CORS por Defecto en True** 🟡 MEDIA
**Ubicación:** `src/shared/corsConfig.ts:118`

**Problema:**
```typescript
const allowCredentials = extendedEnv.CORS_CREDENTIALS === "false" ? false : true;
```

**Riesgo:** Si no se configura explícitamente, permite credenciales por defecto, lo que puede ser innecesario y aumentar superficie de ataque.

**Recomendación:**
- Por defecto `false` en producción
- Solo `true` si es necesario

---

### 12. **Falta de Validación de Tipos en Transformaciones** 🟡 MEDIA
**Ubicación:** `src/endpoints/posts/postList.ts:17-19`

**Problema:**
```typescript
category_id: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
```

**Riesgo:** Si `parseInt` falla, puede retornar `NaN` que se propaga.

**Recomendación:**
- Validar que el resultado de `parseInt` sea un número válido
- Usar `.refine()` para validar después de transformar

---

## 🔵 VULNERABILIDADES BAJAS / MEJORAS

### 13. **Logs Excesivos en Producción** 🔵 BAJA
**Problema:** 266 console.log en el código base

**Recomendación:**
- Implementar sistema de logging con niveles (DEBUG, INFO, WARN, ERROR)
- Deshabilitar DEBUG/INFO en producción
- Usar servicio de logging estructurado

---

### 14. **Falta de Monitoreo y Alertas** 🔵 BAJA
**Recomendación:**
- Implementar alertas para:
  - Múltiples intentos de autenticación fallidos
  - Rate limiting excedido frecuentemente
  - Errores 500 frecuentes
  - Patrones de tráfico anómalos

---

### 15. **Falta de Versionado de API** 🔵 BAJA
**Recomendación:**
- Añadir versionado: `/v1/posts`, `/v2/posts`
- Facilita migraciones sin romper clientes

---

## 📋 RESUMEN DE PRIORIDADES

### 🔴 CRÍTICO (Resolver inmediatamente)
1. SQL Injection potencial
2. Autenticación débil en producción
3. OpenAPI docs públicas

### 🟠 ALTA (Resolver pronto)
4. Exposición de datos en logs
5. CORS demasiado permisivo
6. Falta de headers de seguridad
7. Rate limiting no persistente
8. Falta de límites en paginación

### 🟡 MEDIA (Planificar)
9. Exposición de estructura BD
10. Falta de validación de longitud
11. Credenciales CORS por defecto
12. Validación de tipos en transformaciones

### 🔵 BAJA (Mejoras)
13. Logs excesivos
14. Falta de monitoreo
15. Falta de versionado

---

## ✅ RECOMENDACIONES GENERALES

1. **Implementar WAF (Web Application Firewall)** en Cloudflare
2. **Habilitar DDoS Protection** en Cloudflare
3. **Revisar y actualizar dependencias** regularmente
4. **Implementar tests de seguridad** automatizados
5. **Realizar auditorías periódicas** de seguridad
6. **Documentar políticas de seguridad** y procedimientos

---

**Nota:** Esta auditoría se basa en una revisión estática del código. Se recomienda realizar pruebas de penetración adicionales.


