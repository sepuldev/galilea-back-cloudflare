import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { ConsultationModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";

export class ConsultationCreate extends OpenAPIRoute {
  public schema = {
    tags: ["Consultations"],
    summary: "Crear una nueva consulta",
    operationId: "create-consultation",
    request: {
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
        }),
      ),
    },
    responses: {
      "201": {
        description: "Consulta creada exitosamente",
        ...contentJson({
          success: Boolean,
          result: ConsultationModel.schema,
        }),
      },
      "400": {
        description: "Bad request",
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
    console.log("[CREAR CONSULTA] Iniciando solicitud POST /consultations");
    const data = await this.getValidatedData<typeof this.schema>();
    console.log("[CREAR CONSULTA] Datos recibidos en el body:", JSON.stringify(data.body, null, 2));
    
    const supabase = getSupabaseClient(c.env);
    console.log("[CREAR CONSULTA] Cliente de Supabase inicializado");
    console.log("[CREAR CONSULTA] Nombre de tabla:", ConsultationModel.tableName);

    console.log("[CREAR CONSULTA] Insertando datos en Supabase...");
    const { data: result, error } = await supabase
      .from(ConsultationModel.tableName)
      .insert([data.body])
      .select()
      .single();

    if (error) {
      console.error("[CREAR CONSULTA] ERROR al insertar en Supabase:", error.message);
      console.error("[CREAR CONSULTA] Detalles del error:", JSON.stringify(error, null, 2));
      console.error("[CREAR CONSULTA] Código de error:", error.code);
      console.error("[CREAR CONSULTA] Datos que se intentaron insertar:", JSON.stringify(data.body, null, 2));
      return c.json(
        {
          success: false,
          errors: [{ code: 400, message: error.message }],
        },
        400,
      );
    }

    console.log("[CREAR CONSULTA] Inserción exitosa");
    console.log("[CREAR CONSULTA] Resultado raw de Supabase:", JSON.stringify(result, null, 2));

    // Serializar el resultado
    const serialized = ConsultationModel.serializer(result);
    console.log("[CREAR CONSULTA] Resultado serializado:", JSON.stringify(serialized, null, 2));
    console.log("[CREAR CONSULTA] Consulta creada con ID:", serialized.id);

    return c.json(
      {
        success: true,
        result: serialized,
      },
      201,
    );
  }
}

