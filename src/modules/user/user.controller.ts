import { NextFunction, Request, Response } from "express";
import { UserService } from "./user.service";
import { UpdateRoleInput } from "./user.validation";

export class UserController {
  constructor(private readonly users: UserService) {}

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await this.users.getById(req.auth!.userId));
    } catch (error) {
      next(error);
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await this.users.list());
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role } = req.body as UpdateRoleInput;
      res.status(200).json(await this.users.updateRole(String(req.params.id), role));
    } catch (error) {
      next(error);
    }
  };
}
