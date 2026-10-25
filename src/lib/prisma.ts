import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// On Vercel serverless functions, files outside /tmp are read-only.
// If using SQLite (file:), copy the build-seeded dev.db to /tmp so writes (sessions, audits) succeed.
if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/dev.db';
  const bundledDbPath = path.join(process.cwd(), 'prisma', 'dev.db');

  if (!fs.existsSync(tmpDbPath) && fs.existsSync(bundledDbPath)) {
    try {
      fs.copyFileSync(bundledDbPath, tmpDbPath);
    } catch {
      // ignore if copy fails
    }
  }

  if (fs.existsSync(tmpDbPath)) {
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
