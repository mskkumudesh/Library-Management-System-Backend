import { Response } from "express";
import Book from "../models/Book";
import { AuthRequest } from "../middleware/auth";

// GET /api/books?search=&category=
export const getBooks = async (req: AuthRequest, res: Response) => {
  try {
    const { search, category } = req.query as { search?: string; category?: string };

    const filter: Record<string, unknown> = {};
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
      ];
    }

    const books = await Book.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(books);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch books", error: (err as Error).message });
  }
};

// GET /api/books/:id
export const getBookById = async (req: AuthRequest, res: Response) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    return res.status(200).json(book);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch book", error: (err as Error).message });
  }
};

// GET /api/books/isbn/:isbn  -> used by the barcode scanner in a later sprint
export const getBookByIsbn = async (req: AuthRequest, res: Response) => {
  try {
    const book = await Book.findOne({ isbn: req.params.isbn });
    if (!book) return res.status(404).json({ message: "No book found with this ISBN" });
    return res.status(200).json(book);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch book", error: (err as Error).message });
  }
};

// POST /api/books  (librarian only)
export const createBook = async (req: AuthRequest, res: Response) => {
  try {
    const { isbn, title, author, category, coverUrl, totalCopies } = req.body;

    if (!isbn || !title || !author || !category) {
      return res.status(400).json({ message: "isbn, title, author and category are required" });
    }

    const existing = await Book.findOne({ isbn });
    if (existing) {
      return res.status(409).json({ message: "A book with this ISBN already exists" });
    }

    const copies = Number(totalCopies) > 0 ? Number(totalCopies) : 1;

    const book = await Book.create({
      isbn,
      title,
      author,
      category,
      coverUrl,
      totalCopies: copies,
      availableCopies: copies,
      addedBy: req.user!._id,
    });

    return res.status(201).json(book);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create book", error: (err as Error).message });
  }
};

// PUT /api/books/:id  (librarian only)
export const updateBook = async (req: AuthRequest, res: Response) => {
  try {
    const { title, author, category, coverUrl, totalCopies } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (category !== undefined) book.category = category;
    if (coverUrl !== undefined) book.coverUrl = coverUrl;

    if (totalCopies !== undefined) {
      const newTotal = Number(totalCopies);
      const borrowedCount = book.totalCopies - book.availableCopies;
      if (newTotal < borrowedCount) {
        return res.status(400).json({
          message: `Cannot set total copies below ${borrowedCount} (currently borrowed)`,
        });
      }
      book.totalCopies = newTotal;
      book.availableCopies = newTotal - borrowedCount;
    }

    await book.save();
    return res.status(200).json(book);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update book", error: (err as Error).message });
  }
};

// DELETE /api/books/:id  (librarian only)
export const deleteBook = async (req: AuthRequest, res: Response) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.availableCopies < book.totalCopies) {
      return res.status(400).json({
        message: "Cannot delete a book that has copies currently borrowed",
      });
    }

    await book.deleteOne();
    return res.status(200).json({ message: "Book deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete book", error: (err as Error).message });
  }
};
