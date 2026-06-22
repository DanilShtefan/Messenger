import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import os from 'os';

const PGDATA = resolve(os.homedir(), '.local/share/messenger/pgdata');
const PG_BIN = '/usr/lib/postgresql/18/bin';

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', ...opts });
  } catch (e) {
    if (!opts.ignoreError) throw e;
  }
}

function isRunning() {
  try {
    execSync(`${PG_BIN}/pg_ctl -D ${PGDATA} status`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function start() {
  if (isRunning()) {
    console.log('PostgreSQL already running');
    return;
  }

  const isFresh = !existsSync(PGDATA);

  if (isFresh) {
    console.log('Initializing PostgreSQL...');
    mkdirSync(PGDATA, { recursive: true, mode: 0o700 });
    run(`${PG_BIN}/initdb -D ${PGDATA}`);
    run(`echo "port = 5433" >> ${PGDATA}/postgresql.conf`);
    run(`echo "listen_addresses = 'localhost'" >> ${PGDATA}/postgresql.conf`);
    run(`echo "unix_socket_directories = '/tmp'" >> ${PGDATA}/postgresql.conf`);
  }

  console.log('Starting PostgreSQL...');
  run(`${PG_BIN}/pg_ctl -D ${PGDATA} -l ${PGDATA}/logfile start`);

  run(`${PG_BIN}/psql -h /tmp -p 5433 -d postgres -c "SELECT 1"`, { ignoreError: true });

  run(`${PG_BIN}/createdb -h /tmp -p 5433 messenger`, { ignoreError: true });

  if (isFresh) {
    console.log('\n--- Running migrations ---');
    run('npx prisma migrate dev', { cwd: resolve('server') });

    console.log('\n--- Seeding database ---');
    run('npx tsx prisma/seed.ts', { cwd: resolve('server') });
  }
}

function stop() {
  if (!isRunning()) {
    console.log('PostgreSQL not running');
    return;
  }
  console.log('Stopping PostgreSQL...');
  run(`${PG_BIN}/pg_ctl -D ${PGDATA} stop`);
}

const cmd = process.argv[2];

if (cmd === 'start') start();
else if (cmd === 'stop') stop();
else console.log('Usage: node scripts/db.mjs [start|stop]');
