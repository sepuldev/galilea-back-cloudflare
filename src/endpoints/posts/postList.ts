import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { PostModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";

export class PostList extends OpenAPIRoute {
  public schema = {
    tags: ["Posts"],
    summary: "List all posts with optional filtering and pagination",
    operationId: "list-posts",
    request: {
      query: z.object({
        search: z.string().optional(),
        author_id: z.string().uuid().optional(),
        category_id: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
        limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
        offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
        orderBy: z.string().optional(),
      }),
    },
    responses: createCRUDResponses(z.array(PostModel.schema), {
      include200: true,
      custom200Description: "Posts retrieved successfully",
    }),
  };

  public async handle(c: AppContext) {
    // Endpoint público - NO requiere autenticación
    // Permite que cualquier usuario del frontend pueda listar posts

    console.log("[LISTAR POSTS] Iniciando solicitud GET /posts");
    const data = await this.getValidatedData<typeof this.schema>();
    console.log("[LISTAR POSTS] Parámetros de consulta recibidos:", JSON.stringify(data.query, null, 2));

    const supabase = getSupabaseClient(c.env);
    console.log("[LISTAR POSTS] Cliente de Supabase inicializado");
    console.log("[LISTAR POSTS] Nombre de tabla:", PostModel.tableName);

    // Hacer JOIN con categories para obtener el nombre de la categoría
    // Intentamos diferentes sintaxis según cómo esté configurada la relación en Supabase
    let query = supabase
      .from(PostModel.tableName)
      .select(`
        *,
        categories (
          name
        )
      `);
    console.log("[LISTAR POSTS] Consulta base creada con JOIN a categories (sintaxis: categories(name))");

    // Aplicar búsqueda si se proporciona (busca en título y contenido)
    if (data.query.search) {
      const searchTerm = `%${data.query.search}%`;
      const searchConditions = `title.ilike."${searchTerm}",content.ilike."${searchTerm}"`;
      query = query.or(searchConditions);
      console.log("[LISTAR POSTS] Filtro de búsqueda aplicado:", searchConditions);
    }

    // Filtrar por author_id si se proporciona
    if (data.query.author_id) {
      query = query.eq("author_id", data.query.author_id);
      console.log("[LISTAR POSTS] Filtro por autor aplicado:", data.query.author_id);
    }

    // Filtrar por category_id si se proporciona
    if (data.query.category_id !== undefined) {
      query = query.eq("category_id", data.query.category_id);
      console.log("[LISTAR POSTS] Filtro por categoría aplicado:", data.query.category_id);
    }

    // Aplicar ordenamiento (por defecto: created_at DESC)
    const orderBy = data.query.orderBy || "created_at DESC";
    const [orderField, orderDirection] = orderBy.split(" ");
    query = query.order(orderField, {
      ascending: orderDirection?.toLowerCase() !== "desc",
    });
    console.log("[LISTAR POSTS] Ordenamiento aplicado - Campo:", orderField, "| Dirección:", orderDirection);

    // Aplicar paginación
    if (data.query.limit) {
      query = query.limit(data.query.limit);
      console.log("[LISTAR POSTS] Límite aplicado:", data.query.limit, "registros");
    }
    if (data.query.offset !== undefined) {
      const end = data.query.offset + (data.query.limit || 100) - 1;
      query = query.range(data.query.offset, end);
      console.log("[LISTAR POSTS] Rango aplicado: desde", data.query.offset, "hasta", end);
    }

    console.log("[LISTAR POSTS] Ejecutando consulta en Supabase...");
    const { data: results, error } = await query;

    if (error) {
      console.error("[LISTAR POSTS] ERROR en consulta de Supabase:", error.message);
      console.error("[LISTAR POSTS] Detalles del error:", JSON.stringify(error, null, 2));
      console.error("[LISTAR POSTS] Código de error:", error.code);
      console.error("[LISTAR POSTS] Detalles completos:", error);
      return c.json(
        {
          success: false,
          errors: [{ code: 500, message: error.message }],
        },
        500,
      );
    }

    console.log("[LISTAR POSTS] Consulta ejecutada exitosamente");
    console.log("[LISTAR POSTS] Cantidad de resultados raw:", results?.length || 0);
    if (results && results.length > 0) {
      console.log("[LISTAR POSTS] Primer resultado raw completo:", JSON.stringify(results[0], null, 2));
      console.log("[LISTAR POSTS] ¿Tiene categories?:", !!results[0].categories);
      console.log("[LISTAR POSTS] Tipo de categories:", typeof results[0].categories);
      if (results[0].categories) {
        console.log("[LISTAR POSTS] Categories value:", JSON.stringify(results[0].categories, null, 2));
      }
    } else {
      console.warn("[LISTAR POSTS] ADVERTENCIA: No se encontraron resultados");
    }

    // Serializar todos los resultados primero, excluyendo el objeto categories del JOIN
    const serialized = (results || []).map((result: any) => {
      // Extraer image_url y categories antes de desestructurar
      const imageUrl = result.image_url ?? null;
      const { categories, ...rest } = result;
      
      // Asegurar que image_url esté en rest antes de serializar
      const restWithImageUrl = {
        ...rest,
        image_url: imageUrl,
      };
      
      const serializedItem = PostModel.serializer(restWithImageUrl);
      
      // Verificar que image_url esté presente después de serializar
      if (!('image_url' in serializedItem)) {
        (serializedItem as any).image_url = imageUrl;
      }
      
      return serializedItem;
    });

    // Obtener category_name: primero intentar del JOIN, si no funciona hacer consulta separada
    const categoryIds = [...new Set(
      serialized
        .map((p: any) => p.category_id)
        .filter((id): id is number => typeof id === 'number' && id != null)
    )];
    console.log("[LISTAR POSTS] Category IDs encontrados:", categoryIds);

    if (categoryIds.length > 0) {
      // Intentar extraer del JOIN primero
      let categoryMap = new Map<number, string>();

      if (results && results.length > 0 && results[0].categories) {
        console.log("[LISTAR POSTS] Intentando extraer category_name del JOIN...");
        results.forEach((result) => {
          if (result.categories && result.category_id) {
            let categoryName: string | undefined;
            if (Array.isArray(result.categories) && result.categories.length > 0) {
              categoryName = result.categories[0]?.name;
            } else if (typeof result.categories === 'object' && result.categories !== null && 'name' in result.categories) {
              categoryName = (result.categories as any).name;
            }
            if (categoryName) {
              categoryMap.set(result.category_id, categoryName);
            }
          }
        });
        console.log("[LISTAR POSTS] Categorías extraídas del JOIN:", Array.from(categoryMap.entries()));
      }

      // Si no se obtuvieron nombres del JOIN, hacer consulta separada
      if (categoryMap.size === 0) {
        console.log("[LISTAR POSTS] No se obtuvo category_name del JOIN, haciendo consulta separada a categories...");
        console.log("[LISTAR POSTS] Buscando categorías con IDs:", categoryIds);

        // Intentar diferentes nombres de tabla posibles
        const possibleTableNames = ["categories", "category"];
        let categories: any[] | null = null;
        let categoriesError: any = null;

        for (const tableName of possibleTableNames) {
          console.log(`[LISTAR POSTS] Intentando consultar tabla: ${tableName}`);
          const result = await supabase
            .from(tableName)
            .select("id, name")
            .in("id", categoryIds);

          categories = result.data;
          categoriesError = result.error;

          console.log(`[LISTAR POSTS] Resultado de consulta a ${tableName}:`);
          console.log(`[LISTAR POSTS] - Error:`, categoriesError ? JSON.stringify(categoriesError, null, 2) : "null");
          console.log(`[LISTAR POSTS] - Data:`, categories ? JSON.stringify(categories, null, 2) : "null");
          console.log(`[LISTAR POSTS] - Cantidad de categorías:`, categories?.length || 0);

          if (categoriesError) {
            console.error(`[LISTAR POSTS] Error al obtener categorías de ${tableName}:`, JSON.stringify(categoriesError, null, 2));
            if (categoriesError.code === '42P01') {
              console.error(`[LISTAR POSTS] La tabla ${tableName} no existe. Probando siguiente opción...`);
              continue; // Intentar siguiente nombre de tabla
            }
          }

          if (!categoriesError && categories && categories.length > 0) {
            console.log(`[LISTAR POSTS] Categorías obtenidas de ${tableName}:`, JSON.stringify(categories, null, 2));
            break; // Encontramos datos, salir del loop
          }
        }

        if (categoriesError && categoriesError.code === '42P01') {
          console.error("[LISTAR POSTS] ERROR CRÍTICO: No se encontró la tabla de categorías. Verificar en Supabase:");
          console.error("[LISTAR POSTS] - ¿Existe la tabla 'categories' o 'category'?");
          console.error("[LISTAR POSTS] - ¿Está habilitado RLS y hay políticas que permitan la lectura?");
        } else if (!categoriesError && categories && categories.length > 0) {
          categories.forEach(cat => {
            categoryMap.set(cat.id, cat.name);
          });
          console.log("[LISTAR POSTS] Mapa de categorías creado:", Array.from(categoryMap.entries()));
        } else if (!categoriesError && (!categories || categories.length === 0)) {
          console.warn("[LISTAR POSTS] ADVERTENCIA: La consulta a categories no devolvió resultados.");
          console.warn("[LISTAR POSTS] Posibles causas:");
          console.warn("[LISTAR POSTS] 1. Row Level Security (RLS) está habilitado sin políticas de lectura");
          console.warn("[LISTAR POSTS] 2. La tabla está vacía");
          console.warn("[LISTAR POSTS] 3. Los IDs buscados", categoryIds, "no existen en la tabla");

          // Intentar consulta sin filtro para diagnosticar
          const { data: allCategories, error: allCategoriesError } = await supabase
            .from("categories")
            .select("id, name")
            .limit(10);

          if (allCategoriesError) {
            console.error("[LISTAR POSTS] Error al consultar todas las categorías:", JSON.stringify(allCategoriesError, null, 2));
            if (allCategoriesError.code === '42501' || allCategoriesError.message?.includes('policy')) {
              console.error("[LISTAR POSTS] ERROR: RLS está bloqueando el acceso. Crear una política que permita SELECT en categories");
            }
          } else {
            console.log("[LISTAR POSTS] Primeras 10 categorías en la tabla (sin filtro):", JSON.stringify(allCategories, null, 2));
            if (!allCategories || allCategories.length === 0) {
              console.warn("[LISTAR POSTS] La tabla categories está vacía o RLS está bloqueando el acceso");
            }
          }
        }
      }

      // Agregar category_name a cada post
      serialized.forEach((post: any, index) => {
        const categoryId = post.category_id;
        if (categoryId != null && typeof categoryId === 'number' && categoryMap.has(categoryId)) {
          (serialized[index] as any).category_name = categoryMap.get(categoryId);
        }
      });
    }

    console.log("[LISTAR POSTS] Cantidad de resultados serializados:", serialized.length);
    if (serialized.length > 0) {
      console.log("[LISTAR POSTS] Primer resultado final:", JSON.stringify(serialized, null, 2));
      // Verificar explícitamente que image_url esté presente
      serialized.forEach((post, index) => {
        console.log(`[LISTAR POSTS] Post ${index} tiene image_url?:`, 'image_url' in post);
        console.log(`[LISTAR POSTS] Post ${index} image_url value:`, post.image_url);
      });
    }
    console.log("[LISTAR POSTS] Respuesta final preparada");

    // Asegurar que la respuesta incluya image_url explícitamente
    const finalResult = serialized.map((post: any) => ({
      ...post,
      image_url: post.image_url ?? null, // Asegurar que image_url esté presente
    }));

    // Verificar que image_url esté presente antes de enviar
    console.log("[LISTAR POSTS] Verificando finalResult antes de enviar:");
    finalResult.forEach((post: any, index: number) => {
      console.log(`[LISTAR POSTS] Post ${index} (${post.title}):`);
      console.log(`  - Tiene image_url?:`, 'image_url' in post);
      console.log(`  - image_url value:`, post.image_url);
      console.log(`  - image_url type:`, typeof post.image_url);
    });

    // Asegurar que cada post tenga image_url explícitamente (incluso si es null) y NO tenga categories
    const finalResponse = finalResult.map((post: any) => {
      // Crear un nuevo objeto con solo los campos que queremos
      const cleanPost: any = {
        id: post.id,
        title: post.title,
        content: post.content,
        author_id: post.author_id,
        category_id: post.category_id,
        created_at: post.created_at,
        updated_at: post.updated_at,
        image_url: post.image_url ?? null, // Asegurar que image_url esté presente (incluso si es null)
        category_name: post.category_name,
      };
      return cleanPost;
    });

    const response = {
      success: true,
      result: finalResponse,
    };

    console.log("[LISTAR POSTS] Respuesta JSON completa (primeros 1000 chars):", JSON.stringify(response).substring(0, 1000));
    console.log("[LISTAR POSTS] Verificando primer post en response:", JSON.stringify(finalResponse[0], null, 2));
    console.log("[LISTAR POSTS] Primer post tiene image_url?:", 'image_url' in finalResponse[0]);
    console.log("[LISTAR POSTS] Primer post tiene categories?:", 'categories' in finalResponse[0]);

    return c.json(response);
  }
}

