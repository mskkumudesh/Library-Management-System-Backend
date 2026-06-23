import { Response } from "express";
import mongoose from "mongoose";
import Book from "../models/Book";
import BorrowRecord from "../models/BorrowRecord";
import { AuthRequest } from "../middleware/auth";
import { sendEmail } from "../utils/mailer";
import { checkoutConfirmationEmail, returnConfirmationEmail } from "../utils/emailTemplates";

const LOAN_PERIOD_DAYS = 14;
const FINE_PER_DAY = 0.5; // currency units per day overdue

// POST /api/borrow  { isbn, memberId }  (librarian only)
export const checkoutBook = async (req: AuthRequest, res: Response) => {
  try {
    const { isbn, memberId } = req.body;

    if (!isbn || !memberId) {
      return res.status(400).json({ message: "isbn and memberId are required" });
    }

    const book = await Book.findOne({ isbn });
    if (!book) {
      return res.status(404).json({ message: "No book found with this ISBN" });
    }

    if (book.availableCopies < 1) {
      return res.status(400).json({ message: "No copies of this book are currently available" });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

    const record = await BorrowRecord.create({
      book: book._id,
      member: memberId,
      dueDate,
      status: "borrowed",
    });

    book.availableCopies -= 1;
    await book.save();

    const populated = await record.populate([
      { path: "book", select: "title author isbn" },
      { path: "member", select: "name email" },
    ]);

    const memberDoc = populated.member as any;
    const bookDoc = populated.book as any;
    const { subject, html } = checkoutConfirmationEmail({
      memberName: memberDoc.name,
      bookTitle: bookDoc.title,
      bookAuthor: bookDoc.author,
      dueDate: populated.dueDate,
    });
    void sendEmail(memberDoc.email, subject, html);

    return res.status(201).json(populated);
  } catch (err) {
    return res.status(500).json({ message: "Checkout failed", error: (err as Error).message });
  }
};

// POST /api/borrow/:id/return  (librarian only)
export const returnBook = async (req: AuthRequest, res: Response) => {
  try {
    const record = await BorrowRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Borrow record not found" });

    if (record.status === "returned") {
      return res.status(400).json({ message: "This book has already been returned" });
    }

    const now = new Date();
    record.returnedAt = now;
    record.status = "returned";

    if (now > record.dueDate) {
      const daysLate = Math.ceil((now.getTime() - record.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      record.fineAmount = Math.round(daysLate * FINE_PER_DAY * 100) / 100;
    }

    await record.save();

    const book = await Book.findById(record.book);
    if (book) {
      book.availableCopies = Math.min(book.availableCopies + 1, book.totalCopies);
      await book.save();
    }

    const populated = await record.populate([
      { path: "book", select: "title author isbn" },
      { path: "member", select: "name email" },
    ]);

    const memberDoc = populated.member as any;
    const bookDoc = populated.book as any;
    const { subject, html } = returnConfirmationEmail({
      memberName: memberDoc.name,
      bookTitle: bookDoc.title,
      bookAuthor: bookDoc.author,
      returnedAt: populated.returnedAt as Date,
      fineAmount: populated.fineAmount,
    });
    void sendEmail(memberDoc.email, subject, html);

    return res.status(200).json(populated);
  } catch (err) {
    return res.status(500).json({ message: "Return failed", error: (err as Error).message });
  }
};

// GET /api/borrow/active  (librarian only) - all currently borrowed books, overdue flagged live
export const getActiveLoans = async (req: AuthRequest, res: Response) => {
  try {
    const records = await BorrowRecord.find({ status: { $ne: "returned" } })
      .populate("book", "title author isbn")
      .populate("member", "name email")
      .sort({ dueDate: 1 });

    return res.status(200).json(records);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch active loans", error: (err as Error).message });
  }
};

// GET /api/borrow/overdue  (librarian only)
export const getOverdueLoans = async (req: AuthRequest, res: Response) => {
  try {
    const records = await BorrowRecord.find({
      status: { $ne: "returned" },
      dueDate: { $lt: new Date() },
    })
      .populate("book", "title author isbn")
      .populate("member", "name email")
      .sort({ dueDate: 1 });

    return res.status(200).json(records);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch overdue loans", error: (err as Error).message });
  }
};

// GET /api/borrow/member/:memberId  
export const getMemberHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;

    const isSelf = req.user!.id === memberId;
    if (!isSelf && req.user!.role !== "librarian") {
      return res.status(403).json({ message: "You can only view your own borrowing history" });
    }

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    const records = await BorrowRecord.find({ member: memberId })
      .populate("book", "title author isbn")
      .sort({ borrowedAt: -1 });

    return res.status(200).json(records);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch history", error: (err as Error).message });
  }
};
