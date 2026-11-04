import { RequestHandler, Router } from "express";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../utils/validation";
import { BookingController } from "./booking.controller";
import { createBookingSchema } from "./booking.validation";

/** Montado en /api/bookings. Todas las rutas requieren token. */
export function createBookingRouter(bookings: BookingController, protect: RequestHandler) {
  const router = Router();
  router.use(protect);

  router.get("/me", bookings.listMine);
  router.get("/", authorize("admin", "trainer"), bookings.list);
  router.post("/", authorize("client"), validate({ body: createBookingSchema }), bookings.create);
  // La regla "dueño o admin" se valida en el servicio.
  router.delete("/:id", validate({ params: idParamSchema }), bookings.cancel);

  return router;
}
