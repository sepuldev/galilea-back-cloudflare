-- Migration para Supabase
-- Ejecuta este script en el SQL Editor de Supabase para crear la tabla tasks

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índice para mejorar las búsquedas
CREATE INDEX IF NOT EXISTS idx_tasks_name ON tasks(name);
CREATE INDEX IF NOT EXISTS idx_tasks_slug ON tasks(slug);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS) - opcional, ajusta según tus necesidades
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (ajusta según tus necesidades de seguridad)
-- Para producción, deberías crear políticas más restrictivas
CREATE POLICY "Allow all operations on tasks" ON tasks
    FOR ALL
    USING (true)
    WITH CHECK (true);

