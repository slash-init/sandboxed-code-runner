import getPrisma from "../lib/prisma.js";

const ALLOWED_LANGUAGES = ["python", "cpp", "javascript"];
const MAX_CODE_LENGTH = 50000; // 50KB max code size

export async function createSnippet(req, res) {
  const { language, code, input } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and code are required" });
  }

  if (!ALLOWED_LANGUAGES.includes(language)) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({ error: "Code exceeds maximum length (50KB)" });
  }

  try {
    const snippet = await getPrisma().snippet.create({
      data: {
        language,
        code,
        input: input || "",
      },
    });

    res.status(201).json({ id: snippet.id });
  } catch (err) {
    console.error("Failed to save snippet:", err.message);
    res.status(500).json({ error: "Failed to save snippet" });
  }
}

export async function getSnippet(req, res) {
  const { id } = req.params;

  if (!id || id.length > 30) {
    return res.status(400).json({ error: "Invalid snippet ID" });
  }

  try {
    const snippet = await getPrisma().snippet.findUnique({
      where: { id },
      select: {
        id: true,
        language: true,
        code: true,
        input: true,
        createdAt: true,
      },
    });

    if (!snippet) {
      return res.status(404).json({ error: "Snippet not found" });
    }

    res.json(snippet);
  } catch (err) {
    console.error("Failed to retrieve snippet:", err.message);
    res.status(500).json({ error: "Failed to retrieve snippet" });
  }
}
