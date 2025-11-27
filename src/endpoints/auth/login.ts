import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { createCRUDResponses } from "../../shared/responses";
import { z } from "zod";
import { getSupabaseClient } from "../../supabase";

const LoginInputSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const LoginResponseSchema = z.object({
    token: z.string(),
    refresh_token: z.string(),
    expires_at: z.number().nullable().optional(),
    user: z.object({
        id: z.string(),
        email: z.string().email().optional(),
        username: z.string().optional(),
    }),
    role: z.string(),
});

export class AuthLogin extends OpenAPIRoute {
    public schema = {
        tags: ["Auth"],
        summary: "Login with email and password",
        operationId: "auth-login",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: LoginInputSchema,
                    },
                },
            },
        },
        responses: createCRUDResponses(LoginResponseSchema, {
            include200: true,
            custom200Description: "Login successful",
        }),
    };

    public async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>();
        const { email, password } = data.body;

        const supabase = getSupabaseClient(c.env);

        // 1. Autenticar con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError || !authData.session || !authData.user) {
            return c.json(
                {
                    success: false,
                    errors: [
                        {
                            code: 401,
                            message: "Invalid credentials",
                        },
                    ],
                },
                401
            );
        }

        // 2. Obtener rol del usuario desde admin_profiles
        const { data: profileData, error: profileError } = await supabase
            .from("admin_profiles")
            .select("role, username")
            .eq("user_id", authData.user.id)
            .single();

        if (profileError || !profileData) {
            console.error(`[AUTH] Error fetching profile for user ${authData.user.id}:`, profileError);
            // Si no tiene perfil, denegar acceso (o asignar rol por defecto si fuera necesario)
            return c.json(
                {
                    success: false,
                    errors: [
                        {
                            code: 403,
                            message: "User profile not found or access denied",
                        },
                    ],
                },
                403
            );
        }

        // 3. Retornar respuesta
        return c.json({
            success: true,
            result: {
                token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
                expires_at: authData.session.expires_at,
                user: {
                    id: authData.user.id,
                    email: authData.user.email,
                    username: profileData.username,
                },
                role: profileData.role,
            },
        });
    }
}
