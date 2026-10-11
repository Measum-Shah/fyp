import { Router } from "express";
import { createProgram, getPrograms, getProgramById, updateProgram, deleteProgram } from "../controllers/program.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.post("/", createProgram);
router.get("/", getPrograms);
router.get("/:id", getProgramById);
router.put("/:id", updateProgram);
router.delete("/:id", deleteProgram);

export default router;