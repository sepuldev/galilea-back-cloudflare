import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { TaskModel } from "./base";
import { getSupabaseClient } from "../../supabase";
import { z } from "zod";

export class TaskRead extends OpenAPIRoute {
  public schema = {
    tags: ["Tasks"],
    summary: "Get a task by ID",
    operationId: "get-task",
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10)),
      }),
    },
    responses: {
      "200": {
        description: "Task retrieved successfully",
        ...contentJson({
          success: Boolean,
          result: TaskModel.schema,
        }),
      },
      "404": {
        description: "Task not found",
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
      .from(TaskModel.tableName)
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
    const serialized = TaskModel.serializer(result);

    return c.json({
      success: true,
      result: serialized,
    });
  }
}
