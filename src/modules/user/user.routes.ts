import { RequestHandler, Router } from "express";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../utils/validation";
import { UserController } from "./user.controller";
import { updateRoleSchema } from "./user.validation";

/** Montado en /api/users */
export function createUserRouter(users: UserController, protect: RequestHandler) {
  const router = Router();

  router.get("/me", protect, users.me);
  router.get("/", protect, authorize("admin"), users.list);
  router.patch(
    "/:id/role",
    protect,
    authorize("admin"),
    validate({ params: idParamSchema, body: updateRoleSchema }),
    users.updateRole,
  );

  return router;
}
