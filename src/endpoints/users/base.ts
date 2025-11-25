import { z } from "zod";

export const user = z.object({
    dni: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    created_at: z.string().datetime().nullable().optional(),
    updated_at: z.string().datetime().nullable().optional(),
})

export const UserModel= {
    tableName:'users',
    primaryKeys:["dni","email"],
    schema:user,
    serialize:(obj: Record<string,string | number | boolean | null | undefined>)=>{
        return {
            ...obj
        };
    },
    serializerObject:user,
}