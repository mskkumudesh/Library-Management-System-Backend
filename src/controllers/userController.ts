import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

// GET /api/users/members  (librarian only) - used to pick a member at checkout
export const getMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query as { search?: string };

    const filter: Record<string, unknown> = { role: "member" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const members = await User.find(filter).select("name email").sort({ name: 1 });
    return res.status(200).json(members);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch members", error: (err as Error).message });
  }
};
