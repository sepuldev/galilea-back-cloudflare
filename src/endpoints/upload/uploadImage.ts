import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { getSupabaseServiceClient } from "../../supabase";
import { z } from "zod";

export class UploadImage extends OpenAPIRoute {
    public schema = {
        tags: ["Upload"],
        summary: "Upload an image",
        operationId: "upload-image",
        request: {
            body: {
                content: {
                    "multipart/form-data": {
                        schema: z.object({
                            file: z.instanceof(File),
                        }),
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Image uploaded successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            result: z.object({
                                url: z.string(),
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
        const formData = await c.req.parseBody();
        const file = formData['file'];

        if (!(file instanceof File)) {
            return c.json({ success: false, errors: [{ code: 400, message: "No file uploaded" }] }, 400);
        }

        const supabase = getSupabaseServiceClient(c.env);
        // Sanitize filename
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${sanitizedName}`;

        // Upload to 'galilea-posts' bucket in 'posts' folder
        // El bucket se llama 'galilea-posts' y las imágenes van en la carpeta 'posts'
        const uploadPath = `posts/${fileName}`;
        const { data, error } = await supabase
            .storage
            .from('galilea-posts')
            .upload(uploadPath, file, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error("Upload error:", error);
            return c.json({ success: false, errors: [{ code: 500, message: error.message }] }, 500);
        }

        // Usar la ruta devuelta por Supabase (data.path) o la ruta que usamos para subir
        const filePath = data?.path || uploadPath;

        // Get public URL usando la ruta correcta
        const { data: { publicUrl } } = supabase
            .storage
            .from('galilea-posts')
            .getPublicUrl(filePath);

        return c.json({
            success: true,
            result: {
                url: publicUrl
            }
        });
    }
}
