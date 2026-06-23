import { ApiError } from '../errors/ApiError.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { getIO } from '../socket/index.js';

export const chatService = {
  async getUserDialogs(userId: string) {
    const dialogs = await chatRepository.findByUserId(userId);

    const result = await Promise.all(
      dialogs.map(async (dialog) => {
        const otherParticipant = dialog.participants.find((p) => p.userId !== userId);
        const myParticipation = dialog.participants.find((p) => p.userId === userId);
        const lastReadAt = myParticipation?.lastReadAt ?? new Date(0);

        const unreadCount = dialog.messages[0]
          ? await chatRepository.countUnread(dialog.id, userId, lastReadAt)
          : 0;

        return {
          id: dialog.id,
          participant: otherParticipant?.user
            ? {
                id: otherParticipant.user.id,
                email: otherParticipant.user.email,
                displayName: otherParticipant.user.displayName,
                avatarUrl: otherParticipant.user.avatarUrl,
                about: otherParticipant.user.about,
                createdAt: otherParticipant.user.createdAt.toISOString(),
              }
            : null,
          lastMessage: dialog.messages[0] ?? null,
          unreadCount,
          updatedAt: dialog.updatedAt.toISOString(),
        };
      }),
    );

    return result;
  },

  async getById(dialogId: string, userId: string) {
    const dialog = await chatRepository.findById(dialogId);
    if (!dialog) throw ApiError.notFound('Dialog not found');

    const isParticipant = dialog.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw ApiError.forbidden('Not a participant');

    return dialog;
  },

  async create(participantIds: string[]) {
    return chatRepository.create(participantIds);
  },

  async getOrCreateDirect(userId: string, participantId: string) {
    const existing = await chatRepository.findDirectDialog(userId, participantId);
    if (existing) return existing;

    const dialog = await chatRepository.create([userId, participantId]);

    getIO().to(`user:${userId}`).emit('dialog:created', { dialogId: dialog.id });
    getIO().to(`user:${participantId}`).emit('dialog:created', { dialogId: dialog.id });

    return dialog;
  },

  async markAsRead(dialogId: string, userId: string) {
    const dialog = await chatRepository.findById(dialogId);
    if (!dialog) throw ApiError.notFound('Dialog not found');

    const isParticipant = dialog.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw ApiError.forbidden('Not a participant');

    await chatRepository.updateLastReadAt(dialogId, userId);
    getIO().to(`dialog:${dialogId}`).emit('dialog:read', { dialogId, userId });
  },
};
