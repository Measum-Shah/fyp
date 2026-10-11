import { Router } from "express";
import { LookupController } from "../controllers/lookup.controller";

const router = Router();

router.get("/result-lookups", LookupController.getResultLookups);

export default router;
