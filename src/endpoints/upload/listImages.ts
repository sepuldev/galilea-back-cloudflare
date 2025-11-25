import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { getSupabaseServiceClient } from "../../supabase";
import { z } from "zod";
import { checkAuth } from "../../shared/auth";

export class ListImages extends OpenAPIRoute {
    public schema = {
        tags: ["Upload"],
        summary: "List all available images in storage",
        operationId: "list-images",
        request: {
            query: z.object({
                limit: z.string().optional(),
                offset: z.string().optional(),
            }),
        },
        responses: {
            "200": {
                description: "Images retrieved successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            result: z.array(z.object({
                                name: z.string(),
                                url: z.string(),
                                created_at: z.string().optional(),
                                size: z.number().optional(),
                            })),
                        }),
                    },
                },
            },
            "401": {
                description: "Unauthorized - Autenticación requerida",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            errors: z.array(z.object({
                                code: z.number(),
                                message: z.string()
                            }))
                        })
                    }
                }
            },
            "500": {
                description: "Internal Server Error",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            errors: z.array(z.object({
                                code: z.number(),
                                message: z.string()
                            }))
                        })
                    }
                }
            }
        },
    };

    public async handle(c: AppContext) {
        // Verificar autenticación
        const authError = checkAuth(c);
        if (authError) return authError;

        const data = await this.getValidatedData<typeof this.schema>();
        const limit = parseInt(data.query?.limit || "100", 10);
        const offset = parseInt(data.query?.offset || "0", 10);

        const supabase = getSupabaseServiceClient(c.env);
        const bucketName = 'galilea-posts';
        const folderPath = 'posts';

        console.log(`[LIST IMAGES] Listing images from bucket: ${bucketName}, folder: ${folderPath}`);

        try {
            // Listar archivos en la carpeta 'posts' del bucket
            const { data: files, error } = await supabase
                .storage
                .from(bucketName)
                .list(folderPath, {
                    limit: limit,
                    offset: offset,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (error) {
                console.error("[LIST IMAGES] Error listing files:", error);
                return c.json(
                    {
                        success: false,
                        errors: [{ code: 500, message: error.message }],
                    },
                    500
                );
            }

            console.log(`[LIST IMAGES] Found ${files?.length || 0} files`);

            // Filtrar solo archivos de imagen y construir URLs públicas
            const imageFiles = (files || [])
                .filter(file => {
                    // Filtrar solo archivos de imagen
                    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
                    const fileName = file.name.toLowerCase();
                    return imageExtensions.some(ext => fileName.endsWith(ext));
                })
                .map(file => {
                    const filePath = `${folderPath}/${file.name}`;
                    const { data: { publicUrl } } = supabase
                        .storage
                        .from(bucketName)
                        .getPublicUrl(filePath);

                    return {
                        name: file.name,
                        url: publicUrl,
                        created_at: file.created_at,
                        size: file.metadata?.size || file.metadata?.fileSize || undefined,
                    };
                });

            return c.json({
                success: true,
                result: imageFiles,
            });
        } catch (error) {
            console.error("[LIST IMAGES] Unexpected error:", error);
            return c.json(
                {
                    success: false,
                    errors: [{ 
                        code: 500, 
                        message: error instanceof Error ? error.message : "Internal Server Error" 
                    }],
                },
                500
            );
        }
    }
}

