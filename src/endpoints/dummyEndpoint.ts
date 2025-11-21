import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../types";
import { z } from "zod";
import { createCRUDResponses } from "../shared/responses";

export class DummyEndpoint extends OpenAPIRoute {
  public schema = {
    tags: ["Dummy"],
    summary: "this endpoint is an example",
    operationId: "example-endpoint", // This is optional
    request: {
      params: z.object({
        slug: z.string(),
      }),
      body: contentJson(
        z.object({
          name: z.string(),
        }),
      ),
    },
    responses: createCRUDResponses(
      z.object({
        msg: z.string(),
        slug: z.string(),
        name: z.string(),
      }),
      {
        include200: true,
        custom200Description: "Returns the log details",
      }
    ),
  };

  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    return {
      success: true,
      result: {
        msg: "this is a dummy endpoint, serving as example",
        slug: data.params.slug,
        name: data.body.name,
      },
    };
  }
}
