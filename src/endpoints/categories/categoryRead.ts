import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { CategoryModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";

export class CategoryRead extends OpenAPIRoute {
    public schema = {
        tags: ["Categories"],
        summary: "Get a category by ID",
        operationId: "get-category",
        request: {
            params: z.object({
                id: z.string().transform((val) => parseInt(val, 10)),
            }),
        },
        responses: createCRUDResponses(CategoryModel.schema, {
            include200: true,
            custom200Description: "Category retrieved successfully",
            custom404Description: "Category not found",
        }),
    };

    public async handle(c: AppContext) {
        // Endpoint público - NO requiere autenticación
        // Permite que cualquier usuario del frontend pueda leer una categoría específica

        console.log("[LEER CATEGORÍA] Iniciando solicitud GET /categories/:id");
        const data = await this.getValidatedData<typeof this.schema>();
        console.log("[LEER CATEGORÍA] ID de la categoría solicitada:", data.params.id);
        
        const supabase = getSupabaseClient(c.env);
        console.log("[LEER CATEGORÍA] Cliente de Supabase inicializado");
        console.log("[LEER CATEGORÍA] Nombre de tabla:", CategoryModel.tableName);

        console.log("[LEER CATEGORÍA] Consultando categoría en Supabase...");
        const { data: result, error } = await supabase
            .from(CategoryModel.tableName)
            .select("*")
            .eq("id", data.params.id)
            .single();

        if (error) {
            console.error("[LEER CATEGORÍA] ERROR en consulta de Supabase:", error.message);
            console.error("[LEER CATEGORÍA] Detalles del error:", JSON.stringify(error, null, 2));
            console.error("[LEER CATEGORÍA] Código de error:", error.code);
        }

        if (error || !result) {
            console.warn("[LEER CATEGORÍA] Categoría no encontrada con ID:", data.params.id);
            return c.json(
                {
                    success: false,
                    errors: [{ code: 404, message: "Not Found" }],
                },
                404,
            );
        }

        console.log("[LEER CATEGORÍA] Categoría encontrada exitosamente");
        console.log("[LEER CATEGORÍA] Resultado raw de Supabase:", JSON.stringify(result, null, 2));

        // Serializar el resultado
        const serialized = CategoryModel.serializer(result);
        console.log("[LEER CATEGORÍA] Resultado serializado:", JSON.stringify(serialized, null, 2));

        return c.json({
            success: true,
            result: serialized,
        });
    }
}

