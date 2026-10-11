import { Router } from "express";
import { RoomsController } from "../controllers/rooms.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/lookups", RoomsController.lookups);
router.get("/", RoomsController.list);
router.post("/", RoomsController.create);
router.put("/:id", RoomsController.update);
router.delete("/:id", RoomsController.remove);

export default router;
