import { z } from "zod";

export const consultation = z.object({
  id: z.string().uuid(),
  dni_or_id: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  consultation_reason: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
});

export const ConsultationModel = {
  tableName: "consultations",
  primaryKeys: ["id"],
  schema: consultation,
  serializer: (obj: Record<string, string | number | boolean | null | undefined>) => {
    return {
      ...obj,
      // No hay conversiones especiales necesarias para consultations
    };
  },
  serializerObject: consultation,
};

