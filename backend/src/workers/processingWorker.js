/**
 * processingWorker.js
 *
 * Simple polling worker that finds unprocessed recordings, downloads them from S3,
 * runs a placeholder "processing" step, and writes a Score record.
 *
 * This is intentionally minimal and synchronous for demo purposes. In production
 * you'd use a queue (BullMQ, RabbitMQ, etc.) and parallel workers.
 */

const { PrismaClient } = require("@prisma/client");
const { getObjectStream } = require("../lib/s3");

const prisma = new PrismaClient();

async function processRecording(recording) {
  console.log(`Processing recording id=${recording.id} s3Key=${recording.s3Key}`);

  try {
    // Download file stream from S3 (placeholder; actual audio processing omitted)
    let stream;
    try {
      stream = await getObjectStream(recording.s3Key);
    } catch (err) {
      console.warn(`Could not download ${recording.s3Key}:`, err.message);
      // mark processed to avoid retry storms, or you could implement retries
      await prisma.recording.update({ where: { id: recording.id }, data: { processed: true } });
      return;
    }

    // Placeholder: simulate analysis by reading a small amount of the stream or waiting
    // Here we'll just create a fake score based on a random metric for demonstration.

    // Example: pretend we counted words and correct words
    const totalWords = 100 + Math.floor(Math.random() * 100);
    const wordsCorrect = Math.max(0, totalWords - Math.floor(Math.random() * 20));
    const fluency = Number((wordsCorrect / totalWords * 100).toFixed(2));

    // Save score and mark recording processed in a transaction
    await prisma.$transaction([
      prisma.score.create({
        data: {
          recordingId: recording.id,
          wordsCorrect,
          totalWords,
          fluency,
        },
      }),
      prisma.recording.update({ where: { id: recording.id }, data: { processed: true } }),
    ]);

    console.log(`Processed recording id=${recording.id} => fluency=${fluency}`);
  } catch (err) {
    console.error(`Error processing recording id=${recording.id}:`, err);
  }
}

async function pollAndProcess() {
  try {
    // Find a small batch of unprocessed recordings
    const recordings = await prisma.recording.findMany({ where: { processed: false }, take: 5 });
    if (recordings.length === 0) {
      // nothing to do
      return;
    }

    for (const r of recordings) {
      // set status to processed=true early could avoid duplication in multi-worker setups,
      // but here we process directly to keep example simple
      await processRecording(r);
    }
  } catch (err) {
    console.error("Worker failed during poll:", err);
  }
}

async function startWorker(pollIntervalMs = 10_000) {
  console.log("Starting processing worker, poll interval:", pollIntervalMs);
  // Run first poll immediately
  await pollAndProcess();
  setInterval(pollAndProcess, pollIntervalMs);
}

if (require.main === module) {
  const interval = Number(process.env.WORKER_POLL_MS) || 10_000;
  startWorker(interval).catch((err) => {
    console.error("Fatal worker error:", err);
    process.exit(1);
  });
}

module.exports = { startWorker };
