import { z } from "zod";
import { objectId } from "../../utils/validation";

export const createBookingSchema = z.object({ classId: objectId });

/** Filtros de GET /api/bookings?classId= */
export const bookingQuerySchema = z.object({ classId: objectId.optional() });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingQuery = z.infer<typeof bookingQuerySchema>;
