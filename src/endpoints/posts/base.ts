import { z } from "zod";

export const post = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  author_id: z.string().uuid(),
  category_id: z.number().int(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const PostModel = {
  tableName: "posts",
  primaryKeys: ["id"],
  schema: post,
  serializer: (obj: Record<string, string | number | boolean | null | undefined>) => {
    return {
      ...obj,
      // No hay conversiones especiales necesarias para posts
    };
  },
  serializerObject: post,
};

