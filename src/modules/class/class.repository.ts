import { HydratedDocument, Types } from "mongoose";
import { escapeRegex } from "../../utils/validation";
import { GymClassDoc, GymClassModel } from "./class.model";
import { GymClass, GymClassChanges, GymClassFilters, NewGymClass } from "./class.types";

export interface GymClassRepository {
  findById(id: string): Promise<GymClass | undefined>;
  findAll(filters?: GymClassFilters): Promise<GymClass[]>;
  create(data: NewGymClass): Promise<GymClass>;
  update(id: string, changes: GymClassChanges): Promise<GymClass | undefined>;
  delete(id: string): Promise<boolean>;
}

const toDomain = (doc: HydratedDocument<GymClassDoc>): GymClass => ({
  id: doc.id,
  name: doc.name,
  description: doc.description,
  trainerId: doc.trainerId.toString(),
  startsAt: doc.startsAt,
  durationMinutes: doc.durationMinutes,
  capacity: doc.capacity,
  createdAt: doc.createdAt,
});

export class MongoGymClassRepository implements GymClassRepository {
  async findById(id: string) {
    const doc = await GymClassModel.findById(id);
    return doc ? toDomain(doc) : undefined;
  }

  async findAll(filters: GymClassFilters = {}) {
    const startsAt: { $gte?: Date; $lt?: Date } = {};
    if (filters.startsFrom) startsAt.$gte = filters.startsFrom;
    if (filters.startsBefore) startsAt.$lt = filters.startsBefore;

    const docs = await GymClassModel.find({
      ...(filters.trainerId ? { trainerId: new Types.ObjectId(filters.trainerId) } : {}),
      ...(Object.keys(startsAt).length ? { startsAt } : {}),
      ...(filters.name ? { name: { $regex: escapeRegex(filters.name), $options: "i" } } : {}),
    }).sort({ startsAt: 1 });
    return docs.map(toDomain);
  }

  async create(data: NewGymClass) {
    return toDomain(await GymClassModel.create(data));
  }

  async update(id: string, changes: GymClassChanges) {
    const doc = await GymClassModel.findByIdAndUpdate(id, changes, { returnDocument: "after", runValidators: true });
    return doc ? toDomain(doc) : undefined;
  }

  async delete(id: string) {
    return (await GymClassModel.findByIdAndDelete(id)) !== null;
  }
}
