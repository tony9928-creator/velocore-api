import { AppError } from "../../errors/AppError";
import { Actor } from "../auth/auth.types";
import { BookingRepository } from "../booking/booking.repository";
import { UserRepository } from "../user/user.repository";
import { GymClassRepository } from "./class.repository";
import { GymClass, GymClassFilters, GymClassView } from "./class.types";
import { ClassQuery, CreateClassInput, UpdateClassInput } from "./class.validation";

const DAY_MS = 24 * 60 * 60 * 1000;

export class GymClassService {
  constructor(
    private readonly classes: GymClassRepository,
    private readonly users: UserRepository,
    private readonly bookings: BookingRepository,
  ) {}

  async list(query: ClassQuery): Promise<GymClassView[]> {
    const filters: GymClassFilters = { trainerId: query.instructor, name: query.name };
    if (query.date) {
      // Día completo en UTC: [AAAA-MM-DD 00:00, día siguiente 00:00)
      filters.startsFrom = new Date(`${query.date}T00:00:00.000Z`);
      filters.startsBefore = new Date(filters.startsFrom.getTime() + DAY_MS);
    }
    return this.withAvailability(await this.classes.findAll(filters));
  }

  async get(id: string): Promise<GymClassView> {
    const [view] = await this.withAvailability([await this.findOrFail(id)]);
    return view;
  }

  async create(actor: Actor, input: CreateClassInput): Promise<GymClassView> {
    this.assertBusinessRules(input);
    // Un entrenador solo crea clases propias; un admin puede asignar cualquier instructor.
    const { trainerId: requested, ...data } = input;
    const trainerId = actor.role === "admin" ? (requested ?? actor.userId) : actor.userId;
    const trainer = await this.users.findById(trainerId);
    if (!trainer || trainer.role === "client") {
      throw AppError.badRequest("El instructor debe ser un usuario con rol trainer o admin");
    }
    const created = await this.classes.create({ ...data, trainerId });
    return { ...created, availableSlots: created.capacity };
  }

  async update(actor: Actor, id: string, changes: UpdateClassInput): Promise<GymClassView> {
    this.assertBusinessRules(changes);
    const current = await this.findOrFail(id);
    if (actor.role !== "admin" && current.trainerId !== actor.userId) {
      throw AppError.forbidden("Solo el instructor de la clase o un admin puede modificarla");
    }
    if (changes.capacity !== undefined) {
      const confirmed = await this.bookings.countConfirmedByClass(id);
      if (changes.capacity < confirmed) {
        throw AppError.badRequest(`El cupo no puede ser menor que las reservas confirmadas (${confirmed})`);
      }
    }
    const updated = await this.classes.update(id, changes);
    if (!updated) throw AppError.notFound("Clase no encontrada");
    return this.get(updated.id);
  }

  /** Solo admin (lo restringe la ruta). Cancela las reservas activas antes de borrar la clase. */
  async remove(id: string): Promise<void> {
    await this.findOrFail(id);
    await this.bookings.cancelAllByClass(id);
    await this.classes.delete(id);
  }

  /**
   * Reglas de negocio de la clase, validadas en la capa de servicio:
   * el cupo debe ser un entero mayor a 0 y el horario debe ser una fecha futura.
   * (El esquema de Zod de la ruta ya las controla; esta capa no depende de ello.)
   */
  private assertBusinessRules({ capacity, startsAt }: { capacity?: number; startsAt?: Date }): void {
    if (capacity !== undefined && (!Number.isInteger(capacity) || capacity <= 0)) {
      throw AppError.badRequest("El cupo debe ser un número entero mayor a 0");
    }
    if (startsAt !== undefined && (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now())) {
      throw AppError.badRequest("El horario de la clase debe ser una fecha válida y futura");
    }
  }

  private async findOrFail(id: string): Promise<GymClass> {
    const gymClass = await this.classes.findById(id);
    if (!gymClass) throw AppError.notFound("Clase no encontrada");
    return gymClass;
  }

  private async withAvailability(classes: GymClass[]): Promise<GymClassView[]> {
    const confirmed = await this.bookings.countConfirmedByClasses(classes.map((c) => c.id));
    return classes.map((c) => ({
      ...c,
      availableSlots: Math.max(0, c.capacity - (confirmed.get(c.id) ?? 0)),
    }));
  }
}
