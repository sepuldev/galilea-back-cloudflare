import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext, PostUpdateData } from "../../types";
import { PostModel } from "./base";
import { getSupabaseServiceClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";
import { checkAuth, checkRole } from "../../shared/auth";

export class PostUpdate extends OpenAPIRoute {
  public schema = {
    tags: ["Posts"],
    summary: "Update a post by ID",
    operationId: "update-post",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: contentJson(
        PostModel.schema.pick({
          title: true,
          content: true,
          category_id: true,
          image_url: true,
        }).partial(),
      ),
    },
    responses: createCRUDResponses(PostModel.schema, {
      include200: true,
      custom200Description: "Post updated successfully",
      custom404Description: "Post not found",
    }),
  };

  public async handle(c: AppContext) {
    // Verificar autenticación y rol de admin
    const authError = await checkAuth(c);
    if (authError) return authError;

    // Requiere nivel editor o superior (editor, moderator, admin)
    const roleError = checkRole(c, "editor");
    if (roleError) return roleError;

    console.log("[ACTUALIZAR POST] Iniciando solicitud PUT /posts/:id");
    const data = await this.getValidatedData<typeof this.schema>();
    console.log("[ACTUALIZAR POST] ID del post a actualizar:", data.params.id);
    console.log("[ACTUALIZAR POST] Datos recibidos en el body:", JSON.stringify(data.body, null, 2));

    const supabase = getSupabaseServiceClient(c.env);
    console.log("[ACTUALIZAR POST] Cliente de Supabase inicializado (SERVICE_ROLE_KEY)");
    console.log("[ACTUALIZAR POST] Nombre de tabla:", PostModel.tableName);

    // Preparar datos de actualización
    const updateData: PostUpdateData = {};
    if (data.body.title !== undefined) updateData.title = data.body.title;
    if (data.body.content !== undefined) updateData.content = data.body.content;
    if (data.body.category_id !== undefined) updateData.category_id = data.body.category_id;
    if (data.body.image_url !== undefined) updateData.image_url = data.body.image_url;

    // Actualizar timestamp
    updateData.updated_at = new Date().toISOString();

    console.log("[ACTUALIZAR POST] Datos de actualización preparados:", JSON.stringify(updateData, null, 2));
    console.log("[ACTUALIZAR POST] Campos a actualizar:", Object.keys(updateData).join(", "));

    // Primero verificar que el post existe
    const { data: existingPost, error: fetchError } = await supabase
      .from(PostModel.tableName)
      .select("id")
      .eq("id", data.params.id)
      .maybeSingle();

    if (fetchError) {
      console.error("[ACTUALIZAR POST] Error verificando existencia:", fetchError);
      return c.json({ success: false, errors: [{ code: 500, message: "Database error" }] }, 500);
    }

    if (!existingPost) {
      console.warn("[ACTUALIZAR POST] Post no encontrado con ID:", data.params.id);
      return c.json(
        {
          success: false,
          errors: [{ code: 404, message: "Post not found" }],
        },
        404,
      );
    }

    console.log("[ACTUALIZAR POST] Actualizando post en Supabase...");
    const { data: result, error } = await supabase
      .from(PostModel.tableName)
      .update(updateData)
      .eq("id", data.params.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[ACTUALIZAR POST] ERROR al actualizar en Supabase:", error.message);
      console.error("[ACTUALIZAR POST] Detalles del error:", JSON.stringify(error, null, 2));
      console.error("[ACTUALIZAR POST] Código de error:", error.code);
    }

    if (error || !result) {
      console.warn("[ACTUALIZAR POST] Post no encontrado o actualización fallida");
      console.warn("[ACTUALIZAR POST] ID buscado:", data.params.id);
      return c.json(
        {
          success: false,
          errors: [{ code: 404, message: "Not Found" }],
        },
        404,
      );
    }

    console.log("[ACTUALIZAR POST] Actualización exitosa");
    console.log("[ACTUALIZAR POST] Resultado raw de Supabase:", JSON.stringify(result, null, 2));

    // Serializar el resultado
    const serialized = PostModel.serializer(result);
    console.log("[ACTUALIZAR POST] Resultado serializado:", JSON.stringify(serialized, null, 2));

    return c.json({
      success: true,
      result: serialized,
    });
  }
}

