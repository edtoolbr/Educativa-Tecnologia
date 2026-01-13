-- 001_init.sql
-- Initial schema for reading-fluency app

CREATE TABLE IF NOT EXISTS "User" (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  passwordHash TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TYPE "SessionStatus" AS ENUM ('PENDING','PROCESSING','DONE','CANCELLED');

CREATE TABLE IF NOT EXISTS "Session" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status "SessionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Recording" (
  id SERIAL PRIMARY KEY,
  "sessionId" INTEGER NOT NULL REFERENCES "Session"(id) ON DELETE CASCADE,
  "s3Key" TEXT NOT NULL,
  "lengthMs" INTEGER,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Score" (
  id SERIAL PRIMARY KEY,
  "recordingId" INTEGER NOT NULL UNIQUE REFERENCES "Recording"(id) ON DELETE CASCADE,
  "wordsCorrect" INTEGER NOT NULL DEFAULT 0,
  "totalWords" INTEGER NOT NULL DEFAULT 0,
  fluency REAL NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes to help processing queries
CREATE INDEX IF NOT EXISTS idx_recording_unprocessed ON "Recording" (processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_session_user ON "Session" ("userId");
