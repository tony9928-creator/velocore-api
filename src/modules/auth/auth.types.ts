import { PublicUser, Role } from "../user/user.types";

/** Usuario que realiza la petición (sale del JWT). */
export interface Actor {
  userId: string;
  role: Role;
}

/** Contenido del JWT: solo el id (sub) y el rol, sin datos sensibles. */
export interface TokenPayload {
  sub: string;
  role: Role;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}
