import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function getDatabaseUrl(): string {
  // 1. If running on Vercel or in AWS Lambda serverless container
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = '/tmp/dev.db';

    // Copy bundled seed.db to writable /tmp/dev.db if not already present
    if (!fs.existsSync(tmpDbPath)) {
      const candidateSeeds = [
        path.join(process.cwd(), 'prisma', 'seed.db'),
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'seed.db'),
        path.resolve(__dirname, '..', '..', 'prisma', 'seed.db'),
        path.resolve(__dirname, '..', 'prisma', 'seed.db'),
        path.resolve(__dirname, 'prisma', 'seed.db'),
        '/var/task/prisma/seed.db',
        '/var/task/seed.db',
      ];

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
      return 'file:/tmp/dev.db';
    }

    // Direct fallback if /tmp copy could not be created
    const directSeed = path.join(process.cwd(), 'prisma', 'seed.db');
    if (fs.existsSync(directSeed)) {
      return `file:${directSeed}`;
    }
  }

  // 2. Local environment or build-time resolution
  // ALWAYS convert relative SQLite paths to absolute paths so Next.js worker threads never fail
  const rawUrl = process.env.DATABASE_URL;
  if (rawUrl && rawUrl.startsWith('file:')) {
    const filePath = rawUrl.replace(/^file:/, '').trim();
    if (path.isAbsolute(filePath)) {
      return `file:${filePath.replace(/\\/g, '/')}`;
    }
    // Resolve relative path against process.cwd()
    const resolvedPath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(resolvedPath)) {
      return `file:${resolvedPath.replace(/\\/g, '/')}`;
    }
  }

  // 3. Fallbacks to existing database files
  const devDb = path.resolve(process.cwd(), 'prisma', 'dev.db');
  if (fs.existsSync(devDb)) {
    return `file:${devDb.replace(/\\/g, '/')}`;
  }

  const seedDb = path.resolve(process.cwd(), 'prisma', 'seed.db');
  if (fs.existsSync(seedDb)) {
    return `file:${seedDb.replace(/\\/g, '/')}`;
  }

  return 'file:./prisma/dev.db';
}

const resolvedDbUrl = getDatabaseUrl();
process.env.DATABASE_URL = resolvedDbUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
