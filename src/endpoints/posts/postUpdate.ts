import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { PostModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";

export class PostUpdate extends OpenAPIRoute {
  public schema = {
    tags: ["Posts"],
    summary: "Update a post by ID",
    operationId: "update-post",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: contentJson(
        PostModel.schema.pick({
          title: true,
          content: true,
          author_id: true,
          category_id: true,
        }).partial(),
      ),
    },
    responses: {
      "200": {
        description: "Post updated successfully",
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

    // Prepare update data
    const updateData: Record<string, any> = {};
    if (data.body.title !== undefined) updateData.title = data.body.title;
    if (data.body.content !== undefined) updateData.content = data.body.content;
    if (data.body.author_id !== undefined) updateData.author_id = data.body.author_id;
    if (data.body.category_id !== undefined) updateData.category_id = data.body.category_id;

    const { data: result, error } = await supabase
      .from(PostModel.tableName)
      .update(updateData)
      .eq("id", data.params.id)
      .select()
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

