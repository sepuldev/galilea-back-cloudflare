// src/endpoints/posts/postCreate.ts
import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { PostModel } from "./base";
import { getSupabaseServiceClient } from "../../supabase";
import { createCRUDResponses } from "../../shared/responses";
import { checkAuth, checkRole } from "../../shared/auth";
import { checkRateLimit } from "../../shared/rateLimit";

export class PostCreate extends OpenAPIRoute {
  public schema = {
    tags: ["Posts"],
    summary: "Create a new post",
    operationId: "create-post",
    request: {
      body: contentJson(
        PostModel.schema.pick({
          title: true,
          content: true,
          category_id: true,
          image_url: true,
        }),
      ),
    },
    responses: createCRUDResponses(PostModel.schema, {
      include201: true,
      custom201Description: "Post created successfully",
      custom404Description: "Not Found - Related resource (category_id) not found",
    }),
  };

  public async handle(c: AppContext) {
    // Verificar autenticación y rol de admin
    const authError = await checkAuth(c);
    if (authError) return authError;

    // Requiere nivel editor o superior (editor, moderator, admin)
    const roleError = checkRole(c, "editor");
    if (roleError) return roleError;

    // Rate limiting
    const rateLimitError = checkRateLimit(c);
    if (rateLimitError) return rateLimitError;

    console.log("[CREAR POST] Iniciando solicitud POST /posts");
    const data = await this.getValidatedData<typeof this.schema>();
    console.log("[CREAR POST] Datos recibidos en el body:", JSON.stringify(data.body, null, 2));

    const supabase = getSupabaseServiceClient(c.env);
    console.log("[CREAR POST] Cliente de Supabase inicializado (SERVICE_ROLE_KEY)");
    console.log("[CREAR POST] Nombre de tabla:", PostModel.tableName);

    console.log("[CREAR POST] Insertando datos en Supabase...");
    const { data: result, error } = await supabase
      .from(PostModel.tableName)
      .insert([data.body])
      .select()
      .single();

    if (error) {
      console.error("[CREAR POST] ERROR al insertar en Supabase:", error.message);
      console.error("[CREAR POST] Detalles del error:", JSON.stringify(error, null, 2));
      console.error("[CREAR POST] Código de error:", error.code);
      console.error("[CREAR POST] Datos que se intentaron insertar:", JSON.stringify(data.body, null, 2));
      return c.json(
        {
          success: false,
          errors: [{ code: 400, message: error.message }],
        },
        400,
      );
    }

    console.log("[CREAR POST] Inserción exitosa");
    console.log("[CREAR POST] Resultado raw de Supabase:", JSON.stringify(result, null, 2));

    // Serializar el resultado
    const serialized = PostModel.serializer(result);
    console.log("[CREAR POST] Resultado serializado:", JSON.stringify(serialized, null, 2));
    console.log("[CREAR POST] Post creado con ID:", serialized.id);

    return c.json(
      {
        success: true,
        result: serialized,
      },
      201,
    );
  }
}
