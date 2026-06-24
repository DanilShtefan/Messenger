import { prisma } from '../db.js';

const senderInclude = {
  sender: { select: { id: true, displayName: true, avatarUrl: true } },
};

export const messageRepository = {
  findByDialog: (dialogId: string, page = 1, limit = 30) =>
    prisma.message.findMany({
      where: { dialogId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: senderInclude,
    }),

  findByDialogBefore: (dialogId: string, beforeDate: Date, limit = 30) =>
    prisma.message.findMany({
      where: { dialogId, createdAt: { lt: beforeDate } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: senderInclude,
    }),

  findLatestByDialog: (dialogId: string, limit = 30) =>
    prisma.message.findMany({
      where: { dialogId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: senderInclude,
    }),

  countByDialog: (dialogId: string): Promise<number> =>
    prisma.message.count({ where: { dialogId } }),

  findById: (id: string) =>
    prisma.message.findUnique({ where: { id }, include: senderInclude }),

  update: (id: string, data: { content: string }) =>
    prisma.message.update({ where: { id }, data, include: senderInclude }),

  updateReactions: (id: string, reactions: Record<string, string[]>) =>
    prisma.message.update({ where: { id }, data: { reactions }, include: senderInclude }),

  create: (data: { content: string; senderId: string; dialogId: string; forwardedFrom?: any }) =>
    prisma.message.create({
      data: { content: data.content, senderId: data.senderId, dialogId: data.dialogId, forwardedFrom: data.forwardedFrom ?? null },
      include: senderInclude,
    }),
};
