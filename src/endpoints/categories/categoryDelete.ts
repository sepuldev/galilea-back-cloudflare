import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { CategoryModel } from "./base";
import { getSupabaseServiceClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";
import { checkAuth } from "../../shared/auth";

export class CategoryDelete extends OpenAPIRoute {
    public schema = {
        tags: ["Categories"],
        summary: "Delete a category by ID",
        operationId: "delete-category",
        request: {
            params: z.object({
                id: z.string().transform((val) => parseInt(val, 10)),
            }),
        },
        responses: createCRUDResponses(z.object({ id: z.number().int() }), {
            include200: true,
            custom200Description: "Category deleted successfully",
            custom404Description: "Category not found",
        }),
    };

    public async handle(c: AppContext) {
        // Verificar autenticación
        const authError = checkAuth(c);
        if (authError) return authError;

        console.log("[ELIMINAR CATEGORÍA] Iniciando solicitud DELETE /categories/:id");
        const data = await this.getValidatedData<typeof this.schema>();
        console.log("[ELIMINAR CATEGORÍA] ID de la categoría a eliminar:", data.params.id);
        
        const supabase = getSupabaseServiceClient(c.env);
        console.log("[ELIMINAR CATEGORÍA] Cliente de Supabase inicializado (SERVICE_ROLE_KEY)");
        console.log("[ELIMINAR CATEGORÍA] Nombre de tabla:", CategoryModel.tableName);

        // Primero, verificar si la categoría existe
        console.log("[ELIMINAR CATEGORÍA] Verificando existencia de la categoría...");
        const { data: existingCategory, error: fetchError } = await supabase
            .from(CategoryModel.tableName)
            .select("id")
            .eq("id", data.params.id)
            .single();

        if (fetchError) {
            console.error("[ELIMINAR CATEGORÍA] ERROR al verificar existencia:", fetchError.message);
            console.error("[ELIMINAR CATEGORÍA] Detalles del error:", JSON.stringify(fetchError, null, 2));
            console.error("[ELIMINAR CATEGORÍA] Código de error:", fetchError.code);
        }

        if (fetchError || !existingCategory) {
            console.warn("[ELIMINAR CATEGORÍA] Categoría no encontrada con ID:", data.params.id);
            return c.json(
                {
                    success: false,
                    errors: [{ code: 404, message: "Not Found" }],
                },
                404,
            );
        }

        console.log("[ELIMINAR CATEGORÍA] Categoría encontrada, procediendo a eliminar...");

        // Eliminar la categoría
        const { error } = await supabase
            .from(CategoryModel.tableName)
            .delete()
            .eq("id", data.params.id);

        if (error) {
            console.error("[ELIMINAR CATEGORÍA] ERROR al eliminar en Supabase:", error.message);
            console.error("[ELIMINAR CATEGORÍA] Detalles del error:", JSON.stringify(error, null, 2));
            console.error("[ELIMINAR CATEGORÍA] Código de error:", error.code);
            return c.json(
                {
                    success: false,
                    errors: [{ code: 500, message: error.message }],
                },
                500,
            );
        }

        console.log("[ELIMINAR CATEGORÍA] Categoría eliminada exitosamente");
        console.log("[ELIMINAR CATEGORÍA] ID eliminado:", data.params.id);

        return c.json({
            success: true,
            result: { id: data.params.id },
        });
    }
}

