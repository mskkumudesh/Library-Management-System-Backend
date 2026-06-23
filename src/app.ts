import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { notFound, errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import bookRoutes from "./routes/bookRoutes";
import userRoutes from "./routes/userRoutes";
import borrowRoutes from "./routes/borrowRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import chatRoutes from "./routes/chatRoutes";

const app = express();

const normalize = (url: string) => url.trim().replace(/\/+$/, "");

const allowedOrigin = normalize(
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (normalize(origin) === allowedOrigin) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "ShelfScan Backend Running",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

// Ensure DB connection for every request
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;