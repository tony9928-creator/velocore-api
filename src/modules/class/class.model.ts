import { model, Schema, Types } from "mongoose";
import { GymClass } from "./class.types";

export type GymClassDoc = Omit<GymClass, "id" | "trainerId"> & { trainerId: Types.ObjectId };

const gymClassSchema = new Schema<GymClassDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    trainerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startsAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    capacity: { type: Number, required: true, min: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const GymClassModel = model<GymClassDoc>("GymClass", gymClassSchema);
