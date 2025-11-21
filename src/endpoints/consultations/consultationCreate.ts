import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext, ConsultationInsertData } from "../../types";
import { ConsultationModel } from "./base";
import { getSupabaseServiceClient } from "../../supabase";
import { z } from "zod";
import { createCRUDResponses } from "../../shared/responses";
import { findOrCreateUser } from "../../shared/userService";
import { checkRateLimit } from "../../shared/rateLimit";

// Schema para aceptar datos del formulario (frontend)
// Ahora coincide directamente con los nombres de las columnas de la BD
const consultationRequestSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().optional(),
  email: z.string().email("Email inválido"),
  phone_number: z.string().min(1, "El número de teléfono es requerido"),
  dni_or_id: z.string().optional(),
  nationality: z.string().optional(),
  consultation_reason: z.string().min(1, "El motivo de consulta es requerido"),
});

// Schema que acepta el wrapper "data" del frontend o directamente los datos
const consultationRequestBodySchema = z.union([
  z.object({ data: consultationRequestSchema }),
  consultationRequestSchema,
]);

export class ConsultationCreate extends OpenAPIRoute {
  public schema = {
    tags: ["Consultations"],
    summary: "Crear una nueva consulta",
    operationId: "create-consultation",
    request: {
      body: contentJson(consultationRequestBodySchema),
    },
    responses: createCRUDResponses(ConsultationModel.schema, {
      include201: true,
      custom201Description: "Consulta creada exitosamente",
    }),
  };

  public async handle(c: AppContext) {
    // Este es un endpoint público - NO requiere autenticación
    // La protección se hace mediante rate limiting para prevenir abuso
    
    // Rate limiting
    const rateLimitError = checkRateLimit(c);
    if (rateLimitError) return rateLimitError;

    console.log("[CREAR CONSULTA] Iniciando solicitud POST /consultations");
    const validatedData = await this.getValidatedData<typeof this.schema>();
    
    // Validar que body existe
    if (!validatedData.body) {
      return c.json(
        {
          success: false,
          errors: [{ code: 400, message: "Body es requerido" }],
        },
        400,
      );
    }
    
    console.log("[CREAR CONSULTA] Datos recibidos en el body:", JSON.stringify(validatedData.body, null, 2));
    
    // Extraer los datos del wrapper "data" si existe, o usar directamente
    // Type guard para verificar si tiene la propiedad "data"
    const formData = (validatedData.body && typeof validatedData.body === "object" && "data" in validatedData.body)
      ? (validatedData.body as { data: z.infer<typeof consultationRequestSchema> }).data
      : validatedData.body as z.infer<typeof consultationRequestSchema>;
    
    console.log("[CREAR CONSULTA] Datos extraídos del formulario:", JSON.stringify(formData, null, 2));
    
    // Los datos ya coinciden con los nombres de las columnas, solo necesitamos limpiar campos opcionales
    const consultationData: ConsultationInsertData = {
      first_name: formData.first_name,
      email: formData.email,
      phone_number: formData.phone_number,
      consultation_reason: formData.consultation_reason,
    };

    // Campos opcionales - solo agregar si tienen valor
    if (formData.last_name && formData.last_name.trim() !== '') {
      consultationData.last_name = formData.last_name;
    }
    
    if (formData.dni_or_id && formData.dni_or_id.trim() !== '') {
      consultationData.dni_or_id = formData.dni_or_id;
    }
    
    if (formData.nationality && formData.nationality.trim() !== '') {
      consultationData.nationality = formData.nationality;
    }

    console.log("[CREAR CONSULTA] Datos transformados para Supabase:", JSON.stringify(consultationData, null, 2));
    
    // Usar Service Role Key para operaciones de escritura (bypass RLS)
    const supabase = getSupabaseServiceClient(c.env);
    console.log("[CREAR CONSULTA] Cliente de Supabase inicializado (SERVICE_ROLE_KEY)");
    
    // ===== FLUJO: Buscar/Crear Usuario usando el servicio =====
    if (formData.dni_or_id && formData.dni_or_id.trim() !== '' && formData.email) {
      const { data: user, error: userError, created } = await findOrCreateUser(supabase, {
        dni: formData.dni_or_id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
      });

      if (userError) {
        console.error("[CREAR CONSULTA] ERROR en servicio de usuarios:", userError.message);
        const statusCode = created ? 400 : 500;
        return c.json(
          {
            success: false,
            errors: [{ 
              code: statusCode, 
              message: `Error ${created ? 'al crear' : 'al buscar'} usuario: ${userError.message}` 
            }],
          },
          statusCode,
        );
      }

      if (created) {
        console.log("[CREAR CONSULTA] Usuario creado exitosamente con DNI:", user?.dni);
      } else if (user) {
        console.log("[CREAR CONSULTA] Usuario ya existe con DNI:", user.dni);
      }
    } else {
      console.log("[CREAR CONSULTA] No se proporcionó DNI o email, omitiendo búsqueda/creación de usuario");
    }
    // ===== FIN FLUJO: Buscar/Crear Usuario =====
    
    console.log("[CREAR CONSULTA] Nombre de tabla:", ConsultationModel.tableName);
    console.log("[CREAR CONSULTA] Insertando datos en Supabase...");
    const { data: result, error } = await supabase
      .from(ConsultationModel.tableName)
      .insert([consultationData])
      .select()
      .single();

    if (error) {
      console.error("[CREAR CONSULTA] ERROR al insertar en Supabase:", error.message);
      console.error("[CREAR CONSULTA] Detalles del error:", JSON.stringify(error, null, 2));
      console.error("[CREAR CONSULTA] Código de error:", error.code);
      console.error("[CREAR CONSULTA] Datos que se intentaron insertar:", JSON.stringify(consultationData, null, 2));
      return c.json(
        {
          success: false,
          errors: [{ code: 400, message: error.message }],
        },
        400,
      );
    }

    console.log("[CREAR CONSULTA] Inserción exitosa");
    console.log("[CREAR CONSULTA] Resultado raw de Supabase:", JSON.stringify(result, null, 2));

    // Serializar el resultado
    const serialized = ConsultationModel.serializer(result);
    console.log("[CREAR CONSULTA] Resultado serializado:", JSON.stringify(serialized, null, 2));
    console.log("[CREAR CONSULTA] Consulta creada con ID:", serialized.id);

    return c.json(
      {
        success: true,
        result: serialized,
      },
      201,
    );
  }
}

