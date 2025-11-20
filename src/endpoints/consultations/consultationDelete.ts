import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { ConsultationModel } from "./base";
import { getSupabaseServiceClient } from "../../supabase";
import { z } from "zod";

export class ConsultationDelete extends OpenAPIRoute {
  public schema = {
    tags: ["Consultations"],
    summary: "Eliminar una consulta por ID",
    operationId: "delete-consultation",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      "200": {
        description: "Consulta eliminada exitosamente",
        ...contentJson({
          success: Boolean,
          result: z.object({ id: z.string().uuid() }),
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
    console.log("[ELIMINAR CONSULTA] Iniciando solicitud DELETE /consultations/:id");
    const data = await this.getValidatedData<typeof this.schema>();
    console.log("[ELIMINAR CONSULTA] ID de la consulta a eliminar:", data.params.id);
    
    // Usar Service Role Key para operaciones de escritura (bypass RLS)
    const supabase = getSupabaseServiceClient(c.env);
    console.log("[ELIMINAR CONSULTA] Cliente de Supabase inicializado (SERVICE_ROLE_KEY)");
    console.log("[ELIMINAR CONSULTA] Nombre de tabla:", ConsultationModel.tableName);

    // Primero, verificar si la consulta existe
    console.log("[ELIMINAR CONSULTA] Verificando existencia de la consulta...");
    const { data: existingConsultation, error: fetchError } = await supabase
      .from(ConsultationModel.tableName)
      .select("id")
      .eq("id", data.params.id)
      .single();

    if (fetchError) {
      console.error("[ELIMINAR CONSULTA] ERROR al verificar existencia:", fetchError.message);
      console.error("[ELIMINAR CONSULTA] Detalles del error:", JSON.stringify(fetchError, null, 2));
      console.error("[ELIMINAR CONSULTA] Código de error:", fetchError.code);
    }

    if (fetchError || !existingConsultation) {
      console.warn("[ELIMINAR CONSULTA] Consulta no encontrada con ID:", data.params.id);
      return c.json(
        {
          success: false,
          errors: [{ code: 404, message: "Not Found" }],
        },
        404,
      );
    }

    console.log("[ELIMINAR CONSULTA] Consulta encontrada, procediendo a eliminar...");

    // Eliminar la consulta
    const { error } = await supabase
      .from(ConsultationModel.tableName)
      .delete()
      .eq("id", data.params.id);

    if (error) {
      console.error("[ELIMINAR CONSULTA] ERROR al eliminar en Supabase:", error.message);
      console.error("[ELIMINAR CONSULTA] Detalles del error:", JSON.stringify(error, null, 2));
      console.error("[ELIMINAR CONSULTA] Código de error:", error.code);
      return c.json(
        {
          success: false,
          errors: [{ code: 500, message: error.message }],
        },
        500,
      );
    }

    console.log("[ELIMINAR CONSULTA] Consulta eliminada exitosamente");
    console.log("[ELIMINAR CONSULTA] ID eliminado:", data.params.id);

    return c.json({
      success: true,
      result: { id: data.params.id },
    });
  }
}

