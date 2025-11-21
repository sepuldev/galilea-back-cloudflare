import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { postsRouter } from "./endpoints/posts/router";
import { emailRouter } from "./endpoints/email/router";
import { consultationsRouter } from "./endpoints/consultations/router";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { DummyEndpoint } from "./endpoints/dummyEndpoint";
import { getCorsConfig } from "./shared/corsConfig";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

/**
 * Configuración de CORS (Cross-Origin Resource Sharing)
 * 
 * CONFIGURACIÓN MEDIANTE VARIABLES DE ENTORNO:
 * 
 * 1. CORS_ORIGINS: Lista de orígenes permitidos separados por comas
 *    Ejemplo: "https://mi-dominio.com,https://www.mi-dominio.com,http://localhost:3000"
 * 
 * 2. CORS_CREDENTIALS: "true" o "false" para permitir credenciales (default: "true")
 * 
 * 3. CORS_MAX_AGE: Tiempo de cache del preflight en segundos (default: 600)
 * 
 * Si CORS_ORIGINS no está configurado, usa valores por defecto para desarrollo local
 * 
 * La configuración se obtiene dinámicamente desde variables de entorno en cada request
 */
app.use(
  "*",
  async (c, next) => {
    // Obtener configuración de CORS desde variables de entorno
    const corsConfig = getCorsConfig(c.env);
    
    // Aplicar middleware de CORS con la configuración obtenida
    const corsMiddleware = cors({
      origin: (origin: string) => {
        // Si no hay origen (petición same-origin), permitir
        if (!origin) {
          return corsConfig.origin[0] || "*";
        }
        // Verificar si el origen está en la lista de permitidos
        return corsConfig.origin.includes(origin) ? origin : null;
      },
      allowMethods: [...corsConfig.allowMethods] as string[],
      allowHeaders: corsConfig.allowHeaders,
      exposeHeaders: corsConfig.exposeHeaders,
      maxAge: corsConfig.maxAge,
      credentials: corsConfig.credentials,
    });
    
    return corsMiddleware(c, next);
  },
);

app.onError((err, c) => {
 if (err instanceof ApiException) {
    // If it's a Chanfana ApiException, let Chanfana handle the response
    return c.json(
      { success: false, errors: err.buildResponse() },
      err.status as ContentfulStatusCode,
    );
  }

  console.error("Global error handler caught:", err); // Log the error if it's not known

  // For other errors, return a generic 500 response
  return c.json(
    {
      success: false,
      errors: [{ code: 7000, message: "Internal Server Error" }],
    },
    500,
  );
});

// Setup OpenAPI registry --> Esto genera documentación automáticamente
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

// Register Posts Sub router
openapi.route("/posts", postsRouter);

// Register Email Sub router
openapi.route("/email", emailRouter);

// Register Consultations Sub router
openapi.route("/consultations", consultationsRouter);

// Register other endpoints
openapi.post("/dummy/:slug", DummyEndpoint);

// Export the Hono app
export default app;
