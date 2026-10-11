import { Router } from "express";
import * as fineController from "../controllers/fine.controller";

const router = Router();

// Category Routes
router.get("/categories", fineController.getAllCategoriesAdmin);
router.get("/categories/active", fineController.getCategories);
router.post("/categories", fineController.createCategory);
router.put("/categories/:id", fineController.updateCategory);

// Fine Routes
router.get("/", fineController.getFines);
router.post("/", fineController.createFine);
router.get("/:id", fineController.getFineById);
router.put("/:id/status", fineController.updateFineStatus);
router.post("/:id/payment", fineController.recordPayment);

export default router;
