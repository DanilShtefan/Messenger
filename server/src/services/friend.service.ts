import { friendRepository } from '../repositories/friend.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../errors/ApiError.js';
import { getIO } from '../socket/index.js';

function mapUser(u: { id: string; email: string; displayName: string; avatarUrl: string | null; about: string | null; createdAt: Date }) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    about: u.about,
    createdAt: u.createdAt.toISOString(),
  };
}

export const friendService = {
  async getFriends(userId: string) {
    const [asUser, asFriend] = await Promise.all([
      friendRepository.findByUserId(userId, 'ACCEPTED'),
      friendRepository.findByFriendId(userId, 'ACCEPTED'),
    ]);

    const map = new Map<string, ReturnType<typeof mapUser>>();
    asUser.forEach((f) => map.set(f.friend.id, mapUser(f.friend as any)));
    asFriend.forEach((f) => map.set(f.user.id, mapUser(f.user as any)));
    return Array.from(map.values());
  },

  async getIncomingRequests(userId: string) {
    const rows = await friendRepository.findByFriendId(userId, 'PENDING');
    return rows.map((f) => mapUser(f.user as any));
  },

  async getSuggested(userId: string) {
    const [friends, sentRequests, incomingRequests, allUsers] = await Promise.all([
      friendRepository.findByUserId(userId, 'ACCEPTED'),
      friendRepository.findByUserId(userId, 'PENDING'),
      friendRepository.findByFriendId(userId, 'PENDING'),
      userRepository.findAll(),
    ]);

    const excludeIds = new Set<string>();
    excludeIds.add(userId);
    friends.forEach((f) => excludeIds.add(f.friend.id));
    sentRequests.forEach((f) => excludeIds.add(f.friend.id));
    incomingRequests.forEach((f) => excludeIds.add(f.user.id));

    // Also exclude users where friendId = currentUser in ACCEPTED (I'm in their friend list)
    const asFriend = await friendRepository.findByFriendId(userId, 'ACCEPTED');
    asFriend.forEach((f) => excludeIds.add(f.user.id));

    return allUsers
      .filter((u) => !excludeIds.has(u.id))
      .map((u) => mapUser(u));
  },

  async sendRequest(userId: string, friendId: string) {
    if (userId === friendId) {
      throw ApiError.badRequest('Cannot add yourself as friend');
    }

    const friendUser = await userRepository.findById(friendId);
    if (!friendUser) {
      throw ApiError.notFound('User not found');
    }

    const existing = await friendRepository.findFriendship(userId, friendId);
    if (existing) {
      throw ApiError.conflict('Request already exists or already friends');
    }

    // Check if there's an incoming request from this user — auto-accept
    const incoming = await friendRepository.findFriendship(friendId, userId);
    if (incoming && incoming.status === 'PENDING') {
      await Promise.all([
        friendRepository.accept(friendId, userId),
        friendRepository.add(userId, friendId, 'ACCEPTED'),
      ]);
      getIO().to(`user:${friendId}`).emit('friend:accept', { userId });
      getIO().to(`user:${userId}`).emit('friend:accept', { userId: friendId });
      return { autoAccepted: true };
    }

    await friendRepository.add(userId, friendId, 'PENDING');
    getIO().to(`user:${friendId}`).emit('friend:request', { userId });
    return { autoAccepted: false };
  },

  async getSentRequests(userId: string) {
    const rows = await friendRepository.findByUserId(userId, 'PENDING');
    return rows.map((f) => mapUser(f.friend as any));
  },

  async acceptRequest(userId: string, requesterId: string) {
    const request = await friendRepository.findFriendship(requesterId, userId);
    if (!request || request.status !== 'PENDING') {
      throw ApiError.notFound('No pending request found');
    }

    await Promise.all([
      friendRepository.accept(requesterId, userId),
      friendRepository.add(userId, requesterId, 'ACCEPTED'),
    ]);

    getIO().to(`user:${requesterId}`).emit('friend:accept', { userId });
    getIO().to(`user:${userId}`).emit('friend:accept', { userId: requesterId });
  },

  async rejectRequest(userId: string, requesterId: string) {
    const request = await friendRepository.findFriendship(requesterId, userId);
    if (!request || request.status !== 'PENDING') {
      throw ApiError.notFound('No pending request found');
    }

    await friendRepository.remove(requesterId, userId);

    getIO().to(`user:${requesterId}`).emit('friend:reject', { userId });
    getIO().to(`user:${userId}`).emit('friend:reject', { userId: requesterId });
  },

  async removeFriend(userId: string, friendId: string) {
    await Promise.all([
      friendRepository.remove(userId, friendId).catch(() => {}),
      friendRepository.remove(friendId, userId).catch(() => {}),
    ]);
  },
};
