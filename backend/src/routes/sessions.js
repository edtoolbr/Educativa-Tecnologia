const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { createPresignedUploadUrl } = require("../lib/s3");

const prisma = new PrismaClient();
const router = express.Router();

// Create a new session
// POST /sessions
// body: { userId, title }
router.post("/", async (req, res) => {
  try {
    const { userId, title } = req.body;
    if (!userId || !title) return res.status(400).json({ error: "userId and title are required" });

    const session = await prisma.session.create({ data: { userId, title } });
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get a session and its recordings and scores
// GET /sessions/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "invalid session id" });

    const session = await prisma.session.findUnique({
      where: { id },
      include: { recordings: { include: { score: true } }, user: { select: { id: true, email: true, name: true } } },
    });

    if (!session) return res.status(404).json({ error: "session not found" });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// Create a recording entry and return a presigned URL for upload
// POST /sessions/:id/recordings
// body: { filename, contentType }
router.post("/:id/recordings", async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const { filename, contentType } = req.body;

    if (!filename) return res.status(400).json({ error: "filename is required" });

    // create DB entry first
    const s3Key = `recordings/session_${sessionId}/${Date.now()}_${filename}`;
    const recording = await prisma.recording.create({ data: { sessionId, s3Key } });

    // generate presigned upload URL
    const uploadUrl = await createPresignedUploadUrl(s3Key, contentType || "audio/mpeg");

    res.status(201).json({ recording, uploadUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create recording" });
  }
});

module.exports = router;
