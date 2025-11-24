import { z } from "zod";

export const category = z.object({
    id: z.number().int(),
    name: z.string(),
    description: z.string().optional().nullable(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
});

export const CategoryModel = {
    tableName: "categories",
    primaryKeys: ["id"],
    schema: category,
    serializer: (obj: any) => obj,
};
