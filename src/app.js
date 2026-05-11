import express from "express";
import cors from "cors";
import runRoutes from "./routes/run.routes.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:4173"],
  methods: ["GET", "POST"],
}));

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.use("/run", runRoutes);

export default app;
