import mongoose, { Schema, Document } from "mongoose";

export type BorrowStatus = "borrowed" | "returned" | "overdue";

export interface IBorrowRecord extends Document {
  book: mongoose.Types.ObjectId;
  member: mongoose.Types.ObjectId;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt?: Date;
  status: BorrowStatus;
  fineAmount: number;
}

const borrowSchema = new Schema<IBorrowRecord>(
  {
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    member: { type: Schema.Types.ObjectId, ref: "User", required: true },
    borrowedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date },
    status: { type: String, enum: ["borrowed", "returned", "overdue"], default: "borrowed" },
    fineAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IBorrowRecord>("BorrowRecord", borrowSchema);
