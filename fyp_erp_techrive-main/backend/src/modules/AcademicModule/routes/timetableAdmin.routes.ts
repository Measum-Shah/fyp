import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { TimetableAdminController } from "../controllers/timetableAdmin.controller";

const router = Router();
router.use(authMiddleware);
router.get("/lookups", TimetableAdminController.lookups);
router.get("/teachers-by-session/:active_session_id", TimetableAdminController.teachersBySession);
router.get("/courses-by-session/:active_session_id", TimetableAdminController.coursesBySession);
router.post("/slots", TimetableAdminController.createSlot);
router.post("/timetables", TimetableAdminController.createTimeTable);
router.get("/", TimetableAdminController.list);
router.post("/", TimetableAdminController.create);
router.put("/:id", TimetableAdminController.update);
router.delete("/:id", TimetableAdminController.remove);

export default router;
