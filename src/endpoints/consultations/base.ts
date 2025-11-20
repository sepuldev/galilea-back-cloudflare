import { z } from "zod";

export const consultation = z.object({
  id: z.string().uuid(),
  user_dni: z.string(),
  user_email: z.string().email(),
  message: z.string(),
  status: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  user_name: z.string(),
  user_lastname: z.string().optional(),
  phone_number: z.string(),
  nacionality: z.string().optional(),
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

