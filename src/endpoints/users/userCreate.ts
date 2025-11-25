import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { UserModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { createCRUDResponses } from "../../shared/responses";

export class UserCreate extends OpenAPIRoute {
    public schema = {
        tags: ["Users"],
        summary: "Crear nuevo usuario",
        operationId: "crear-user",
        request: {
            body: contentJson(
                UserModel.schema.pick({
                    dni: true,
                    email: true,
                    name: true,
                    phone: true
                }),
            ),
        },
        responses: createCRUDResponses(UserModel.schema, {
            include201: true,
            custom201Description: "User creado correctamente",
        }),
    };

    public async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>();
        const supabase = getSupabaseClient(c.env);

        const { data: result, error } = await supabase
            .from(UserModel.tableName)
            .insert([data.body])
            .select()
            .single();

        if (error) {
            return c.json(
                {
                    success: false,
                    errors: [{ code: 400, message: error.message }],
                },
                400,
            );
        }

        const serialized = UserModel.serialize(result);

        return c.json(
            {
                success: true,
                result: serialized,
            },
            201,
        );
    }
}