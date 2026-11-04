import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../errors/AppError";
import { UserRepository } from "../user/user.repository";
import { isRole, Role, toPublicUser } from "../user/user.types";
import { AuthResult, TokenPayload } from "./auth.types";
import { LoginInput, RegisterInput } from "./auth.validation";

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    if (await this.users.findByEmail(input.email)) {
      throw AppError.conflict("El email ya está registrado");
    }
    const passwordHash = await bcrypt.hash(input.password, env.saltRounds);
    // El registro público siempre crea socios; los roles elevados los asigna un admin.
    const user = await this.users.create({ name: input.name, email: input.email, passwordHash, role: "client" });
    return { user: toPublicUser(user), token: this.sign(user.id, user.role) };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email);
    const valid = user && (await bcrypt.compare(input.password, user.passwordHash));
    if (!user || !valid) throw AppError.unauthorized("Credenciales inválidas");
    return { user: toPublicUser(user), token: this.sign(user.id, user.role) };
  }

  verify(token: string): TokenPayload {
    let payload: string | jwt.JwtPayload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw AppError.unauthorized("Token inválido o expirado");
    }
    if (typeof payload === "string" || !payload.sub || !isRole(payload.role)) {
      throw AppError.unauthorized("Token inválido o expirado");
    }
    return { sub: payload.sub, role: payload.role };
  }

  private sign(userId: string, role: Role) {
    return jwt.sign({ role }, env.jwtSecret, {
      subject: userId,
      expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    });
  }
}
