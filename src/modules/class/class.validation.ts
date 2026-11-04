import { z } from "zod";
import { objectId } from "../../utils/validation";

export const createClassSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  description: z.string().trim().max(500, "Máximo 500 caracteres").default(""),
  startsAt: z.coerce
    .date("Debe ser una fecha válida (ISO 8601)")
    .refine((d) => d.getTime() > Date.now(), "Debe ser una fecha futura"),
  durationMinutes: z.number("Debe ser un número").int().min(5, "Mínimo 5 minutos").max(480, "Máximo 480 minutos"),
  capacity: z.number("Debe ser un número").int().min(1, "El cupo debe ser mayor a 0").max(500, "Máximo 500"),
  /** Solo lo respeta un admin; un entrenador siempre crea clases a su nombre. */
  trainerId: objectId.optional(),
});

/** PUT: reemplazo completo, todos los campos obligatorios salvo description. */
export const replaceClassSchema = createClassSchema.omit({ trainerId: true });

/** PATCH: cambios parciales, al menos un campo. */
export const updateClassSchema = replaceClassSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Debes enviar al menos un campo");

/** Filtros de GET /api/classes?instructor=&date=&name= */
export const classQuerySchema = z.object({
  instructor: objectId.optional(),
  date: z.iso.date("Formato de fecha esperado: AAAA-MM-DD").optional(),
  name: z.string().trim().min(1).max(100).optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type ClassQuery = z.infer<typeof classQuerySchema>;
