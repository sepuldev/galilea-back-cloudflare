-- Script SQL para renombrar columnas de la tabla consultations
-- Ejecuta este script en el SQL Editor de Supabase

-- Renombrar columnas para que coincidan con el formato del frontend
ALTER TABLE consultations 
  RENAME COLUMN user_name TO first_name;

ALTER TABLE consultations 
  RENAME COLUMN user_lastname TO last_name;

ALTER TABLE consultations 
  RENAME COLUMN user_email TO email;

ALTER TABLE consultations 
  RENAME COLUMN user_dni TO dni_or_id;

ALTER TABLE consultations 
  RENAME COLUMN message TO consultation_reason;

ALTER TABLE consultations 
  RENAME COLUMN nacionality TO nationality;

-- Verificar que los cambios se aplicaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'consultations'
ORDER BY ordinal_position;

