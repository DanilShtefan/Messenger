import { ApiError } from '../errors/ApiError.js';
import { messageRepository } from '../repositories/message.repository.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { getIO } from '../socket/index.js';

function serializeMessage(msg: any) {
  return {
    ...msg,
    reactions: msg.reactions ?? {},
    forwardedFrom: msg.forwardedFrom ?? null,
    createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
    updatedAt: msg.updatedAt instanceof Date ? msg.updatedAt.toISOString() : msg.updatedAt,
    readAt: null as string | null,
  };
}

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
      reactions: msg.reactions ?? {},
      forwardedFrom: msg.forwardedFrom ?? null,
      createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
      updatedAt: msg.updatedAt instanceof Date ? msg.updatedAt.toISOString() : msg.updatedAt,
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
    const updatedMsg = serializeMessage(updated);
    updatedMsg.readAt = null;

    getIO().to(`dialog:${message.dialogId}`).emit('message:updated', updatedMsg);
    return updatedMsg;
  },

  async create(content: string, senderId: string, dialogId: string, forwardedFrom?: { senderName: string; content: string } | null) {
    const dialog = await chatRepository.findById(dialogId);
    if (!dialog) throw ApiError.notFound('Dialog not found');

    const isParticipant = dialog.participants.some((p) => p.userId === senderId);
    if (!isParticipant) throw ApiError.forbidden('Not a participant');

    const message = await messageRepository.create({ content, senderId, dialogId, forwardedFrom: forwardedFrom ?? undefined });

    chatRepository.touch(dialogId).catch(() => {});

    const messageWithRead = serializeMessage(message);

    getIO().to(`dialog:${dialogId}`).emit('message:new', messageWithRead);
    return messageWithRead;
  },

  async toggleReaction(messageId: string, userId: string, emoji: string) {
    const message = await messageRepository.findById(messageId);
    if (!message) throw ApiError.notFound('Message not found');

    const reactions = (message.reactions as Record<string, string[]>) ?? {};
    const users = reactions[emoji] ?? [];
    const idx = users.indexOf(userId);
    if (idx >= 0) {
      users.splice(idx, 1);
      if (users.length === 0) delete reactions[emoji];
      else reactions[emoji] = users;
    } else {
      reactions[emoji] = [...users, userId];
    }

    const updated = await messageRepository.updateReactions(messageId, reactions);

    const reactedMsg = {
      ...updated,
      reactions,
      forwardedFrom: updated.forwardedFrom ?? null,
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
      updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : updated.updatedAt,
      readAt: null as string | null,
    };

    getIO().to(`dialog:${message.dialogId}`).emit('message:reacted', reactedMsg);
    return reactedMsg;
  },
};
