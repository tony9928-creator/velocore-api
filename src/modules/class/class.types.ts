export interface GymClass {
  id: string;
  name: string;
  description: string;
  /** Instructor de la clase (User con rol trainer o admin). */
  trainerId: string;
  startsAt: Date;
  durationMinutes: number;
  capacity: number;
  createdAt: Date;
}

/** Clase tal como se devuelve al cliente: incluye los lugares libres. */
export interface GymClassView extends GymClass {
  availableSlots: number;
}

export type NewGymClass = Omit<GymClass, "id" | "createdAt">;
export type GymClassChanges = Partial<Omit<NewGymClass, "trainerId">>;

/** Filtros que entiende el repositorio. */
export interface GymClassFilters {
  trainerId?: string;
  startsFrom?: Date;
  startsBefore?: Date;
  name?: string;
}
