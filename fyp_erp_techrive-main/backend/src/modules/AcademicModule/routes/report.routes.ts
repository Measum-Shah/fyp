import { Router } from "express";
import { 
  getCourseCatalogReport,
  getDepartmentWiseCourseList,
  getProgramWiseCourseList,
  getSemesterWiseCourseList,
  getCreditHourReport,
  getPrerequisiteReport,
  getCorequisiteReport
} from "../controllers/report.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/course-catalog", getCourseCatalogReport);
router.get("/department-courses", getDepartmentWiseCourseList);
router.get("/program-courses", getProgramWiseCourseList);
router.get("/semester-courses", getSemesterWiseCourseList);
router.get("/credit-hours", getCreditHourReport);
router.get("/prerequisites", getPrerequisiteReport);
router.get("/corequisites", getCorequisiteReport);

export default router;