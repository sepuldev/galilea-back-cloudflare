import { SupabaseClient } from "@supabase/supabase-js";
import { UserModel } from "../endpoints/users/base";

/**
 * Interfaz para los datos necesarios para crear un usuario desde una consulta
 */
export interface CreateUserFromConsultationData {
  dni: string;
  email: string;
  first_name: string;
  last_name?: string;
  phone_number: string;
}

/**
 * Busca un usuario por DNI y email
 * @param supabase Cliente de Supabase
 * @param dni DNI del usuario
 * @param email Email del usuario
 * @returns Usuario encontrado o null si no existe
 */
export async function findUserByDniAndEmail(
  supabase: SupabaseClient,
  dni: string,
  email: string
): Promise<{ data: any[] | null; error: any }> {
  console.log("[USER SERVICE] Buscando usuario con DNI:", dni, "y email:", email);
  
  const { data, error } = await supabase
    .from(UserModel.tableName)
    .select("*")
    .eq("dni", dni)
    .eq("email", email);

  if (error) {
    console.error("[USER SERVICE] ERROR al buscar usuario:", error.message);
    return { data: null, error };
  }

  console.log("[USER SERVICE] Usuarios encontrados:", data?.length || 0);
  return { data, error: null };
}

/**
 * Crea un nuevo usuario a partir de los datos de una consulta
 * @param supabase Cliente de Supabase
 * @param userData Datos del usuario a crear
 * @returns Usuario creado o error
 */
export async function createUserFromConsultation(
  supabase: SupabaseClient,
  userData: CreateUserFromConsultationData
): Promise<{ data: any | null; error: any }> {
  console.log("[USER SERVICE] Creando nuevo usuario desde datos de consulta...");
  
  // Combinar first_name y last_name para el campo name del usuario
  const userName = userData.last_name 
    ? `${userData.first_name} ${userData.last_name}`.trim()
    : userData.first_name;
  
  const userInsertData = {
    dni: userData.dni,
    email: userData.email,
    name: userName,
    phone: userData.phone_number,
  };
  
  console.log("[USER SERVICE] Datos del nuevo usuario:", JSON.stringify(userInsertData, null, 2));
  
  const { data, error } = await supabase
    .from(UserModel.tableName)
    .insert([userInsertData])
    .select()
    .single();

  if (error) {
    console.error("[USER SERVICE] ERROR al crear usuario:", error.message);
    return { data: null, error };
  }

  console.log("[USER SERVICE] Usuario creado exitosamente con DNI:", data.dni);
  return { data, error: null };
}

/**
 * Busca un usuario por DNI y email, y si no existe, lo crea
 * Esta es la función principal que se usa en el flujo de creación de consultas
 * @param supabase Cliente de Supabase
 * @param userData Datos del usuario (dni, email, first_name, last_name?, phone_number)
 * @returns Usuario encontrado o creado, o error
 */
export async function findOrCreateUser(
  supabase: SupabaseClient,
  userData: CreateUserFromConsultationData
): Promise<{ data: any | null; error: any; created: boolean }> {
  // Validar que tenemos los datos necesarios
  if (!userData.dni || !userData.email) {
    console.log("[USER SERVICE] DNI o email no proporcionado, omitiendo búsqueda/creación de usuario");
    return { data: null, error: null, created: false };
  }

  // Buscar usuario existente
  const { data: existingUsers, error: searchError } = await findUserByDniAndEmail(
    supabase,
    userData.dni,
    userData.email
  );

  if (searchError) {
    return { data: null, error: searchError, created: false };
  }

  // Si el usuario existe, retornarlo
  if (existingUsers && existingUsers.length > 0) {
    console.log("[USER SERVICE] Usuario ya existe con DNI:", existingUsers[0].dni);
    return { data: existingUsers[0], error: null, created: false };
  }

  // Si no existe, crearlo
  console.log("[USER SERVICE] Usuario no encontrado. Creando nuevo usuario...");
  const { data: newUser, error: createError } = await createUserFromConsultation(
    supabase,
    userData
  );

  if (createError) {
    return { data: null, error: createError, created: false };
  }

  return { data: newUser, error: null, created: true };
}

