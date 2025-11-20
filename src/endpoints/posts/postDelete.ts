import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { PostModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";

export class PostDelete extends OpenAPIRoute {
  public schema = {
    tags: ["Posts"],
    summary: "Delete a post by ID",
    operationId: "delete-post",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      "200": {
        description: "Post deleted successfully",
        ...contentJson({
          success: Boolean,
          result: z.object({ id: z.string().uuid() }),
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

    // First, check if the post exists
    const { data: existingPost, error: fetchError } = await supabase
      .from(PostModel.tableName)
      .select("id")
      .eq("id", data.params.id)
      .single();

    if (fetchError || !existingPost) {
      return c.json(
        {
          success: false,
          errors: [{ code: 404, message: "Not Found" }],
        },
        404,
      );
    }

    // Delete the post
    const { error } = await supabase
      .from(PostModel.tableName)
      .delete()
      .eq("id", data.params.id);

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
      result: { id: data.params.id },
    });
  }
}

