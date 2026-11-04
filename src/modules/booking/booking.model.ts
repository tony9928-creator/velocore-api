import { model, Schema, Types } from "mongoose";
import { Booking, BOOKING_STATUSES } from "./booking.types";

export type BookingDoc = Omit<Booking, "id" | "userId" | "classId"> & {
  userId: Types.ObjectId;
  classId: Types.ObjectId;
};

const bookingSchema = new Schema<BookingDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: "GymClass", required: true, index: true },
    status: { type: String, enum: [...BOOKING_STATUSES], default: "confirmed", required: true },
    cancelledAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Un cliente solo puede tener una reserva confirmada por clase (las canceladas no cuentan).
bookingSchema.index({ userId: 1, classId: 1 }, { unique: true, partialFilterExpression: { status: "confirmed" } });

export const BookingModel = model<BookingDoc>("Booking", bookingSchema);
