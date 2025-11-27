import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { createCRUDResponses } from "../../shared/responses";
import { z } from "zod";
import { getSupabaseClient } from "../../supabase";

const RefreshResponseSchema = z.object({
    token: z.string(),
    refresh_token: z.string(),
    expires_at: z.number().nullable().optional(),
});

export class AuthRefresh extends OpenAPIRoute {
    public schema = {
        tags: ["Auth"],
        summary: "Refresh access token",
        operationId: "auth-refresh",
        security: [
            {
                BearerAuth: [],
            },
        ],
        responses: createCRUDResponses(RefreshResponseSchema, {
            include200: true,
            custom200Description: "Token refreshed successfully",
        }),
    };

    public async handle(c: AppContext) {
        const authHeader = c.req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return c.json(
                {
                    success: false,
                    errors: [
                        {
                            code: 401,
                            message: "Missing or invalid Authorization header",
                        },
                    ],
                },
                401
            );
        }

        const refreshToken = authHeader.split(" ")[1];
        const supabase = getSupabaseClient(c.env);

        // Renovar sesión con Supabase Auth
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (error || !data.session) {
            console.warn("[AUTH] Error refreshing token:", error?.message);
            return c.json(
                {
                    success: false,
                    errors: [
                        {
                            code: 401,
                            message: "Invalid or expired refresh token",
                        },
                    ],
                },
                401
            );
        }

        return c.json({
            success: true,
            result: {
                token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
            },
        });
    }
}
