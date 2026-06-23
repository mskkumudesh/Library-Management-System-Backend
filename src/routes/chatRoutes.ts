import { Router } from "express";
import { chatWithBot } from "../controllers/chatController";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);
router.post("/", chatWithBot);

export default router;
