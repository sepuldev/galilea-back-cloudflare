import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { PostModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";

export class PostCreate extends OpenAPIRoute {
  public schema = {
    tags: ["Posts"],
    summary: "Create a new post",
    operationId: "create-post",
    request: {
      body: contentJson(
        PostModel.schema.pick({
          title: true,
          content: true,
          author_id: true,
          category_id: true,
        }),
      ),
    },
    responses: {
      "201": {
        description: "Post created successfully",
        ...contentJson({
          success: Boolean,
          result: PostModel.schema,
        }),
      },
      "400": {
        description: "Bad request",
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
      .insert([data.body])
      .select()
      .single();

    if (error) {
      return c.json(
        {
          success: false,
          errors: [{ code: 400, message: error.message }],
        },
        400,
      );
    }

    // Serialize the result
    const serialized = PostModel.serializer(result);

    return c.json(
      {
        success: true,
        result: serialized,
      },
      201,
    );
  }
}

