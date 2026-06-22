import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const usersData = [
  { email: 'admin@admin.admin', password: '123456',     displayName: 'Admin',         about: 'Administrator' },
  { email: 'alice@test.com',    password: 'password123', displayName: 'Alice Johnson', about: 'Hello, I am Alice!' },
  { email: 'bob@test.com',      password: 'password123', displayName: 'Bob Smith',     about: 'Hey there!' },
  { email: 'charlie@test.com',  password: 'password123', displayName: 'Charlie Brown', about: 'Photography enthusiast' },
  { email: 'diana@test.com',    password: 'password123', displayName: 'Diana Prince',  about: 'Book lover' },
  { email: 'eve@test.com',      password: 'password123', displayName: 'Eve Wilson',    about: 'Music producer' },
  { email: 'frank@test.com',    password: 'password123', displayName: 'Frank Castle',  about: 'Chef at heart' },
  { email: 'grace@test.com',    password: 'password123', displayName: 'Grace Hopper',  about: 'Code & coffee' },
  { email: 'henry@test.com',    password: 'password123', displayName: 'Henry Ford',    about: 'Traveler' },
  { email: 'iris@test.com',     password: 'password123', displayName: 'Iris West',     about: 'Artist' },
];

type FriendPair = [string, string];

const friendPairs: FriendPair[] = [
  // admin is friends with everyone
  ['admin@admin.admin', 'alice@test.com'],
  ['admin@admin.admin', 'bob@test.com'],
  ['admin@admin.admin', 'charlie@test.com'],
  ['admin@admin.admin', 'diana@test.com'],
  ['admin@admin.admin', 'eve@test.com'],
  ['admin@admin.admin', 'frank@test.com'],
  ['admin@admin.admin', 'grace@test.com'],
  ['admin@admin.admin', 'henry@test.com'],
  ['admin@admin.admin', 'iris@test.com'],
  // alice
  ['alice@test.com', 'bob@test.com'],
  ['alice@test.com', 'charlie@test.com'],
  // bob
  ['bob@test.com', 'diana@test.com'],
  // charlie
  ['charlie@test.com', 'diana@test.com'],
  // eve
  ['eve@test.com', 'frank@test.com'],
  ['eve@test.com', 'grace@test.com'],
  // frank
  ['frank@test.com', 'iris@test.com'],
  // grace
  ['grace@test.com', 'henry@test.com'],
  // henry
  ['henry@test.com', 'iris@test.com'],
];

async function main() {
  const passwordCache = new Map<string, string>();

  async function getHash(password: string): Promise<string> {
    let hash = passwordCache.get(password);
    if (!hash) {
      hash = await bcrypt.hash(password, 12);
      passwordCache.set(password, hash);
    }
    return hash;
  }

  const userMap = new Map<string, { id: string }>();

  for (const u of usersData) {
    const hash = await getHash(u.password);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: hash,
        displayName: u.displayName,
        about: u.about,
      },
    });
    userMap.set(u.email, user);
  }

  const friendRecords: { userId: string; friendId: string; status: 'PENDING' | 'ACCEPTED' }[] = [];

  for (const [emailA, emailB] of friendPairs) {
    const a = userMap.get(emailA);
    const b = userMap.get(emailB);
    if (!a || !b) continue;
    friendRecords.push({ userId: a.id, friendId: b.id, status: 'ACCEPTED' });
    friendRecords.push({ userId: b.id, friendId: a.id, status: 'ACCEPTED' });
  }

  if (friendRecords.length > 0) {
    await prisma.friend.createMany({ data: friendRecords, skipDuplicates: true });
  }

  console.log('Seeded users:', Object.fromEntries(
    [...userMap.entries()].map(([email, { id }]) => [email.split('@')[0], id])
  ));
  console.log(`Created ${friendRecords.length / 2} friend connections`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
