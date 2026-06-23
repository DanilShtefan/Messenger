import { ApiError } from '../errors/ApiError.js';
import { messageRepository } from '../repositories/message.repository.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { getIO } from '../socket/index.js';

export const messageService = {
  async getByDialog(dialogId: string, userId: string, cursor?: string, limit = 30) {
    const dialog = await chatRepository.findById(dialogId);
    if (!dialog) throw ApiError.notFound('Dialog not found');

    const isParticipant = dialog.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw ApiError.forbidden('Not a participant');

    const otherParticipant = dialog.participants.find((p) => p.userId !== userId);
    const lastReadAt = otherParticipant?.lastReadAt ?? new Date(0);

    const raw = cursor
      ? await messageRepository.findByDialogBefore(dialogId, new Date(cursor), limit)
      : await messageRepository.findLatestByDialog(dialogId, limit);

    const hasMore = raw.length > limit;
    if (hasMore) raw.pop();

    const messages = raw.reverse().map((msg) => ({
      ...msg,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      readAt: msg.createdAt <= lastReadAt ? lastReadAt.toISOString() : null,
    }));

    return {
      messages,
      cursor: hasMore ? raw[0]?.createdAt.toISOString() ?? null : null,
    };
  },

  async update(messageId: string, userId: string, content: string) {
    const message = await messageRepository.findById(messageId);
    if (!message) throw ApiError.notFound('Message not found');
    if (message.senderId !== userId) throw ApiError.forbidden('Cannot edit this message');

    const updated = await messageRepository.update(messageId, { content });

    const updatedMsg = {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      readAt: null as string | null,
    };

    getIO().to(`dialog:${message.dialogId}`).emit('message:updated', updatedMsg);

    return updatedMsg;
  },

  async create(content: string, senderId: string, dialogId: string) {
    const dialog = await chatRepository.findById(dialogId);
    if (!dialog) throw ApiError.notFound('Dialog not found');

    const isParticipant = dialog.participants.some((p) => p.userId === senderId);
    if (!isParticipant) throw ApiError.forbidden('Not a participant');

    const message = await messageRepository.create({ content, senderId, dialogId });

    chatRepository.touch(dialogId).catch(() => {});

    const messageWithRead = {
      ...message,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      readAt: null as string | null,
    };

    getIO().to(`dialog:${dialogId}`).emit('message:new', messageWithRead);

    return messageWithRead;
  },
};
