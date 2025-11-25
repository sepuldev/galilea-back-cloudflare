import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { checkAuth } from "../../shared/auth";
import { createCRUDResponses } from "../../shared/responses";
import { z } from "zod";

const AuthMeResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email().optional(),
    username: z.string().optional(),
  }),
  role: z.string(),
  isActive: z.boolean(),
});

export class AuthMe extends OpenAPIRoute {
  public schema = {
    tags: ["Auth"],
    summary: "Get current authenticated user information",
    operationId: "auth-me",
    responses: createCRUDResponses(AuthMeResponseSchema, {
      include200: true,
      custom200Description: "User information retrieved successfully",
    }),
  };

  public async handle(c: AppContext) {
    // Verificar autenticación
    const authError = await checkAuth(c);
    if (authError) return authError;

    // Obtener contexto de auth
    const auth = c.get("auth") as { user: any; userId: string; role: string; username?: string } | undefined;

    if (!auth) {
      return c.json(
        {
          success: false,
          errors: [
            {
              code: 401,
              message: "Unauthorized",
            },
          ],
        },
        401,
      );
    }

    return c.json({
      success: true,
      result: {
        user: {
          id: auth.user.id,
          email: auth.user.email,
          username: auth.username,
        },
        role: auth.role,
        isActive: true, // Si llegó aquí, está activo
      },
    });
  }
}

