import { ApiError } from '../errors/ApiError.js';
import { userRepository } from '../repositories/user.repository.js';

export const userService = {
  async getById(userId: string, currentUserId?: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const [friendCount, mutualFriendCount] = await Promise.all([
      userRepository.countFriends(userId),
      currentUserId && currentUserId !== userId
        ? userRepository.findMutualFriendIds(currentUserId, userId).then((ids) => ids.length)
        : Promise.resolve(0),
    ]);

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      about: user.about,
      createdAt: user.createdAt.toISOString(),
      friendCount,
      mutualFriendCount,
    };
  },

  async update(userId: string, data: { displayName?: string; avatarUrl?: string | null; about?: string | null }, currentUserId?: string) {
    const user = await userRepository.update(userId, data);
    const [friendCount, mutualFriendCount] = await Promise.all([
      userRepository.countFriends(userId),
      currentUserId && currentUserId !== userId
        ? userRepository.findMutualFriendIds(currentUserId, userId).then((ids) => ids.length)
        : Promise.resolve(0),
    ]);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      about: user.about,
      createdAt: user.createdAt.toISOString(),
      friendCount,
      mutualFriendCount,
    };
  },
};
