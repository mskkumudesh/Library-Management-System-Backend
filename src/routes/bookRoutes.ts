import { Router } from "express";
import {
  getBooks,
  getBookById,
  getBookByIsbn,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController";
import { protect, requireRole } from "../middleware/auth";

const router = Router();

// All routes require a logged-in user
router.use(protect);

router.get("/", getBooks);
router.get("/isbn/:isbn", getBookByIsbn);
router.get("/:id", getBookById);

// Librarian-only write operations
router.post("/", requireRole("librarian"), createBook);
router.put("/:id", requireRole("librarian"), updateBook);
router.delete("/:id", requireRole("librarian"), deleteBook);

export default router;
