import { RequestHandler } from "express";
import { AppError } from "../errors/AppError";
import { Role } from "../modules/user/user.types";

/** Permite el paso solo a los roles indicados. Debe ir después de authenticate. */
export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) throw AppError.unauthorized();
    if (!roles.includes(req.auth.role)) throw AppError.forbidden();
    next();
  };
