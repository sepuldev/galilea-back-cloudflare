import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { CategoryModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";

export class CategoryList extends OpenAPIRoute {
    public schema = {
        tags: ["Categories"],
        summary: "List all categories",
        operationId: "list-categories",
        responses: createCRUDResponses(z.array(CategoryModel.schema), {
            include200: true,
            custom200Description: "Categories retrieved successfully",
        }),
    };

    public async handle(c: AppContext) {
        // Endpoint público - NO requiere autenticación
        // Permite que cualquier usuario del frontend pueda listar categorías

        console.log("[LISTAR CATEGORÍAS] Iniciando solicitud GET /categories");
        const supabase = getSupabaseClient(c.env);
        console.log("[LISTAR CATEGORÍAS] Cliente de Supabase inicializado");
        console.log("[LISTAR CATEGORÍAS] Nombre de tabla:", CategoryModel.tableName);

        const { data: results, error } = await supabase
            .from(CategoryModel.tableName)
            .select("*")
            .order('name');

        if (error) {
            console.error("[LISTAR CATEGORÍAS] ERROR en consulta de Supabase:", error.message);
            console.error("[LISTAR CATEGORÍAS] Detalles del error:", JSON.stringify(error, null, 2));
            return c.json(
                {
                    success: false,
                    errors: [{ code: 500, message: error.message }],
                },
                500,
            );
        }

        console.log("[LISTAR CATEGORÍAS] Consulta ejecutada exitosamente");
        console.log("[LISTAR CATEGORÍAS] Cantidad de resultados:", results?.length || 0);

        // Serializar todos los resultados
        const serialized = (results || []).map((result) =>
            CategoryModel.serializer(result),
        );

        console.log("[LISTAR CATEGORÍAS] Cantidad de resultados serializados:", serialized.length);

        return c.json({
            success: true,
            result: serialized,
        });
    }
}
