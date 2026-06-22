import { createServer } from 'http';
import { execSync } from 'child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from './app.js';
import { env } from './config/env.js';
import { initSocket } from './socket/index.js';
import { prisma } from './db.js';

const httpServer = createServer(app);
initSocket(httpServer);

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    execSync('npx prisma migrate deploy', { cwd: __dirname, stdio: 'inherit' });
    console.log('Migrations completed successfully');
  } catch (err) {
    console.error('Migrations failed:', err);
    process.exit(1);
  }
}

async function autoSeed() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      console.log('Database empty, running seed...');
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      execSync('npx tsx prisma/seed.ts', { cwd: __dirname, stdio: 'inherit' });
      console.log('Seed complete.');
    } else {
      console.log(`Database has ${count} users, skipping seed.`);
    }
  } catch (err) {
    console.error('Seed check failed:', err);
  }
}

async function initialize() {
  try {
    await prisma.$connect();
    await runMigrations();
    await autoSeed();
    console.log('Server initialized successfully');
  } catch (err) {
    console.error('Initialization failed:', err);
    process.exit(1);
  }
}

function setupGracefulShutdown() {
  function shutdown(signal: string) {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    httpServer.close(() => {
      console.log('HTTP server closed');
      prisma.$disconnect().then(() => {
        console.log('Database disconnected');
        process.exit(0);
      }).catch(err => {
        console.error('Error during database disconnection:', err);
        process.exit(1);
      });
    });
    setTimeout(() => {
      console.error('Force shutdown after timeout');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

initialize().then(() => {
  httpServer.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
});

setupGracefulShutdown();
