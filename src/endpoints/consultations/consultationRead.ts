import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { ConsultationModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";

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
    responses: {
      "200": {
        description: "Consulta obtenida exitosamente",
        ...contentJson({
          success: Boolean,
          result: ConsultationModel.schema,
        }),
      },
      "404": {
        description: "Consulta no encontrada",
        ...contentJson({
          success: Boolean,
          errors: z.array(
            z.object({
              code: z.number(),
              message: z.string(),
            }),
          ),
        }),
      },
    },
  };

  public async handle(c: AppContext) {
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

