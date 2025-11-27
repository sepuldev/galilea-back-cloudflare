import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { getSupabaseServiceClient } from "../../supabase";
import { z } from "zod";

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
        const data = await this.getValidatedData<typeof this.schema>();
        const limit = parseInt(data.query?.limit || "100", 10);
        const offset = parseInt(data.query?.offset || "0", 10);

        const supabase = getSupabaseServiceClient(c.env);
        const bucketName = 'galilea-posts';
        const folderPath = 'posts';

        console.log(`[LIST IMAGES] Listing from bucket: ${bucketName}, folder: ${folderPath}`);

        try {
            // Listar archivos en la carpeta 'posts'
            const { data: files, error } = await supabase
                .storage
                .from(bucketName)
                .list(folderPath, {
                    limit: limit,
                    offset: offset,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            console.log(`[LIST IMAGES] Files found:`, files?.length || 0);
            if (files && files.length > 0) {
                console.log(`[LIST IMAGES] First file:`, files[0].name);
            }

            if (error) {
                console.error("[LIST IMAGES] Error:", error);
                return c.json({
                    success: false,
                    errors: [{ code: 500, message: error.message }],
                }, 500);
            }

            // Filtrar solo imágenes y construir URLs
            const imageFiles = (files || [])
                .filter(file => {
                    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
                    return imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
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
                        size: file.metadata?.size || undefined,
                    };
                });

            console.log(`[LIST IMAGES] Returning ${imageFiles.length} images`);

            return c.json({
                success: true,
                result: imageFiles,
            });
        } catch (error) {
            console.error("[LIST IMAGES] Unexpected error:", error);
            return c.json({
                success: false,
                errors: [{
                    code: 500,
                    message: error instanceof Error ? error.message : "Internal Server Error"
                }],
            }, 500);
        }
    }
}
