import express from "express";
import { runCode } from "../services/execution.service.js";
import { limiter } from "../config/limits.js";

const router = express.Router();

router.use(limiter);
router.post("/", runCode);

export default router;
