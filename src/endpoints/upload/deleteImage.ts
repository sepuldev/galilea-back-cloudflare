import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { getSupabaseServiceClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";
import { checkAuth, checkRole } from "../../shared/auth";

export class DeleteImage extends OpenAPIRoute {
    public schema = {
        tags: ["Upload"],
        summary: "Delete an image from storage",
        operationId: "delete-image",
        request: {
            params: z.object({
                path: z.string().min(1, "Path is required"),
            }),
        },
        responses: {
            "200": {
                description: "Image deleted successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            result: z.object({
                                path: z.string(),
                                message: z.string(),
                            }),
                        }),
                    },
                },
            },
            "400": {
                description: "Bad Request",
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
            "404": {
                description: "Image not found",
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
        // Verificar autenticación y rol de admin
        const authError = await checkAuth(c);
        if (authError) return authError;
        
        const roleError = checkRole(c, "admin");
        if (roleError) return roleError;

        const data = await this.getValidatedData<typeof this.schema>();
        let imagePath = data.params.path;
        const bucketName = 'galilea-posts';

        console.log(`[DELETE IMAGE] Received path/URL: ${imagePath}`);

        const supabase = getSupabaseServiceClient(c.env);

        // Si viene una URL completa, extraer el path
        // Ejemplo: https://xwyameylqjbxglnsmfqu.supabase.co/storage/v1/object/public/galilea-posts/posts/1764057363083-dedo.jpg
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            try {
                const url = new URL(imagePath);
                // Extraer el path desde la URL: /storage/v1/object/public/galilea-posts/posts/...
                const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
                if (pathMatch && pathMatch[1]) {
                    imagePath = pathMatch[1];
                    console.log(`[DELETE IMAGE] Extracted path from URL: ${imagePath}`);
                } else {
                    return c.json(
                        {
                            success: false,
                            errors: [{ code: 400, message: "Invalid URL format. Could not extract path." }],
                        },
                        400
                    );
                }
            } catch (urlError) {
                return c.json(
                    {
                        success: false,
                        errors: [{ code: 400, message: "Invalid URL format" }],
                    },
                    400
                );
            }
        }

        // Validar que el path tenga el formato correcto (debe empezar con 'posts/')
        let normalizedPath = imagePath;
        if (!normalizedPath.startsWith('posts/')) {
            // Si viene solo el nombre del archivo, agregar el prefijo 'posts/'
            if (!normalizedPath.includes('/')) {
                normalizedPath = `posts/${normalizedPath}`;
            } else {
                return c.json(
                    {
                        success: false,
                        errors: [{ code: 400, message: "Invalid path format. Path must be in 'posts/' folder" }],
                    },
                    400
                );
            }
        }

        console.log(`[DELETE IMAGE] Normalized path: ${normalizedPath}`);

        console.log(`[DELETE IMAGE] Normalized path: ${normalizedPath}`);

        try {
            // Verificar si el archivo existe antes de intentar eliminarlo
            const { data: files, error: listError } = await supabase
                .storage
                .from(bucketName)
                .list('posts', {
                    search: normalizedPath.replace('posts/', '')
                });

            if (listError) {
                console.error("[DELETE IMAGE] Error checking file existence:", listError);
            }

            // Intentar eliminar el archivo
            const { data: deletedFiles, error } = await supabase
                .storage
                .from(bucketName)
                .remove([normalizedPath]);

            if (error) {
                console.error("[DELETE IMAGE] Delete error:", error);
                console.error("[DELETE IMAGE] Error details:", JSON.stringify(error, null, 2));
                
                // Si el error es que el archivo no existe, devolver 404
                if (error.message.includes('not found') || error.message.includes('does not exist')) {
                    return c.json(
                        {
                            success: false,
                            errors: [{ code: 404, message: "Image not found" }],
                        },
                        404
                    );
                }

                return c.json(
                    {
                        success: false,
                        errors: [{ code: 500, message: error.message }],
                    },
                    500
                );
            }

            console.log("[DELETE IMAGE] Delete successful. Deleted files:", deletedFiles);

            return c.json({
                success: true,
                result: {
                    path: normalizedPath,
                    message: "Image deleted successfully",
                },
            });
        } catch (error) {
            console.error("[DELETE IMAGE] Unexpected error:", error);
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

