import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { CategoryModel } from "./base";
import { getSupabaseServiceClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";
import { checkAuth, checkRole } from "../../shared/auth";

export class CategoryUpdate extends OpenAPIRoute {
    public schema = {
        tags: ["Categories"],
        summary: "Update a category by ID",
        operationId: "update-category",
        request: {
            params: z.object({
                id: z.string(),
            }),
            body: contentJson(
                CategoryModel.schema.pick({
                    name: true,
                    description: true,
                }).partial(),
            ),
        },
        responses: createCRUDResponses(CategoryModel.schema, {
            include200: true,
            custom200Description: "Category updated successfully",
            custom404Description: "Category not found",
        }),
    };

    public async handle(c: AppContext) {
        console.log("[ACTUALIZAR CATEGORÍA] Handler ejecutado - URL:", c.req.url);
        console.log("[ACTUALIZAR CATEGORÍA] Método:", c.req.method);
        console.log("[ACTUALIZAR CATEGORÍA] Path:", c.req.path);
        
        // Verificar autenticación y rol de admin
        const authError = await checkAuth(c);
        if (authError) {
            console.log("[ACTUALIZAR CATEGORÍA] Error de autenticación");
            return authError;
        }
        
        const roleError = checkRole(c, "admin");
        if (roleError) return roleError;

        console.log("[ACTUALIZAR CATEGORÍA] Iniciando solicitud PUT /categories/:id");
        const data = await this.getValidatedData<typeof this.schema>();
        const categoryId = parseInt(data.params.id, 10);
        if (isNaN(categoryId)) {
            return c.json(
                {
                    success: false,
                    errors: [{ code: 400, message: "Invalid category ID" }],
                },
                400,
            );
        }
        console.log("[ACTUALIZAR CATEGORÍA] ID de la categoría a actualizar:", categoryId);
        console.log("[ACTUALIZAR CATEGORÍA] Datos recibidos en el body:", JSON.stringify(data.body, null, 2));
        
        const supabase = getSupabaseServiceClient(c.env);
        console.log("[ACTUALIZAR CATEGORÍA] Cliente de Supabase inicializado (SERVICE_ROLE_KEY)");
        console.log("[ACTUALIZAR CATEGORÍA] Nombre de tabla:", CategoryModel.tableName);

        // Preparar datos de actualización
        const updateData: { name?: string | null; description?: string | null; updated_at?: string } = {};
        if (data.body.name !== undefined) updateData.name = data.body.name;
        if (data.body.description !== undefined) updateData.description = data.body.description;
        
        // Si no hay datos para actualizar, devolver error
        if (Object.keys(updateData).length === 0) {
            console.warn("[ACTUALIZAR CATEGORÍA] No se proporcionaron datos para actualizar");
            return c.json(
                {
                    success: false,
                    errors: [{ code: 400, message: "No se proporcionaron datos para actualizar" }],
                },
                400,
            );
        }
        
        // Actualizar timestamp
        updateData.updated_at = new Date().toISOString();

        console.log("[ACTUALIZAR CATEGORÍA] Datos de actualización preparados:", JSON.stringify(updateData, null, 2));
        console.log("[ACTUALIZAR CATEGORÍA] Campos a actualizar:", Object.keys(updateData).join(", "));

        console.log("[ACTUALIZAR CATEGORÍA] Actualizando categoría en Supabase...");
        
        // Primero verificar que la categoría existe
        const { data: existingCategory, error: fetchError } = await supabase
            .from(CategoryModel.tableName)
            .select("id")
            .eq("id", categoryId)
            .single();
            
        if (fetchError || !existingCategory) {
            console.warn("[ACTUALIZAR CATEGORÍA] Categoría no encontrada con ID:", categoryId);
            return c.json(
                {
                    success: false,
                    errors: [{ code: 404, message: "Category not found" }],
                },
                404,
            );
        }
        
        const { data: result, error } = await supabase
            .from(CategoryModel.tableName)
            .update(updateData)
            .eq("id", categoryId)
            .select()
            .single();

        if (error) {
            console.error("[ACTUALIZAR CATEGORÍA] ERROR al actualizar en Supabase:", error.message);
            console.error("[ACTUALIZAR CATEGORÍA] Detalles del error:", JSON.stringify(error, null, 2));
            console.error("[ACTUALIZAR CATEGORÍA] Código de error:", error.code);
        }

        if (error || !result) {
            console.warn("[ACTUALIZAR CATEGORÍA] Categoría no encontrada o actualización fallida");
            console.warn("[ACTUALIZAR CATEGORÍA] ID buscado:", data.params.id);
            return c.json(
                {
                    success: false,
                    errors: [{ code: 404, message: "Not Found" }],
                },
                404,
            );
        }

        console.log("[ACTUALIZAR CATEGORÍA] Actualización exitosa");
        console.log("[ACTUALIZAR CATEGORÍA] Resultado raw de Supabase:", JSON.stringify(result, null, 2));

        // Serializar el resultado
        const serialized = CategoryModel.serializer(result);
        console.log("[ACTUALIZAR CATEGORÍA] Resultado serializado:", JSON.stringify(serialized, null, 2));

        return c.json({
            success: true,
            result: serialized,
        });
    }
}

