export const ROLES = ["admin", "trainer", "client"] as const;
export type Role = (typeof ROLES)[number];

export const isRole = (value: unknown): value is Role => ROLES.includes(value as Role);

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

/** Usuario sin datos sensibles, seguro para devolver en respuestas. */
export type PublicUser = Omit<User, "passwordHash">;

export type NewUser = Omit<User, "id" | "createdAt">;

export function toPublicUser({ passwordHash: _omit, ...rest }: User): PublicUser {
  return rest;
}
