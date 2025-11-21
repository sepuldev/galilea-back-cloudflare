import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { ConsultationModel } from "./base";
import { getSupabaseServiceClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";
import { checkAuth } from "../../shared/auth";

export class ConsultationUpdate extends OpenAPIRoute {
  public schema = {
    tags: ["Consultations"],
    summary: "Actualizar una consulta por ID",
    operationId: "update-consultation",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: contentJson(
        ConsultationModel.schema.pick({
          dni_or_id: true,
          email: true,
          consultation_reason: true,
          first_name: true,
          phone_number: true,
          status: true,
          last_name: true,
          nationality: true,
        }).partial(),
      ),
    },
    responses: createCRUDResponses(ConsultationModel.schema, {
      include200: true,
      custom200Description: "Consulta actualizada exitosamente",
      custom404Description: "Consulta no encontrada",
    }),
  };

  public async handle(c: AppContext) {
    // Verificar autenticación
    const authError = checkAuth(c);
    if (authError) return authError;

    console.log("[ACTUALIZAR CONSULTA] Iniciando solicitud PUT /consultations/:id");
    const data = await this.getValidatedData<typeof this.schema>();
    console.log("[ACTUALIZAR CONSULTA] ID de la consulta a actualizar:", data.params.id);
    console.log("[ACTUALIZAR CONSULTA] Datos recibidos en el body:", JSON.stringify(data.body, null, 2));
    
    // Usar Service Role Key para operaciones de escritura (bypass RLS)
    const supabase = getSupabaseServiceClient(c.env);
    console.log("[ACTUALIZAR CONSULTA] Cliente de Supabase inicializado (SERVICE_ROLE_KEY)");
    console.log("[ACTUALIZAR CONSULTA] Nombre de tabla:", ConsultationModel.tableName);

    // Preparar datos de actualización
    // Tipo específico para los campos que se pueden actualizar
    type ConsultationUpdateData = {
      dni_or_id?: string;
      email?: string;
      consultation_reason?: string;
      first_name?: string;
      phone_number?: string;
      status?: string;
      last_name?: string;
      nationality?: string;
    };
    
    const updateData: ConsultationUpdateData = {};
    if (data.body.dni_or_id !== undefined) updateData.dni_or_id = data.body.dni_or_id;
    if (data.body.email !== undefined) updateData.email = data.body.email;
    if (data.body.consultation_reason !== undefined) updateData.consultation_reason = data.body.consultation_reason;
    if (data.body.first_name !== undefined) updateData.first_name = data.body.first_name;
    if (data.body.phone_number !== undefined) updateData.phone_number = data.body.phone_number;
    if (data.body.status !== undefined) updateData.status = data.body.status;
    if (data.body.last_name !== undefined) updateData.last_name = data.body.last_name;
    if (data.body.nationality !== undefined) updateData.nationality = data.body.nationality;

    console.log("[ACTUALIZAR CONSULTA] Datos de actualización preparados:", JSON.stringify(updateData, null, 2));
    console.log("[ACTUALIZAR CONSULTA] Campos a actualizar:", Object.keys(updateData).join(", "));

    console.log("[ACTUALIZAR CONSULTA] Actualizando consulta en Supabase...");
    const { data: result, error } = await supabase
      .from(ConsultationModel.tableName)
      .update(updateData)
      .eq("id", data.params.id)
      .select()
      .single();

    if (error) {
      console.error("[ACTUALIZAR CONSULTA] ERROR al actualizar en Supabase:", error.message);
      console.error("[ACTUALIZAR CONSULTA] Detalles del error:", JSON.stringify(error, null, 2));
      console.error("[ACTUALIZAR CONSULTA] Código de error:", error.code);
    }

    if (error || !result) {
      console.warn("[ACTUALIZAR CONSULTA] Consulta no encontrada o actualización fallida");
      console.warn("[ACTUALIZAR CONSULTA] ID buscado:", data.params.id);
      return c.json(
        {
          success: false,
          errors: [{ code: 404, message: "Not Found" }],
        },
        404,
      );
    }

    console.log("[ACTUALIZAR CONSULTA] Actualización exitosa");
    console.log("[ACTUALIZAR CONSULTA] Resultado raw de Supabase:", JSON.stringify(result, null, 2));

    // Serializar el resultado
    const serialized = ConsultationModel.serializer(result);
    console.log("[ACTUALIZAR CONSULTA] Resultado serializado:", JSON.stringify(serialized, null, 2));

    return c.json({
      success: true,
      result: serialized,
    });
  }
}

