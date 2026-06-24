import { ApiError } from '../errors/ApiError.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { getIO } from '../socket/index.js';

function serializeParticipant(p: any) {
  return {
    userId: p.userId,
    dialogId: p.dialogId,
    joinedAt: p.joinedAt instanceof Date ? p.joinedAt.toISOString() : p.joinedAt,
    user: {
      id: p.user.id,
      email: p.user.email,
      displayName: p.user.displayName,
      avatarUrl: p.user.avatarUrl,
      about: p.user.about,
      createdAt: p.user.createdAt instanceof Date ? p.user.createdAt.toISOString() : p.user.createdAt,
    },
  };
}

export const chatService = {
  async getUserDialogs(userId: string) {
    const dialogs = await chatRepository.findByUserId(userId);

    const result = await Promise.all(
      dialogs.map(async (dialog) => {
        const myParticipation = dialog.participants.find((p) => p.userId === userId);
        const lastReadAt = myParticipation?.lastReadAt ?? new Date(0);
        const otherParticipants = dialog.participants.filter((p) => p.userId !== userId);

        const unreadCount = dialog.messages[0]
          ? await chatRepository.countUnread(dialog.id, userId, lastReadAt)
          : 0;

        const participants = dialog.participants.map(serializeParticipant);

        return {
          id: dialog.id,
          name: dialog.name,
          participants,
          participant: dialog.name
            ? null
            : otherParticipants[0]
              ? {
                  id: otherParticipants[0].user.id,
                  email: otherParticipants[0].user.email,
                  displayName: otherParticipants[0].user.displayName,
                  avatarUrl: otherParticipants[0].user.avatarUrl,
                  about: otherParticipants[0].user.about,
                  createdAt: otherParticipants[0].user.createdAt.toISOString(),
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

  async create(participantIds: string[], name?: string) {
    const dialog = await chatRepository.create(participantIds, name);
    for (const pid of participantIds) {
      getIO().to(`user:${pid}`).emit('dialog:created', { dialogId: dialog.id });
    }
    return dialog;
  },

  async addParticipant(dialogId: string, userId: string, actorId: string) {
    const dialog = await chatRepository.findById(dialogId);
    if (!dialog) throw ApiError.notFound('Dialog not found');

    const isActorParticipant = dialog.participants.some((p) => p.userId === actorId);
    if (!isActorParticipant) throw ApiError.forbidden('Not a participant');

    const existing = dialog.participants.find((p) => p.userId === userId);
    if (existing) return dialog;

    await chatRepository.addParticipant(dialogId, userId);
    getIO().to(`user:${userId}`).emit('dialog:created', { dialogId });
    getIO().to(`dialog:${dialogId}`).emit('participant:added', { dialogId, userId });

    return chatRepository.findById(dialogId);
  },

  async removeParticipant(dialogId: string, userId: string, actorId: string) {
    const dialog = await chatRepository.findById(dialogId);
    if (!dialog) throw ApiError.notFound('Dialog not found');

    if (actorId !== userId) {
      const isActorParticipant = dialog.participants.some((p) => p.userId === actorId);
      if (!isActorParticipant) throw ApiError.forbidden('Not a participant');
    }

    await chatRepository.removeParticipant(dialogId, userId);
    getIO().to(`dialog:${dialogId}`).emit('participant:removed', { dialogId, userId });
    return chatRepository.findById(dialogId);
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
