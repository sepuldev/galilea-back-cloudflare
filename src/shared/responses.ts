import { contentJson } from "chanfana";
import { z } from "zod";

// Schema común para errores
const errorSchema = z.array(
  z.object({
    code: z.number(),
    message: z.string(),
  }),
);

// Schema común para respuesta de éxito con resultado genérico
export const createSuccessResponse = <T extends z.ZodTypeAny>(resultSchema: T) => ({
  description: "Operación exitosa",
  ...contentJson({
    success: Boolean,
    result: resultSchema,
  }),
});

// Schema común para respuesta de éxito sin resultado (solo success)
export const createSuccessOnlyResponse = (description: string = "Operación exitosa") => ({
  description,
  ...contentJson({
    success: Boolean,
  }),
});

// Respuestas comunes reutilizables
export const commonResponses = {
  "400": {
    description: "Bad request - Datos inválidos o mal formateados",
    ...contentJson({
      success: Boolean,
      errors: errorSchema,
    }),
  },
  "401": {
    description: "Unauthorized - Autenticación requerida",
    ...contentJson({
      success: Boolean,
      errors: errorSchema,
    }),
  },
  "403": {
    description: "Forbidden - Permisos insuficientes",
    ...contentJson({
      success: Boolean,
      errors: errorSchema,
    }),
  },
  "404": {
    description: "Not Found - Recurso no encontrado",
    ...contentJson({
      success: Boolean,
      errors: errorSchema,
    }),
  },
  "422": {
    description: "Unprocessable Entity - Error de validación",
    ...contentJson({
      success: Boolean,
      errors: errorSchema,
    }),
  },
  "500": {
    description: "Internal Server Error - Error interno del servidor",
    ...contentJson({
      success: Boolean,
      errors: errorSchema,
    }),
  },
};

// Helper para crear respuestas completas para operaciones CRUD
export const createCRUDResponses = <T extends z.ZodTypeAny>(resultSchema: T, options?: {
  include201?: boolean;
  include200?: boolean;
  custom201Description?: string;
  custom200Description?: string;
  custom404Description?: string;
  excludeCommonResponses?: string[]; // Array de códigos HTTP a excluir de las respuestas comunes
}) => {
  const responses: Record<string, any> = {};

  if (options?.include201) {
    responses["201"] = {
      description: options.custom201Description || "Recurso creado exitosamente",
      ...contentJson({
        success: Boolean,
        result: resultSchema,
      }),
    };
  }

  if (options?.include200) {
    responses["200"] = {
      description: options.custom200Description || "Operación exitosa",
      ...contentJson({
        success: Boolean,
        result: resultSchema,
      }),
    };
  }

  // Agregar todas las respuestas comunes (excepto las excluidas)
  const excludeList = options?.excludeCommonResponses || [];
  Object.entries(commonResponses).forEach(([code, response]) => {
    if (!excludeList.includes(code)) {
      responses[code] = response;
    }
  });

  // Personalizar 404 si se especifica
  if (options?.custom404Description) {
    responses["404"] = {
      description: options.custom404Description,
      ...contentJson({
        success: Boolean,
        errors: errorSchema,
      }),
    };
  }

  return responses;
};

