import { Router } from "express";
import {
  checkoutBook,
  returnBook,
  getActiveLoans,
  getOverdueLoans,
  getMemberHistory,
} from "../controllers/borrowController";
import { protect, requireRole } from "../middleware/auth";

const router = Router();

router.use(protect);

router.post("/", requireRole("librarian"), checkoutBook);
router.post("/:id/return", requireRole("librarian"), returnBook);
router.get("/active", requireRole("librarian"), getActiveLoans);
router.get("/overdue", requireRole("librarian"), getOverdueLoans);
router.get("/member/:memberId", getMemberHistory); 
router.post("/checkout",requireRole("librarian"))

export default router;
