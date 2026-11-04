export const BOOKING_STATUSES = ["confirmed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Reserva de un cliente (userId) sobre una clase (classId). */
export interface Booking {
  id: string;
  userId: string;
  classId: string;
  status: BookingStatus;
  createdAt: Date;
  cancelledAt?: Date;
}

/** Filtros que entiende el repositorio. Sin classIds devuelve todas. */
export interface BookingFilters {
  classIds?: string[];
}
