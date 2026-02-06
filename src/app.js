import express from "express";
import runRoutes from "./routes/run.routes.js";

const app = express();
app.use(express.json());
app.use("/run", runRoutes);

export default app;
