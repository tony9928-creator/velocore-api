import { NextFunction, Request, Response } from "express";
import { GymClassService } from "./class.service";
import { classQuerySchema, CreateClassInput, UpdateClassInput } from "./class.validation";

export class GymClassController {
  constructor(private readonly classes: GymClassService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Si la query es inválida, Zod lanza y el middleware de errores responde 400.
      const query = classQuerySchema.parse(req.query);
      res.status(200).json(await this.classes.list(query));
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await this.classes.get(String(req.params.id)));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await this.classes.create(req.auth!, req.body as CreateClassInput));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const changes = req.body as UpdateClassInput;
      res.status(200).json(await this.classes.update(req.auth!, String(req.params.id), changes));
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.classes.remove(String(req.params.id));
      res.status(200).json({ success: true, message: "Clase eliminada correctamente" });
    } catch (error) {
      next(error);
    }
  };
}
