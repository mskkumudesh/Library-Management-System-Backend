import mongoose from "mongoose";

let cachedConnection: typeof mongoose | null = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  if (cachedConnection) return cachedConnection;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  cachedConnection = await mongoose.connect(uri);
  console.log("MongoDB connected");
  return cachedConnection;
};
