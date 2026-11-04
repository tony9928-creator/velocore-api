import { HydratedDocument } from "mongoose";
import { AppError } from "../../errors/AppError";
import { UserDoc, UserModel } from "./user.model";
import { NewUser, Role, User } from "./user.types";

export interface UserRepository {
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  findAll(): Promise<User[]>;
  create(data: NewUser): Promise<User>;
  updateRole(id: string, role: Role): Promise<User | undefined>;
}

const toDomain = (doc: HydratedDocument<UserDoc>): User => ({
  id: doc.id,
  name: doc.name,
  email: doc.email,
  passwordHash: doc.passwordHash,
  role: doc.role,
  createdAt: doc.createdAt,
});

export class MongoUserRepository implements UserRepository {
  async findById(id: string) {
    const doc = await UserModel.findById(id);
    return doc ? toDomain(doc) : undefined;
  }

  async findByEmail(email: string) {
    const doc = await UserModel.findOne({ email: email.toLowerCase() });
    return doc ? toDomain(doc) : undefined;
  }

  async findAll() {
    return (await UserModel.find().sort({ createdAt: 1 })).map(toDomain);
  }

  async create(data: NewUser) {
    try {
      return toDomain(await UserModel.create(data));
    } catch (err) {
      // Dos registros simultáneos con el mismo email: lo resuelve el índice único.
      if ((err as { code?: number }).code === 11000) {
        throw AppError.conflict("El email ya está registrado");
      }
      throw err;
    }
  }

  async updateRole(id: string, role: Role) {
    const doc = await UserModel.findByIdAndUpdate(id, { role }, { returnDocument: "after", runValidators: true });
    return doc ? toDomain(doc) : undefined;
  }
}
