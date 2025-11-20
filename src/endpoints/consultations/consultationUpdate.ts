import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { ConsultationModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";

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
          user_dni: true,
          user_email: true,
          message: true,
          user_name: true,
          phone_number: true,
          status: true,
          user_lastname: true,
          nacionality: true,
        }).partial(),
      ),
    },
    responses: {
      "200": {
        description: "Consulta actualizada exitosamente",
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
    console.log("[ACTUALIZAR CONSULTA] Iniciando solicitud PUT /consultations/:id");
    const data = await this.getValidatedData<typeof this.schema>();
    console.log("[ACTUALIZAR CONSULTA] ID de la consulta a actualizar:", data.params.id);
    console.log("[ACTUALIZAR CONSULTA] Datos recibidos en el body:", JSON.stringify(data.body, null, 2));
    
    const supabase = getSupabaseClient(c.env);
    console.log("[ACTUALIZAR CONSULTA] Cliente de Supabase inicializado");
    console.log("[ACTUALIZAR CONSULTA] Nombre de tabla:", ConsultationModel.tableName);

    // Preparar datos de actualización
    const updateData: Record<string, any> = {};
    if (data.body.user_dni !== undefined) updateData.user_dni = data.body.user_dni;
    if (data.body.user_email !== undefined) updateData.user_email = data.body.user_email;
    if (data.body.message !== undefined) updateData.message = data.body.message;
    if (data.body.user_name !== undefined) updateData.user_name = data.body.user_name;
    if (data.body.phone_number !== undefined) updateData.phone_number = data.body.phone_number;
    if (data.body.status !== undefined) updateData.status = data.body.status;
    if (data.body.user_lastname !== undefined) updateData.user_lastname = data.body.user_lastname;
    if (data.body.nacionality !== undefined) updateData.nacionality = data.body.nacionality;

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

