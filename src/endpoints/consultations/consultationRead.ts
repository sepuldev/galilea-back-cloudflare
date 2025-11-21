import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { ConsultationModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";
import { checkAuth } from "../../shared/auth";

export class ConsultationRead extends OpenAPIRoute {
  public schema = {
    tags: ["Consultations"],
    summary: "Obtener una consulta por ID",
    operationId: "get-consultation",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: createCRUDResponses(ConsultationModel.schema, {
      include200: true,
      custom200Description: "Consulta obtenida exitosamente",
      custom404Description: "Consulta no encontrada",
    }),
  };

  public async handle(c: AppContext) {
    // Verificar autenticación
    const authError = checkAuth(c);
    if (authError) return authError;

    console.log("[LEER CONSULTA] Iniciando solicitud GET /consultations/:id");
    const data = await this.getValidatedData<typeof this.schema>();
    console.log("[LEER CONSULTA] ID de la consulta solicitada:", data.params.id);
    
    const supabase = getSupabaseClient(c.env);
    console.log("[LEER CONSULTA] Cliente de Supabase inicializado");
    console.log("[LEER CONSULTA] Nombre de tabla:", ConsultationModel.tableName);

    console.log("[LEER CONSULTA] Consultando consulta en Supabase...");
    const { data: result, error } = await supabase
      .from(ConsultationModel.tableName)
      .select("*")
      .eq("id", data.params.id)
      .single();

    if (error) {
      console.error("[LEER CONSULTA] ERROR en consulta de Supabase:", error.message);
      console.error("[LEER CONSULTA] Detalles del error:", JSON.stringify(error, null, 2));
      console.error("[LEER CONSULTA] Código de error:", error.code);
    }

    if (error || !result) {
      console.warn("[LEER CONSULTA] Consulta no encontrada con ID:", data.params.id);
      return c.json(
        {
          success: false,
          errors: [{ code: 404, message: "Not Found" }],
        },
        404,
      );
    }

    console.log("[LEER CONSULTA] Consulta encontrada exitosamente");
    console.log("[LEER CONSULTA] Resultado raw de Supabase:", JSON.stringify(result, null, 2));

    // Serializar el resultado
    const serialized = ConsultationModel.serializer(result);
    console.log("[LEER CONSULTA] Resultado serializado:", JSON.stringify(serialized, null, 2));

    return c.json({
      success: true,
      result: serialized,
    });
  }
}

