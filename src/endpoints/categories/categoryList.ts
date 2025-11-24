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
        const supabase = getSupabaseClient(c.env);
        const { data: results, error } = await supabase
            .from(CategoryModel.tableName)
            .select("*")
            .order('name');

        if (error) {
            return c.json(
                {
                    success: false,
                    errors: [{ code: 500, message: error.message }],
                },
                500,
            );
        }

        return c.json({
            success: true,
            result: results,
        });
    }
}
