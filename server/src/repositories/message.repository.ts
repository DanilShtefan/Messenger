import type { Message } from '@prisma/client';
import { prisma } from '../db.js';

export const messageRepository = {
  findByDialog: (dialogId: string, page = 1, limit = 30) =>
    prisma.message.findMany({
      where: { dialogId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),

  findByDialogBefore: (dialogId: string, beforeDate: Date, limit = 30) =>
    prisma.message.findMany({
      where: { dialogId, createdAt: { lt: beforeDate } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    }),

  findLatestByDialog: (dialogId: string, limit = 30) =>
    prisma.message.findMany({
      where: { dialogId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    }),

  countByDialog: (dialogId: string): Promise<number> =>
    prisma.message.count({ where: { dialogId } }),

  findById: (id: string): Promise<Message | null> =>
    prisma.message.findUnique({ where: { id } }),

  update: (id: string, data: { content: string }): Promise<Message> =>
    prisma.message.update({ where: { id }, data }),

  create: (data: Pick<Message, 'content' | 'senderId' | 'dialogId'>): Promise<Message> =>
    prisma.message.create({ data }),
};
