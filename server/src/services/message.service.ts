import { ApiError } from '../errors/ApiError.js';
import { messageRepository } from '../repositories/message.repository.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { getIO } from '../socket/index.js';

export const messageService = {
  async getByDialog(dialogId: string, userId: string, page: number, limit: number) {
    const dialog = await chatRepository.findById(dialogId);
    if (!dialog) throw ApiError.notFound('Dialog not found');

    const isParticipant = dialog.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw ApiError.forbidden('Not a participant');

    const otherParticipant = dialog.participants.find((p) => p.userId !== userId);
    const lastReadAt = otherParticipant?.lastReadAt ?? new Date(0);

    const [messages, total] = await Promise.all([
      messageRepository.findByDialog(dialogId, page, limit),
      messageRepository.countByDialog(dialogId),
    ]);

    const messagesWithReadStatus = messages.reverse().map((msg) => ({
      ...msg,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      readAt: msg.createdAt <= lastReadAt ? lastReadAt.toISOString() : null,
    }));

    return { messages: messagesWithReadStatus, total, page, limit };
  },

  async create(content: string, senderId: string, dialogId: string) {
    const dialog = await chatRepository.findById(dialogId);
    if (!dialog) throw ApiError.notFound('Dialog not found');

    const isParticipant = dialog.participants.some((p) => p.userId === senderId);
    if (!isParticipant) throw ApiError.forbidden('Not a participant');

    const message = await messageRepository.create({ content, senderId, dialogId });

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
