import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";
import { commonResponses } from "../../shared/responses";
import { checkRateLimit } from "../../shared/rateLimit";

// Schema para validar el body del request
const emailSchema = z.object({
    first_name: z.string().min(1, "El nombre es requerido"),
    last_name: z.string().min(1, "Los apellidos son requeridos"),
    email: z.string().email("Email inválido"),
    phone_number: z.string().min(1, "El número de teléfono es requerido"),
    dni_or_id: z.string().optional(),
    nationality: z.string().min(1, "La nacionalidad es requerida"),
    consultation_request: z.string().min(1, "El motivo de consulta es requerido"),
});

export class EmailCreate extends OpenAPIRoute {
    public schema = {
        tags: ["Email"],
        summary: "Enviar emails de contacto",
        operationId: "create-email",
        request: {
            body: contentJson(emailSchema),
        },
        responses: {
            "200": {
                description: "Emails enviados correctamente",
                ...contentJson({
                    success: Boolean,
                    message: z.string(),
                }),
            },
            ...commonResponses,
        },
    };

    public async handle(c: AppContext) {
        // Este es un endpoint público - NO requiere autenticación
        // La protección se hace mediante rate limiting estricto para prevenir abuso
        
        // Rate limiting estricto para email (5 requests por minuto)
        const rateLimitError = checkRateLimit(c, 5, 60);
        if (rateLimitError) return rateLimitError;

        console.log("[CREAR EMAIL] Iniciando solicitud POST /email");

        try {
            const data = await this.getValidatedData<typeof this.schema>();
            console.log("[CREAR EMAIL] Datos recibidos en el body:", JSON.stringify(data.body, null, 2));

            // Obtener variables de entorno de Cloudflare Workers
            const sendgridApiKey = c.env.SENDGRID_API_KEY;
            const ownerEmail = c.env.OWNER_EMAIL || c.env.SMTP_FROM;
            const smtpFrom = c.env.SMTP_FROM;
            const smtpReplyTo = c.env.SMTP_REPLY_TO;

            console.log("[CREAR EMAIL] Verificando variables de entorno...");
            console.log("[CREAR EMAIL] SENDGRID_API_KEY configurada:", !!sendgridApiKey);
            console.log("[CREAR EMAIL] OWNER_EMAIL configurada:", !!ownerEmail);
            console.log("[CREAR EMAIL] SMTP_FROM configurada:", !!smtpFrom);

            if (!sendgridApiKey) {
                console.error("[CREAR EMAIL] ERROR: SENDGRID_API_KEY no configurada");
                return c.json(
                    {
                        success: false,
                        errors: [{ code: 500, message: "SENDGRID_API_KEY no configurada" }],
                    },
                    500,
                );
            }

            if (!ownerEmail) {
                console.error("[CREAR EMAIL] ERROR: OWNER_EMAIL o SMTP_FROM no configurado");
                return c.json(
                    {
                        success: false,
                        errors: [{ code: 500, message: "OWNER_EMAIL o SMTP_FROM no configurado" }],
                    },
                    500,
                );
            }

            if (!smtpFrom) {
                console.error("[CREAR EMAIL] ERROR: SMTP_FROM no configurado");
                return c.json(
                    {
                        success: false,
                        errors: [{ code: 500, message: "SMTP_FROM no configurado" }],
                    },
                    500,
                );
            }

            // Importar SendGrid dinámicamente (compatible con Cloudflare Workers)
            const sgMail = await import("@sendgrid/mail");
            sgMail.default.setApiKey(sendgridApiKey);
            console.log("[CREAR EMAIL] Cliente de SendGrid inicializado");

            const { first_name, last_name, email, phone_number, dni_or_id, nationality, consultation_request } = data.body;

            // 1. Enviar email al propietario con plantilla d-51125060ad184d2a8ded541dca5256eb
            console.log("[CREAR EMAIL] Enviando email al propietario...");
            console.log("[CREAR EMAIL] Destinatario:", ownerEmail);
            console.log("[CREAR EMAIL] Template ID: d-51125060ad184d2a8ded541dca5256eb");

            await sgMail.default.send({
                to: ownerEmail,
                from: smtpFrom,
                replyTo: email, // El propietario puede responder directamente al usuario
                templateId: "d-51125060ad184d2a8ded541dca5256eb",
                dynamicTemplateData: {
                    name: `${first_name} ${last_name}`,
                    first_name: first_name,
                    last_name: last_name,
                    phone_number: phone_number,
                    email: email,
                    dni_orid: dni_or_id || "No proporcionado",
                    nationality: nationality,
                    consultation_request: consultation_request,
                },
            });

            console.log("[CREAR EMAIL] Email al propietario enviado exitosamente");

            // 2. Enviar email de confirmación al usuario con plantilla d-64abcd8ced2a4a0bb87915faf89a2b31
            console.log("[CREAR EMAIL] Enviando email de confirmación al usuario...");
            console.log("[CREAR EMAIL] Destinatario:", email);
            console.log("[CREAR EMAIL] Template ID: d-64abcd8ced2a4a0bb87915faf89a2b31");

            await sgMail.default.send({
                to: email,
                from: smtpFrom,
                replyTo: smtpReplyTo || smtpFrom,
                templateId: "d-64abcd8ced2a4a0bb87915faf89a2b31",
                dynamicTemplateData: {
                    first_name: first_name,
                    last_name: last_name,
                    email: email,
                    phone_number: phone_number,
                    consultation_reason: consultation_request,
                    dni_or_id: dni_or_id || "No proporcionado",
                    nationality: nationality,
                },
            });

            console.log("[CREAR EMAIL] Email de confirmación enviado exitosamente");
            console.log("[CREAR EMAIL] Ambos emails enviados correctamente");

            return c.json(
                {
                    success: true,
                    message: "Emails enviados correctamente",
                },
                200,
            );
        } catch (error: unknown) {
            console.error("[CREAR EMAIL] ERROR al enviar emails:", error);
            
            // Manejar error de forma type-safe
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Error al enviar los emails";
            
            const errorDetails = error instanceof Error 
                ? error.toString() 
                : String(error);
            
            console.error("[CREAR EMAIL] Detalles del error:", errorDetails);

            // Verificar si es un error de SendGrid con response
            if (error && typeof error === "object" && "response" in error) {
                const sendGridError = error as { response?: { body?: unknown } };
                if (sendGridError.response?.body) {
                    console.error("[CREAR EMAIL] Respuesta de SendGrid:", JSON.stringify(sendGridError.response.body, null, 2));
                }
            }

            return c.json(
                {
                    success: false,
                    errors: [
                        {
                            code: 500,
                            message: errorMessage,
                        },
                    ],
                },
                500,
            );
        }
    }
}
