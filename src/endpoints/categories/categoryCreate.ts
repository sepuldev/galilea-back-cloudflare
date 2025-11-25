import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { CategoryModel } from "./base";
import { getSupabaseServiceClient } from "../../supabase";
import { createCRUDResponses } from "../../shared/responses";
import { checkAuth, checkRole } from "../../shared/auth";

export class CategoryCreate extends OpenAPIRoute {
    public schema = {
        tags: ["Categories"],
        summary: "Create a new category",
        operationId: "create-category",
        request: {
            body: contentJson(
                CategoryModel.schema.pick({
                    name: true,
                    description: true,
                }),
            ),
        },
        responses: createCRUDResponses(CategoryModel.schema, {
            include201: true,
            custom201Description: "Category created successfully",
        }),
    };

    public async handle(c: AppContext) {
        // Verificar autenticación y rol de admin
        const authError = await checkAuth(c);
        if (authError) return authError;
        
        const roleError = checkRole(c, "admin");
        if (roleError) return roleError;

        console.log("[CREAR CATEGORÍA] Iniciando solicitud POST /categories");
        const data = await this.getValidatedData<typeof this.schema>();
        console.log("[CREAR CATEGORÍA] Datos recibidos en el body:", JSON.stringify(data.body, null, 2));
        
        const supabase = getSupabaseServiceClient(c.env);
        console.log("[CREAR CATEGORÍA] Cliente de Supabase inicializado (SERVICE_ROLE_KEY)");
        console.log("[CREAR CATEGORÍA] Nombre de tabla:", CategoryModel.tableName);

        console.log("[CREAR CATEGORÍA] Insertando datos en Supabase...");
        const { data: result, error } = await supabase
            .from(CategoryModel.tableName)
            .insert([data.body])
            .select()
            .single();

        if (error) {
            console.error("[CREAR CATEGORÍA] ERROR al insertar en Supabase:", error.message);
            console.error("[CREAR CATEGORÍA] Detalles del error:", JSON.stringify(error, null, 2));
            console.error("[CREAR CATEGORÍA] Código de error:", error.code);
            console.error("[CREAR CATEGORÍA] Datos que se intentaron insertar:", JSON.stringify(data.body, null, 2));
            return c.json(
                {
                    success: false,
                    errors: [{ code: 400, message: error.message }],
                },
                400,
            );
        }

        console.log("[CREAR CATEGORÍA] Inserción exitosa");
        console.log("[CREAR CATEGORÍA] Resultado raw de Supabase:", JSON.stringify(result, null, 2));

        // Serializar el resultado
        const serialized = CategoryModel.serializer(result);
        console.log("[CREAR CATEGORÍA] Resultado serializado:", JSON.stringify(serialized, null, 2));
        console.log("[CREAR CATEGORÍA] Categoría creada con ID:", serialized.id);

        return c.json(
            {
                success: true,
                result: serialized,
            },
            201,
        );
    }
}

