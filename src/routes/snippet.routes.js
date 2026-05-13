import express from "express";
import { createSnippet, getSnippet } from "../services/snippet.service.js";
import { limiter } from "../config/limits.js";

const router = express.Router();

router.use(limiter);
router.post("/", createSnippet);
router.get("/:id", getSnippet);

export default router;
