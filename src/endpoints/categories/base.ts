import { z } from "zod";

export const category = z.object({
    id: z.number().int(),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    created_at: z.string().datetime().nullable().optional(),
    updated_at: z.string().datetime().nullable().optional(),
});

export const CategoryModel = {
    tableName: "categories",
    primaryKeys: ["id"],
    schema: category,
    serializer: (obj: any) => obj,
};
