import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { PostModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";

export class PostRead extends OpenAPIRoute {
  public schema = {
    tags: ["Posts"],
    summary: "Get a post by ID",
    operationId: "get-post",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      "200": {
        description: "Post retrieved successfully",
        ...contentJson({
          success: Boolean,
          result: PostModel.schema,
        }),
      },
      "404": {
        description: "Post not found",
        ...contentJson({
          success: Boolean,
          errors: z.array(
            z.object({
              code: z.number(),
              message: z.string(),
            }),
          ),
        }),
      },
    },
  };

  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const supabase = getSupabaseClient(c.env);

    const { data: result, error } = await supabase
      .from(PostModel.tableName)
      .select("*")
      .eq("id", data.params.id)
      .single();

    if (error || !result) {
      return c.json(
        {
          success: false,
          errors: [{ code: 404, message: "Not Found" }],
        },
        404,
      );
    }

    // Serialize the result
    const serialized = PostModel.serializer(result);

    return c.json({
      success: true,
      result: serialized,
    });
  }
}

