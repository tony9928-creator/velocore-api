import { AppError } from "../../errors/AppError";
import { Actor } from "../auth/auth.types";
import { GymClassRepository } from "../class/class.repository";
import { BookingRepository } from "./booking.repository";
import { Booking } from "./booking.types";
import { BookingQuery } from "./booking.validation";

export class BookingService {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly classes: GymClassRepository,
  ) {}

  listMine(userId: string): Promise<Booking[]> {
    return this.bookings.findByUser(userId);
  }

  /** Admin ve todas las reservas; un trainer solo las de sus propias clases. */
  async list(actor: Actor, query: BookingQuery): Promise<Booking[]> {
    if (query.classId) {
      const gymClass = await this.classes.findById(query.classId);
      if (!gymClass) throw AppError.notFound("Clase no encontrada");
      if (actor.role !== "admin" && gymClass.trainerId !== actor.userId) {
        throw AppError.forbidden("Solo el instructor de la clase o un admin puede ver sus reservas");
      }
      return this.bookings.findAll({ classIds: [gymClass.id] });
    }
    if (actor.role === "admin") return this.bookings.findAll();
    const ownClasses = await this.classes.findAll({ trainerId: actor.userId });
    return this.bookings.findAll({ classIds: ownClasses.map((c) => c.id) });
  }

  async reserve(userId: string, classId: string): Promise<Booking> {
    const gymClass = await this.classes.findById(classId);
    if (!gymClass) throw AppError.notFound("Clase no encontrada");
    if (gymClass.startsAt.getTime() <= Date.now()) {
      throw AppError.badRequest("No se puede reservar una clase que ya comenzó o terminó");
    }
    const confirmed = await this.bookings.countConfirmedByClass(classId);
    if (confirmed >= gymClass.capacity) throw AppError.conflict("La clase no tiene cupos disponibles");
    // El índice único del modelo impide reservas duplicadas aun con peticiones simultáneas.
    return this.bookings.create(userId, classId);
  }

  /** Solo el cliente dueño de la reserva o un admin pueden cancelarla. */
  async cancel(actor: Actor, bookingId: string): Promise<Booking> {
    const booking = await this.bookings.findById(bookingId);
    if (!booking) throw AppError.notFound("Reserva no encontrada");
    const isOwner = booking.userId === actor.userId;
    if (actor.role !== "admin" && !isOwner) {
      throw AppError.forbidden("Solo puedes cancelar tus propias reservas");
    }
    if (booking.status === "cancelled") throw AppError.conflict("La reserva ya está cancelada");
    const cancelled = await this.bookings.cancel(bookingId);
    if (!cancelled) throw AppError.notFound("Reserva no encontrada");
    return cancelled;
  }
}
