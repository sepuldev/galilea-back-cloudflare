// src/endpoints/posts/base.ts
import { z } from "zod";

export const post = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  author_id: z.string().uuid(),
  category_id: z.number().int(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  category_name: z.string().optional(), // Nombre de la categoría desde el JOIN
  image_url: z.string().optional(), // URL de la imagen del post
});

export const PostModel = {
  tableName: "posts", // Nombre de la tabla en la base de datos
  primaryKeys: ["id"], // Clave primaria de la tabla
  schema: post, // Esquema de la tabla
  serializer: (obj: Record<string, string | number | boolean | null | undefined>): Record<string, string | number | boolean | null | undefined> => { // Serializador de la tabla
    // Excluir campos que no están en el schema (como el objeto categories del JOIN)
    const { categories, ...rest } = obj;
    // Asegurar que image_url se preserve explícitamente (incluso si es null o undefined)
    const imageUrl = 'image_url' in obj ? obj.image_url : null;
    return {
      ...rest,
      image_url: imageUrl, // Preservar image_url explícitamente
    };
  },
  serializerObject: post,
};

