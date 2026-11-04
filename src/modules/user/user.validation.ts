import { z } from "zod";
import { ROLES } from "./user.types";

export const updateRoleSchema = z.object({
  role: z.enum(ROLES, "El rol debe ser admin, trainer o client"),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
