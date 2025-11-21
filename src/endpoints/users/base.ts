import { z } from "zod";

export const user = z.object({
    dni: z.string().uuid(),
    email: z.string(),
    name: z.string(),
    phone: z.string(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
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