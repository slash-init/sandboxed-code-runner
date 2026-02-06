import express from "express";
import { runCode } from "../services/execution.service.js";

const router = express.Router();

router.post("/", runCode);

export default router;
