import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { postsRouter } from "./endpoints/posts/router";
import { emailRouter } from "./endpoints/email/router";
import { consultationsRouter } from "./endpoints/consultations/router";
import { categoriesRouter } from "./endpoints/categories/router";
import { uploadRouter } from "./endpoints/upload/router";
import { authRouter } from "./endpoints/auth/router";
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
   LOGGING MIDDLEWARE
   ============================================================ */
app.use("*", async (c, next) => {
  console.log(`[REQUEST] ${c.req.method} ${c.req.url}`);
  console.log(`[REQUEST] Path: ${c.req.path}`);
  await next();
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

openapi.route("/posts", postsRouter);
openapi.route("/email", emailRouter);
openapi.route("/consultations", consultationsRouter);
openapi.route("/categories", categoriesRouter);
openapi.route("/upload", uploadRouter);
openapi.route("/auth", authRouter);

openapi.post("/dummy/:slug", DummyEndpoint);

/* ============================================================
   EXPORT
   ============================================================ */
export default openapi;
