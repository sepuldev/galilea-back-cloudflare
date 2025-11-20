import { z } from "zod";

export const consultation = z.object({
  id: z.string().uuid(),
  dni_or_id: z.string().optional(),
  email: z.string().email(),
  consultation_reason: z.string(),
  status: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  first_name: z.string(),
  last_name: z.string().optional(),
  phone_number: z.string(),
  nationality: z.string().optional(),
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

