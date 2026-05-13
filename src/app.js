import express from "express";
import cors from "cors";
import runRoutes from "./routes/run.routes.js";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ["http://localhost:5173", "http://localhost:4173"];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
}));

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.use("/run", runRoutes);

export default app;
