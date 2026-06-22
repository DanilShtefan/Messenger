import { execSync } from 'child_process';
import { existsSync } from 'fs';

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

console.log('=== Setting up Messenger ===\n');

// 1. Start PostgreSQL
run('node scripts/db.mjs start');

// 2. Install dependencies
console.log('\n--- Installing server dependencies ---');
run('npm install --prefix server');

console.log('\n--- Installing client dependencies ---');
run('npm install --prefix client');

console.log('\n--- Installing root dependencies ---');
run('npm install');

// 3. Run migrations
console.log('\n--- Running database migrations ---');
run('npx prisma migrate dev --name init --skip-generate --skip-seed --skip-create-db 2>/dev/null || true');
run('npx prisma generate --no-hints');

// 4. Seed
console.log('\n--- Seeding database ---');
run('npx tsx prisma/seed.ts');

console.log('\n=== Setup complete! Run: npm run dev ===');
