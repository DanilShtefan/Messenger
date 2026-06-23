import type { Participant } from '@prisma/client';
import { prisma } from '../db.js';

const dialogInclude = {
  participants: { include: { user: true } },
  messages: { orderBy: { createdAt: 'desc' as const }, take: 1 },
} as const;

export const chatRepository = {
  findById: (id: string) =>
    prisma.dialog.findUnique({ where: { id }, include: dialogInclude }),

  findParticipant: (dialogId: string, userId: string) =>
    prisma.participant.findUnique({
      where: { userId_dialogId: { userId, dialogId } },
    }),

  updateLastReadAt: (dialogId: string, userId: string) =>
    prisma.participant.update({
      where: { userId_dialogId: { userId, dialogId } },
      data: { lastReadAt: new Date() },
    }),

  countUnread: (dialogId: string, userId: string, since: Date) =>
    prisma.message.count({
      where: {
        dialogId,
        senderId: { not: userId },
        createdAt: { gt: since },
      },
    }),

  findByUserId: (userId: string) =>
    prisma.dialog.findMany({
      where: { participants: { some: { userId } } },
      include: dialogInclude,
      orderBy: { updatedAt: 'desc' },
    }),

  findDirectDialog: (user1Id: string, user2Id: string) =>
    prisma.dialog.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: user1Id } } },
          { participants: { some: { userId: user2Id } } },
        ],
      },
      include: dialogInclude,
    }),

  create: (participantIds: string[]) =>
    prisma.dialog.create({
      data: {
        participants: {
          create: participantIds.map((userId) => ({ userId })),
        },
      },
      include: dialogInclude,
    }),

  addParticipant: (dialogId: string, userId: string): Promise<Participant> =>
    prisma.participant.create({ data: { dialogId, userId } }),

  touch: (dialogId: string) =>
    prisma.dialog.update({ where: { id: dialogId }, data: {} }),
};
