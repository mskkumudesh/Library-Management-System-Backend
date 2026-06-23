import { Router } from "express";
import { getMembers } from "../controllers/userController";
import { protect, requireRole } from "../middleware/auth";

const router = Router();

router.use(protect);
router.get("/members", requireRole("librarian"), getMembers);

export default router;
