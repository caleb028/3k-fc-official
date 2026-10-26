import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// On Vercel serverless functions, files outside /tmp are read-only.
// Copy the bundled seed.db to /tmp/dev.db on cold start so writes (sessions, audits, admin) succeed.
if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/dev.db';
  const candidateSeeds = [
    path.join(process.cwd(), 'prisma', 'seed.db'),
    path.join(process.cwd(), 'prisma', 'dev.db'),
  ];

  if (!fs.existsSync(tmpDbPath)) {
    for (const cand of candidateSeeds) {
      if (fs.existsSync(cand)) {
        try {
          fs.copyFileSync(cand, tmpDbPath);
          break;
        } catch {
          // ignore
        }
      }
    }
  }

  if (fs.existsSync(tmpDbPath)) {
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  } else if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./seed.db';
  }
} else if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
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
