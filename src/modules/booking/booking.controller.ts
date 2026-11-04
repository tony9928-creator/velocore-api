import { NextFunction, Request, Response } from "express";
import { BookingService } from "./booking.service";
import { bookingQuerySchema, CreateBookingInput } from "./booking.validation";

export class BookingController {
  constructor(private readonly bookings: BookingService) {}

  listMine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await this.bookings.listMine(req.auth!.userId));
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = bookingQuerySchema.parse(req.query);
      res.status(200).json(await this.bookings.list(req.auth!, query));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classId } = req.body as CreateBookingInput;
      res.status(201).json(await this.bookings.reserve(req.auth!.userId, classId));
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await this.bookings.cancel(req.auth!, String(req.params.id)));
    } catch (error) {
      next(error);
    }
  };
}
