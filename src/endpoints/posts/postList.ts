import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { PostModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";

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
    responses: {
      "200": {
        description: "Posts retrieved successfully",
        ...contentJson({
          success: Boolean,
          result: z.array(PostModel.schema),
        }),
      },
    },
  };

  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const supabase = getSupabaseClient(c.env);

    let query = supabase.from(PostModel.tableName).select("*");

    // Apply search if provided (search in title and content)
    if (data.query.search) {
      const searchTerm = `%${data.query.search}%`;
      const searchConditions = `title.ilike."${searchTerm}",content.ilike."${searchTerm}"`;
      query = query.or(searchConditions);
    }

    // Filter by author_id if provided
    if (data.query.author_id) {
      query = query.eq("author_id", data.query.author_id);
    }

    // Filter by category_id if provided
    if (data.query.category_id !== undefined) {
      query = query.eq("category_id", data.query.category_id);
    }

    // Apply ordering (default: created_at DESC)
    const orderBy = data.query.orderBy || "created_at DESC";
    const [orderField, orderDirection] = orderBy.split(" ");
    query = query.order(orderField, {
      ascending: orderDirection?.toLowerCase() !== "desc",
    });

    // Apply pagination
    if (data.query.limit) {
      query = query.limit(data.query.limit);
    }
    if (data.query.offset !== undefined) {
      const end = data.query.offset + (data.query.limit || 100) - 1;
      query = query.range(data.query.offset, end);
    }

    const { data: results, error } = await query;

    if (error) {
      return c.json(
        {
          success: false,
          errors: [{ code: 500, message: error.message }],
        },
        500,
      );
    }

    // Serialize all results
    const serialized = (results || []).map((result) =>
      PostModel.serializer(result),
    );

    return c.json({
      success: true,
      result: serialized,
    });
  }
}

