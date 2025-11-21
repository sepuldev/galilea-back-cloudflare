import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { ConsultationModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";

export class ConsultationList extends OpenAPIRoute {
  public schema = {
    tags: ["Consultations"],
    summary: "Listar todas las consultas con filtros opcionales y paginación",
    operationId: "list-consultations",
    request: {
      query: z.object({
        search: z.string().optional(),
        user_email: z.string().email().optional(),
        user_dni: z.string().optional(),
        status: z.string().optional(),
        limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
        offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
        orderBy: z.string().optional(),
      }),
    },
    responses: createCRUDResponses(z.array(ConsultationModel.schema), {
      include200: true,
      custom200Description: "Consultas obtenidas exitosamente",
      excludeCommonResponses: ["404"], // List no necesita 404
    }),
  };

  public async handle(c: AppContext) {
    console.log("[LISTAR CONSULTAS] Iniciando solicitud GET /consultations");
    const data = await this.getValidatedData<typeof this.schema>();
    console.log("[LISTAR CONSULTAS] Parámetros de consulta recibidos:", JSON.stringify(data.query, null, 2));
    
    const supabase = getSupabaseClient(c.env);
    console.log("[LISTAR CONSULTAS] Cliente de Supabase inicializado");
    console.log("[LISTAR CONSULTAS] Nombre de tabla:", ConsultationModel.tableName);

    let query = supabase.from(ConsultationModel.tableName).select("*");
    console.log("[LISTAR CONSULTAS] Consulta base creada: SELECT * FROM", ConsultationModel.tableName);

    // Aplicar búsqueda si se proporciona (busca en consultation_reason, first_name, email)
    if (data.query.search) {
      const searchTerm = `%${data.query.search}%`;
      const searchConditions = `consultation_reason.ilike."${searchTerm}",first_name.ilike."${searchTerm}",email.ilike."${searchTerm}"`;
      query = query.or(searchConditions);
      console.log("[LISTAR CONSULTAS] Filtro de búsqueda aplicado:", searchConditions);
    }

    // Filtrar por email si se proporciona
    if (data.query.user_email) {
      query = query.eq("email", data.query.user_email);
      console.log("[LISTAR CONSULTAS] Filtro por email aplicado:", data.query.user_email);
    }

    // Filtrar por dni_or_id si se proporciona
    if (data.query.user_dni) {
      query = query.eq("dni_or_id", data.query.user_dni);
      console.log("[LISTAR CONSULTAS] Filtro por DNI aplicado:", data.query.user_dni);
    }

    // Filtrar por status si se proporciona
    if (data.query.status) {
      query = query.eq("status", data.query.status);
      console.log("[LISTAR CONSULTAS] Filtro por estado aplicado:", data.query.status);
    }

    // Aplicar ordenamiento (por defecto: created_at DESC)
    const orderBy = data.query.orderBy || "created_at DESC";
    const [orderField, orderDirection] = orderBy.split(" ");
    query = query.order(orderField, {
      ascending: orderDirection?.toLowerCase() !== "desc",
    });
    console.log("[LISTAR CONSULTAS] Ordenamiento aplicado - Campo:", orderField, "| Dirección:", orderDirection);

    // Aplicar paginación
    if (data.query.limit) {
      query = query.limit(data.query.limit);
      console.log("[LISTAR CONSULTAS] Límite aplicado:", data.query.limit, "registros");
    }
    if (data.query.offset !== undefined) {
      const end = data.query.offset + (data.query.limit || 100) - 1;
      query = query.range(data.query.offset, end);
      console.log("[LISTAR CONSULTAS] Rango aplicado: desde", data.query.offset, "hasta", end);
    }

    console.log("[LISTAR CONSULTAS] Ejecutando consulta en Supabase...");
    const { data: results, error } = await query;

    if (error) {
      console.error("[LISTAR CONSULTAS] ERROR en consulta de Supabase:", error.message);
      console.error("[LISTAR CONSULTAS] Detalles del error:", JSON.stringify(error, null, 2));
      console.error("[LISTAR CONSULTAS] Código de error:", error.code);
      return c.json(
        {
          success: false,
          errors: [{ code: 500, message: error.message }],
        },
        500,
      );
    }

    console.log("[LISTAR CONSULTAS] Consulta ejecutada exitosamente");
    console.log("[LISTAR CONSULTAS] Cantidad de resultados raw:", results?.length || 0);
    if (results && results.length > 0) {
      console.log("[LISTAR CONSULTAS] Primer resultado raw:", JSON.stringify(results[0], null, 2));
    } else {
      console.warn("[LISTAR CONSULTAS] ADVERTENCIA: No se encontraron resultados");
    }

    // Serializar todos los resultados
    const serialized = (results || []).map((result) =>
      ConsultationModel.serializer(result),
    );

    console.log("[LISTAR CONSULTAS] Cantidad de resultados serializados:", serialized.length);
    console.log("[LISTAR CONSULTAS] Respuesta final preparada");

    return c.json({
      success: true,
      result: serialized,
    });
  }
}

