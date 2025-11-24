// import { ApiException, fromHono } from "chanfana";
// import { Hono } from "hono";
// import { cors } from "hono/cors";
// import { postsRouter } from "./endpoints/posts/router";
// import { emailRouter } from "./endpoints/email/router";
// import { consultationsRouter } from "./endpoints/consultations/router";
// import { ContentfulStatusCode } from "hono/utils/http-status";
// import { DummyEndpoint } from "./endpoints/dummyEndpoint";
// import { getCorsConfig } from "./shared/corsConfig";

// // Start a Hono app
// const app = new Hono<{ Bindings: Env }>();

// /**
//  * Configuración de CORS (Cross-Origin Resource Sharing)
//  * 
//  * CONFIGURACIÓN MEDIANTE VARIABLES DE ENTORNO:
//  * 
//  * 1. CORS_ORIGINS: Lista de orígenes permitidos separados por comas
//  *    Ejemplo: "https://mi-dominio.com,https://www.mi-dominio.com,http://localhost:3000"
//  * 
//  * 2. CORS_CREDENTIALS: "true" o "false" para permitir credenciales (default: "true")
//  * 
//  * 3. CORS_MAX_AGE: Tiempo de cache del preflight en segundos (default: 600)
//  * 
//  * Si CORS_ORIGINS no está configurado, usa valores por defecto para desarrollo local
//  * 
//  * La configuración se obtiene dinámicamente desde variables de entorno en cada request
//  */
// // Manejar peticiones OPTIONS (preflight) antes del middleware de CORS
// app.options("*", async (c) => {
//   const corsConfig = getCorsConfig(c.env);
//   const origin = c.req.header("Origin");

//   console.log(`[CORS] Preflight request desde: ${origin}`);
//   console.log(`[CORS] Orígenes permitidos: ${corsConfig.origin.join(', ')}`);

//   // Verificar si el origen está permitido
//   let allowedOrigin: string | null = null;

//   if (!origin) {
//     allowedOrigin = corsConfig.origin[0] || "*";
//   } else {
//     const isAllowed = corsConfig.origin.some(allowedOriginPattern => {
//       if (allowedOriginPattern === origin) return true;
//       // Soporte para wildcards (ej: *.vercel.app)
//       if (allowedOriginPattern.includes('*')) {
//         const pattern = allowedOriginPattern.replace(/\*/g, '.*');
//         const regex = new RegExp(`^${pattern}$`);
//         return regex.test(origin);
//       }
//       return false;
//     });

//     if (isAllowed) {
//       allowedOrigin = origin;
//       console.log(`[CORS] Preflight permitido para: ${origin}`);
//     } else {
//       console.warn(`[CORS] Preflight bloqueado para: ${origin}`);
//       allowedOrigin = null;
//     }
//   }

//   if (allowedOrigin) {
//     return c.body(null, 204, {
//       "Access-Control-Allow-Origin": allowedOrigin,
//       "Access-Control-Allow-Methods": corsConfig.allowMethods.join(", "),
//       "Access-Control-Allow-Headers": corsConfig.allowHeaders.join(", "),
//       "Access-Control-Expose-Headers": corsConfig.exposeHeaders.join(", "),
//       "Access-Control-Max-Age": corsConfig.maxAge.toString(),
//       "Access-Control-Allow-Credentials": corsConfig.credentials ? "true" : "false",
//     });
//   } else {
//     return c.json({ error: "CORS policy: Origin not allowed" }, 403);
//   }
// });

// app.use(
//   "*",
//   async (c, next) => {
//     // Obtener configuración de CORS desde variables de entorno
//     const corsConfig = getCorsConfig(c.env);
//     const origin = c.req.header("Origin");

//     // Aplicar middleware de CORS con la configuración obtenida
//     const corsMiddleware = cors({
//       origin: (origin: string) => {
//         // Si no hay origen (petición same-origin), permitir
//         if (!origin) {
//           return corsConfig.origin[0] || "*";
//         }
//         // Verificar si el origen está en la lista de permitidos
//         // También verificar si coincide con patrones de Vercel (*.vercel.app)
//         const isAllowed = corsConfig.origin.some(allowedOrigin => {
//           if (allowedOrigin === origin) return true;
//           // Soporte para wildcards en Vercel (ej: *.vercel.app)
//           if (allowedOrigin.includes('*')) {
//             const pattern = allowedOrigin.replace(/\*/g, '.*');
//             const regex = new RegExp(`^${pattern}$`);
//             return regex.test(origin);
//           }
//           return false;
//         });

//         if (isAllowed) {
//           console.log(`[CORS] Origen permitido: ${origin}`);
//           return origin;
//         } else {
//           console.warn(`[CORS] Origen bloqueado: ${origin}`);
//           console.warn(`[CORS] Orígenes permitidos: ${corsConfig.origin.join(', ')}`);
//           return null;
//         }
//       },
//       allowMethods: [...corsConfig.allowMethods] as string[],
//       allowHeaders: corsConfig.allowHeaders,
//       exposeHeaders: corsConfig.exposeHeaders,
//       maxAge: corsConfig.maxAge,
//       credentials: corsConfig.credentials,
//     });

//     return corsMiddleware(c, next);
//   },
// );

// app.onError((err, c) => {
//   if (err instanceof ApiException) {
//     // If it's a Chanfana ApiException, let Chanfana handle the response
//     return c.json(
//       { success: false, errors: err.buildResponse() },
//       err.status as ContentfulStatusCode,
//     );
//   }

//   console.error("Global error handler caught:", err); // Log the error if it's not known

//   // For other errors, return a generic 500 response
//   return c.json(
//     {
//       success: false,
//       errors: [{ code: 7000, message: "Internal Server Error" }],
//     },
//     500,
//   );
// });

// // Setup OpenAPI registry --> Esto genera documentación automáticamente
// const openapi = fromHono(app, {
//   docs_url: "/",
//   schema: {
//     info: {
//       title: "My Awesome API",
//       version: "2.0.0",
//       description: "This is the documentation for my awesome API.",
//     },
//   },
// });

// // Register Posts Sub router
// openapi.route("/posts", postsRouter);

// // Register Email Sub router
// openapi.route("/email", emailRouter);

// // Register Consultations Sub router
// openapi.route("/consultations", consultationsRouter);

// // Register other endpoints
// openapi.post("/dummy/:slug", DummyEndpoint);

// // Export the Hono app
// export default app;
import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { postsRouter } from "./endpoints/posts/router";
import { emailRouter } from "./endpoints/email/router";
import { consultationsRouter } from "./endpoints/consultations/router";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { DummyEndpoint } from "./endpoints/dummyEndpoint";
import { getCorsConfig } from "./shared/corsConfig";

const app = new Hono<{ Bindings: Env }>();

/* ============================================================
   PRE-FLIGHT (OPTIONS)
   ============================================================ */
app.options("*", (c) => {
  const corsConfig = getCorsConfig(c.env);
  const origin = c.req.header("Origin");

  console.log(`[CORS] → Preflight desde: ${origin}`);
  console.log(`[CORS] → Permitidos: ${corsConfig.origin.join(" | ")}`);

  const matchOrigin = (origin: string | null): string | null => {
    if (!origin) return corsConfig.origin[0] ?? null;

    const isAllowed = corsConfig.origin.some((allowed) => {
      if (allowed === origin) return true;
      if (allowed.includes("*")) {
        const pattern = allowed.replace(/\*/g, ".*");
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return false;
    });

    return isAllowed ? origin : null;
  };

  const allowedOrigin = matchOrigin(origin ?? null);

  if (!allowedOrigin) {
    console.warn(`[CORS] ❌ Preflight bloqueado para: ${origin}`);
    return c.json({ error: "CORS blocked" }, 403);
  }

  console.log(`[CORS] ✔ Preflight permitido: ${allowedOrigin}`);

  return c.body(null, 204, {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": corsConfig.allowMethods.join(", "),
    "Access-Control-Allow-Headers": corsConfig.allowHeaders.join(", "),
    "Access-Control-Expose-Headers": corsConfig.exposeHeaders.join(", "),
    "Access-Control-Max-Age": corsConfig.maxAge.toString(),
    "Access-Control-Allow-Credentials": corsConfig.credentials ? "true" : "false",
  });
});

/* ============================================================
   MIDDLEWARE PRINCIPAL CORS
   ============================================================ */
app.use("*", async (c, next) => {
  const corsConfig = getCorsConfig(c.env);

  const corsMiddleware = cors({
    origin: (origin: string | null) => {
      if (!origin) return corsConfig.origin[0] ?? "*";

      const isAllowed = corsConfig.origin.some((allowed) => {
        if (allowed === origin) return true;
        if (allowed.includes("*")) {
          const pattern = allowed.replace(/\*/g, ".*");
          return new RegExp(`^${pattern}$`).test(origin);
        }
        return false;
      });

      if (isAllowed) {
        console.log(`[CORS] ✔ Request permitido: ${origin}`);
        return origin;
      }

      console.warn(`[CORS] ❌ Request bloqueado: ${origin}`);
      return null;
    },
    allowMethods: corsConfig.allowMethods,
    allowHeaders: corsConfig.allowHeaders,
    exposeHeaders: corsConfig.exposeHeaders,
    maxAge: corsConfig.maxAge,
    credentials: corsConfig.credentials,
  });

  return corsMiddleware(c, next);
});

/* ============================================================
   MANEJO GLOBAL DE ERRORES
   ============================================================ */
app.onError((err, c) => {
  if (err instanceof ApiException) {
    return c.json(
      { success: false, errors: err.buildResponse() },
      err.status as ContentfulStatusCode
    );
  }

  console.error("🔴 Error no controlado:", err);

  return c.json(
    {
      success: false,
      errors: [{ code: 7000, message: "Internal Server Error" }],
    },
    500
  );
});

/* ============================================================
   OPENAPI + ENDPOINTS
   ============================================================ */
const openapi = fromHono(app, {
  docs_url: "/",
  schema: {
    info: {
      title: "My Awesome API",
      version: "2.0.0",
      description: "This is the documentation for my awesome API.",
    },
  },
});

import { categoriesRouter } from "./endpoints/categories/router";
import { uploadRouter } from "./endpoints/upload/router";

// ... existing imports ...

openapi.route("/posts", postsRouter);
openapi.route("/email", emailRouter);
openapi.route("/consultations", consultationsRouter);
openapi.route("/categories", categoriesRouter);
openapi.route("/upload", uploadRouter);

openapi.post("/dummy/:slug", DummyEndpoint);

/* ============================================================
   EXPORT
   ============================================================ */
export default openapi;
