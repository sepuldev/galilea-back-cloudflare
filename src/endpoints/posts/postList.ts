import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { PostModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";

export class PostList extends OpenAPIRoute {
  public schema = {
    tags: ["Posts"],
    summary: "List all posts with optional filtering and pagination",
    operationId: "list-posts",
    request: {
      query: z.object({
        search: z.string().optional(),
        author_id: z.string().uuid().optional(),
        category_id: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
        limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
        offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
        orderBy: z.string().optional(),
      }),
    },
    responses: createCRUDResponses(z.array(PostModel.schema), {
      include200: true,
      custom200Description: "Posts retrieved successfully",
    }),
  };

  public async handle(c: AppContext) {
    console.log("[LISTAR POSTS] Iniciando solicitud GET /posts");
    const data = await this.getValidatedData<typeof this.schema>();
    console.log("[LISTAR POSTS] Parámetros de consulta recibidos:", JSON.stringify(data.query, null, 2));
    
    const supabase = getSupabaseClient(c.env);
    console.log("[LISTAR POSTS] Cliente de Supabase inicializado");
    console.log("[LISTAR POSTS] Nombre de tabla:", PostModel.tableName);

    let query = supabase.from(PostModel.tableName).select("*");
    console.log("[LISTAR POSTS] Consulta base creada: SELECT * FROM", PostModel.tableName);

    // Aplicar búsqueda si se proporciona (busca en título y contenido)
    if (data.query.search) {
      const searchTerm = `%${data.query.search}%`;
      const searchConditions = `title.ilike."${searchTerm}",content.ilike."${searchTerm}"`;
      query = query.or(searchConditions);
      console.log("[LISTAR POSTS] Filtro de búsqueda aplicado:", searchConditions);
    }

    // Filtrar por author_id si se proporciona
    if (data.query.author_id) {
      query = query.eq("author_id", data.query.author_id);
      console.log("[LISTAR POSTS] Filtro por autor aplicado:", data.query.author_id);
    }

    // Filtrar por category_id si se proporciona
    if (data.query.category_id !== undefined) {
      query = query.eq("category_id", data.query.category_id);
      console.log("[LISTAR POSTS] Filtro por categoría aplicado:", data.query.category_id);
    }

    // Aplicar ordenamiento (por defecto: created_at DESC)
    const orderBy = data.query.orderBy || "created_at DESC";
    const [orderField, orderDirection] = orderBy.split(" ");
    query = query.order(orderField, {
      ascending: orderDirection?.toLowerCase() !== "desc",
    });
    console.log("[LISTAR POSTS] Ordenamiento aplicado - Campo:", orderField, "| Dirección:", orderDirection);

    // Aplicar paginación
    if (data.query.limit) {
      query = query.limit(data.query.limit);
      console.log("[LISTAR POSTS] Límite aplicado:", data.query.limit, "registros");
    }
    if (data.query.offset !== undefined) {
      const end = data.query.offset + (data.query.limit || 100) - 1;
      query = query.range(data.query.offset, end);
      console.log("[LISTAR POSTS] Rango aplicado: desde", data.query.offset, "hasta", end);
    }

    console.log("[LISTAR POSTS] Ejecutando consulta en Supabase...");
    const { data: results, error } = await query;

    if (error) {
      console.error("[LISTAR POSTS] ERROR en consulta de Supabase:", error.message);
      console.error("[LISTAR POSTS] Detalles del error:", JSON.stringify(error, null, 2));
      console.error("[LISTAR POSTS] Código de error:", error.code);
      console.error("[LISTAR POSTS] Detalles completos:", error);
      return c.json(
        {
          success: false,
          errors: [{ code: 500, message: error.message }],
        },
        500,
      );
    }

    console.log("[LISTAR POSTS] Consulta ejecutada exitosamente");
    console.log("[LISTAR POSTS] Cantidad de resultados raw:", results?.length || 0);
    if (results && results.length > 0) {
      console.log("[LISTAR POSTS] Primer resultado raw:", JSON.stringify(results[0], null, 2));
    } else {
      console.warn("[LISTAR POSTS] ADVERTENCIA: No se encontraron resultados");
    }

    // Serializar todos los resultados
    const serialized = (results || []).map((result) =>
      PostModel.serializer(result),
    );

    console.log("[LISTAR POSTS] Cantidad de resultados serializados:", serialized.length);
    console.log("[LISTAR POSTS] Respuesta final preparada");

    return c.json({
      success: true,
      result: serialized,
    });
  }
}

