import express from "express";
import { authenticate } from "./middlewares/auth.middleware";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/logger.middleware";
import { AuthController } from "./modules/auth/auth.controller";
import { createAuthRouter } from "./modules/auth/auth.routes";
import { AuthService } from "./modules/auth/auth.service";
import { BookingController } from "./modules/booking/booking.controller";
import { MongoBookingRepository } from "./modules/booking/booking.repository";
import { createBookingRouter } from "./modules/booking/booking.routes";
import { BookingService } from "./modules/booking/booking.service";
import { GymClassController } from "./modules/class/class.controller";
import { MongoGymClassRepository } from "./modules/class/class.repository";
import { createClassRouter } from "./modules/class/class.routes";
import { GymClassService } from "./modules/class/class.service";
import { UserController } from "./modules/user/user.controller";
import { MongoUserRepository } from "./modules/user/user.repository";
import { createUserRouter } from "./modules/user/user.routes";
import { UserService } from "./modules/user/user.service";

export function createApp() {
  // Composición de dependencias: repositorios -> servicios -> controladores -> rutas
  const userRepo = new MongoUserRepository();
  const classRepo = new MongoGymClassRepository();
  const bookingRepo = new MongoBookingRepository();

  const authService = new AuthService(userRepo);
  const protect = authenticate(authService);

  const app = express();
  app.use(requestLogger);
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  app.use("/api/auth", createAuthRouter(new AuthController(authService)));
  app.use("/api/users", createUserRouter(new UserController(new UserService(userRepo)), protect));
  app.use(
    "/api/classes",
    createClassRouter(new GymClassController(new GymClassService(classRepo, userRepo, bookingRepo)), protect),
  );
  app.use(
    "/api/bookings",
    createBookingRouter(new BookingController(new BookingService(bookingRepo, classRepo)), protect),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
