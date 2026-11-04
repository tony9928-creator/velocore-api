import { HydratedDocument, Types } from "mongoose";
import { AppError } from "../../errors/AppError";
import { BookingDoc, BookingModel } from "./booking.model";
import { Booking, BookingFilters } from "./booking.types";

export interface BookingRepository {
  findById(id: string): Promise<Booking | undefined>;
  findByUser(userId: string): Promise<Booking[]>;
  findAll(filters?: BookingFilters): Promise<Booking[]>;
  /** Reservas confirmadas de una clase (para controlar el cupo). */
  countConfirmedByClass(classId: string): Promise<number>;
  /** Reservas confirmadas de varias clases en una sola consulta: Map<classId, cantidad>. */
  countConfirmedByClasses(classIds: string[]): Promise<Map<string, number>>;
  /** Lanza AppError 409 si el cliente ya tiene una reserva confirmada en la clase. */
  create(userId: string, classId: string): Promise<Booking>;
  cancel(id: string): Promise<Booking | undefined>;
  cancelAllByClass(classId: string): Promise<void>;
}

const toDomain = (doc: HydratedDocument<BookingDoc>): Booking => ({
  id: doc.id,
  userId: doc.userId.toString(),
  classId: doc.classId.toString(),
  status: doc.status,
  createdAt: doc.createdAt,
  cancelledAt: doc.cancelledAt ?? undefined,
});

export class MongoBookingRepository implements BookingRepository {
  async findById(id: string) {
    const doc = await BookingModel.findById(id);
    return doc ? toDomain(doc) : undefined;
  }

  async findByUser(userId: string) {
    return (await BookingModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 })).map(toDomain);
  }

  async findAll(filters: BookingFilters = {}) {
    const query = filters.classIds
      ? { classId: { $in: filters.classIds.map((id) => new Types.ObjectId(id)) } }
      : {};
    return (await BookingModel.find(query).sort({ createdAt: -1 })).map(toDomain);
  }

  countConfirmedByClass(classId: string) {
    return BookingModel.countDocuments({ classId: new Types.ObjectId(classId), status: "confirmed" });
  }

  async countConfirmedByClasses(classIds: string[]) {
    if (classIds.length === 0) return new Map<string, number>();
    const rows = await BookingModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { classId: { $in: classIds.map((id) => new Types.ObjectId(id)) }, status: "confirmed" } },
      { $group: { _id: "$classId", count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((row) => [row._id.toString(), row.count]));
  }

  async create(userId: string, classId: string) {
    try {
      return toDomain(await BookingModel.create({ userId, classId }));
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        throw AppError.conflict("Ya tienes una reserva confirmada en esta clase");
      }
      throw err;
    }
  }

  async cancel(id: string) {
    const doc = await BookingModel.findByIdAndUpdate(
      id,
      { status: "cancelled", cancelledAt: new Date() },
      { returnDocument: "after" },
    );
    return doc ? toDomain(doc) : undefined;
  }

  async cancelAllByClass(classId: string) {
    await BookingModel.updateMany(
      { classId: new Types.ObjectId(classId), status: "confirmed" },
      { status: "cancelled", cancelledAt: new Date() },
    );
  }
}
