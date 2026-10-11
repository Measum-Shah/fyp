import { Router } from "express";
import { AlumniController } from "../controllers/alumni.controller";
// import { authMiddleware } from "../../../middlewares/auth"; // Assuming an auth middleware exists

const router = Router();

// router.use(authMiddleware);

router.get("/list", AlumniController.getAlumniList);
router.get("/eligible", AlumniController.getEligibleStudents);
router.post("/graduate", AlumniController.graduateStudents);

export default router;
