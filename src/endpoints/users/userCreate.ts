import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { UserModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";
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
    }
}