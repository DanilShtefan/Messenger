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

const followPairs: [string, string][] = [
  // admin подписан на всех
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
  ['alice@test.com', 'grace@test.com'],
  // bob
  ['bob@test.com', 'diana@test.com'],
  ['bob@test.com', 'eve@test.com'],
  // charlie
  ['charlie@test.com', 'diana@test.com'],
  // diana
  ['diana@test.com', 'frank@test.com'],
  // eve
  ['eve@test.com', 'frank@test.com'],
  // frank
  ['frank@test.com', 'iris@test.com'],
  // grace
  ['grace@test.com', 'henry@test.com'],
  // henry
  ['henry@test.com', 'iris@test.com'],
  // iris
  ['iris@test.com', 'alice@test.com'],
];

const samplePosts = [
  'Just finished reading an amazing book! Highly recommend it.',
  'Morning run in the park — nothing beats fresh air.',
  'New recipe tried today, turned out great!',
  'Beautiful sunset captured on camera 📸',
  'Coffee and coding — my perfect morning routine.',
  'Weekend hike was exactly what I needed.',
  'Just launched a new side project, feeling excited!',
  'Rainy days are perfect for watching movies.',
  'Finally organized my desk, productivity +100%',
  'Trying out a new music genre, surprisingly good.',
  'Homegrown tomatoes taste so much better!',
  'Late night thoughts: what if we colonize Mars?',
  'Learning TypeScript patterns, mind = blown.',
  'Dog park adventures with my furry friend 🐕',
  'Just baked chocolate chip cookies from scratch.',
  'Finished a 30-day challenge — consistency wins!',
  'Exploring hidden cafes in the city today.',
  'The new album dropped and it is fire! 🔥',
  'Spent the whole day reading, no regrets.',
  'Started learning guitar, fingers hurt already.',
  'Road trip planning mode activated 🚗',
  'Had the weirdest dream last night...',
  'Productivity hack: 25-minute pomodoro sessions.',
  'Stargazing tonight, hoping to see some meteors.',
  'Just finished a 5K run, new personal best!',
  'Tried meditation for the first time, interesting.',
  'New coffee shop opened downtown, highly recommend.',
  'Sunrise yoga session — great way to start the day.',
  'Decluttered my wardrobe, feels so liberating.',
  'Weekend barbecue with friends was amazing!',
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

  const followRecords = followPairs
    .map(([followerEmail, followingEmail]) => {
      const follower = userMap.get(followerEmail);
      const following = userMap.get(followingEmail);
      if (!follower || !following) return null;
      return { followerId: follower.id, followingId: following.id };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (followRecords.length > 0) {
    await prisma.follow.createMany({ data: followRecords, skipDuplicates: true });
  }

  const POSTS_PER_USER = 10;
  let totalPostsCreated = 0;

  for (const { email } of usersData) {
    const user = userMap.get(email);
    if (!user) continue;

    const existing = await prisma.post.count({ where: { authorId: user.id } });
    if (existing >= POSTS_PER_USER) continue;

    const posts = Array.from({ length: POSTS_PER_USER }, (_, i) => ({
      authorId: user.id,
      content: samplePosts[i % samplePosts.length],
    }));

    await prisma.post.createMany({ data: posts });
    totalPostsCreated += posts.length;
  }

  console.log('Seeded users:', Object.fromEntries(
    [...userMap.entries()].map(([email, { id }]) => [email.split('@')[0], id])
  ));
  console.log(`Created ${friendRecords.length / 2} friend connections`);
  console.log(`Created ${followRecords.length} follow connections`);
  console.log(`Created ${totalPostsCreated} posts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
