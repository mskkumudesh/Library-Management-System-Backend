import mongoose, { Schema, Document } from "mongoose";

export interface IBook extends Document {
  isbn: string;
  title: string;
  author: string;
  category: string;
  coverUrl?: string;
  totalCopies: number;
  availableCopies: number;
  addedBy: mongoose.Types.ObjectId;
}

const bookSchema = new Schema<IBook>(
  {
    isbn: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    coverUrl: { type: String },
    totalCopies: { type: Number, required: true, min: 1, default: 1 },
    availableCopies: { type: Number, required: true, min: 0, default: 1 },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBook>("Book", bookSchema);
