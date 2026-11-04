import { RequestHandler, Router } from "express";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../utils/validation";
import { GymClassController } from "./class.controller";
import { createClassSchema, replaceClassSchema, updateClassSchema } from "./class.validation";

/** Montado en /api/classes */
export function createClassRouter(classes: GymClassController, protect: RequestHandler) {
  const router = Router();
  const idParam = validate({ params: idParamSchema });

  // Públicas: cualquiera puede consultar clases y disponibilidad sin registrarse.
  router.get("/", classes.list);
  router.get("/:id", idParam, classes.get);

  router.post("/", protect, authorize("admin", "trainer"), validate({ body: createClassSchema }), classes.create);
  // PUT reemplaza todos los campos; PATCH permite cambios parciales. Un trainer solo edita sus clases.
  router.put(
    "/:id",
    protect,
    authorize("admin", "trainer"),
    validate({ params: idParamSchema, body: replaceClassSchema }),
    classes.update,
  );
  router.patch(
    "/:id",
    protect,
    authorize("admin", "trainer"),
    validate({ params: idParamSchema, body: updateClassSchema }),
    classes.update,
  );
  router.delete("/:id", protect, authorize("admin"), idParam, classes.remove);

  return router;
}
