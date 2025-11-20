import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { PostModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";

export class PostRead extends OpenAPIRoute {
  public schema = {
    tags: ["Posts"],
    summary: "Get a post by ID",
    operationId: "get-post",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      "200": {
        description: "Post retrieved successfully",
        ...contentJson({
          success: Boolean,
          result: PostModel.schema,
        }),
      },
      "404": {
        description: "Post not found",
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
    console.log("[LEER POST] Iniciando solicitud GET /posts/:id");
    const data = await this.getValidatedData<typeof this.schema>();
    console.log("[LEER POST] ID del post solicitado:", data.params.id);
    
    const supabase = getSupabaseClient(c.env);
    console.log("[LEER POST] Cliente de Supabase inicializado");
    console.log("[LEER POST] Nombre de tabla:", PostModel.tableName);

    console.log("[LEER POST] Consultando post en Supabase...");
    const { data: result, error } = await supabase
      .from(PostModel.tableName)
      .select("*")
      .eq("id", data.params.id)
      .single();

    if (error) {
      console.error("[LEER POST] ERROR en consulta de Supabase:", error.message);
      console.error("[LEER POST] Detalles del error:", JSON.stringify(error, null, 2));
      console.error("[LEER POST] Código de error:", error.code);
    }

    if (error || !result) {
      console.warn("[LEER POST] Post no encontrado con ID:", data.params.id);
      return c.json(
        {
          success: false,
          errors: [{ code: 404, message: "Not Found" }],
        },
        404,
      );
    }

    console.log("[LEER POST] Post encontrado exitosamente");
    console.log("[LEER POST] Resultado raw de Supabase:", JSON.stringify(result, null, 2));

    // Serializar el resultado
    const serialized = PostModel.serializer(result);
    console.log("[LEER POST] Resultado serializado:", JSON.stringify(serialized, null, 2));

    return c.json({
      success: true,
      result: serialized,
    });
  }
}

