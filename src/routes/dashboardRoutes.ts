import { Router } from "express";
import { getSummary } from "../controllers/dashboardController";
import { protect, requireRole } from "../middleware/auth";

const router = Router();

router.use(protect);
router.get("/summary", requireRole("librarian"), getSummary);

export default router;
