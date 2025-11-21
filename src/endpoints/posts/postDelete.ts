import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { PostModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";
import { checkAuth } from "../../shared/auth";

export class PostDelete extends OpenAPIRoute {
  public schema = {
    tags: ["Posts"],
    summary: "Delete a post by ID",
    operationId: "delete-post",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: createCRUDResponses(z.object({ id: z.string().uuid() }), {
      include200: true,
      custom200Description: "Post deleted successfully",
      custom404Description: "Post not found",
    }),
  };

  public async handle(c: AppContext) {
    // Verificar autenticación
    const authError = checkAuth(c);
    if (authError) return authError;

    console.log("[ELIMINAR POST] Iniciando solicitud DELETE /posts/:id");
    const data = await this.getValidatedData<typeof this.schema>();
    console.log("[ELIMINAR POST] ID del post a eliminar:", data.params.id);
    
    const supabase = getSupabaseClient(c.env);
    console.log("[ELIMINAR POST] Cliente de Supabase inicializado");
    console.log("[ELIMINAR POST] Nombre de tabla:", PostModel.tableName);

    // Primero, verificar si el post existe
    console.log("[ELIMINAR POST] Verificando existencia del post...");
    const { data: existingPost, error: fetchError } = await supabase
      .from(PostModel.tableName)
      .select("id")
      .eq("id", data.params.id)
      .single();

    if (fetchError) {
      console.error("[ELIMINAR POST] ERROR al verificar existencia:", fetchError.message);
      console.error("[ELIMINAR POST] Detalles del error:", JSON.stringify(fetchError, null, 2));
      console.error("[ELIMINAR POST] Código de error:", fetchError.code);
    }

    if (fetchError || !existingPost) {
      console.warn("[ELIMINAR POST] Post no encontrado con ID:", data.params.id);
      return c.json(
        {
          success: false,
          errors: [{ code: 404, message: "Not Found" }],
        },
        404,
      );
    }

    console.log("[ELIMINAR POST] Post encontrado, procediendo a eliminar...");

    // Eliminar el post
    const { error } = await supabase
      .from(PostModel.tableName)
      .delete()
      .eq("id", data.params.id);

    if (error) {
      console.error("[ELIMINAR POST] ERROR al eliminar en Supabase:", error.message);
      console.error("[ELIMINAR POST] Detalles del error:", JSON.stringify(error, null, 2));
      console.error("[ELIMINAR POST] Código de error:", error.code);
      return c.json(
        {
          success: false,
          errors: [{ code: 500, message: error.message }],
        },
        500,
      );
    }

    console.log("[ELIMINAR POST] Post eliminado exitosamente");
    console.log("[ELIMINAR POST] ID eliminado:", data.params.id);

    return c.json({
      success: true,
      result: { id: data.params.id },
    });
  }
}

