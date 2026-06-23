import { Response } from "express";
import Book from "../models/Book";
import BorrowRecord from "../models/BorrowRecord";
import { AuthRequest } from "../middleware/auth";

// GET /api/dashboard/summary  (librarian only)
export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    const [totalBooksAgg, borrowedCount, overdueCount, topCategories, recentReturns] =
      await Promise.all([
        Book.aggregate([
          {
            $group: {
              _id: null,
              totalTitles: { $sum: 1 },
              totalCopies: { $sum: "$totalCopies" },
              availableCopies: { $sum: "$availableCopies" },
            },
          },
        ]),
        BorrowRecord.countDocuments({ status: { $ne: "returned" } }),
        BorrowRecord.countDocuments({ status: { $ne: "returned" }, dueDate: { $lt: now } }),
        Book.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        BorrowRecord.find({ status: "returned" })
          .sort({ returnedAt: -1 })
          .limit(5)
          .populate("book", "title")
          .populate("member", "name"),
      ]);

    const totals = totalBooksAgg[0] || { totalTitles: 0, totalCopies: 0, availableCopies: 0 };

    return res.status(200).json({
      totalTitles: totals.totalTitles,
      totalCopies: totals.totalCopies,
      availableCopies: totals.availableCopies,
      borrowedCopies: totals.totalCopies - totals.availableCopies,
      borrowedCount,
      overdueCount,
      topCategories: topCategories.map((c) => ({ category: c._id || "Uncategorized", count: c.count })),
      recentReturns: recentReturns.map((r) => ({
        id: r._id,
        bookTitle: (r.book as any)?.title || "Unknown",
        memberName: (r.member as any)?.name || "Unknown",
        returnedAt: r.returnedAt,
        fineAmount: r.fineAmount,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load dashboard summary", error: (err as Error).message });
  }
};
