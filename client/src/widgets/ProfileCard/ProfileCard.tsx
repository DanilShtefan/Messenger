import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Film } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { useFetchProfile } from '@/shared/hooks/useFetchProfile';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { moviesApi } from '@/shared/api/movies.api';
import { profileApi } from '@/shared/api/profile.api';
import { friendsApi } from '@/shared/api/friends.api';
import { chatsApi } from '@/shared/api/chats.api';
import { followApi } from '@/shared/api/follow.api';
import { cn } from '@/shared/lib/helpers';
import { useMusicPlayer } from '@/shared/lib/MusicPlayerContext';
import { useMoviePlayer } from '@/shared/lib/MoviePlayerContext';
import { Avatar, Button, Input, Skeleton } from '@/shared/ui';
import type { User, UserProfile } from '@/shared/types';
import styles from './ProfileCard.module.css';

interface ProfileCardProps {
  userId: string;
}

export function ProfileCard({ userId }: ProfileCardProps) {
  const { t } = useTranslation('common');
  const { profile, isLoading, setProfile } = useFetchProfile(userId);
  const { isOnline } = useOnlineStatus();
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [friends, setFriends] = useState<User[]>([]);
  const [sent, setSent] = useState<User[]>([]);
  const [sending, setSending] = useState(false);
  const player = useMusicPlayer();
  const moviePlayer = useMoviePlayer();

  const fetchState = useCallback(async () => {
    const [friendsData, sentData] = await Promise.all([
      friendsApi.getAll(),
      friendsApi.getSent(),
    ]);
    setFriends(friendsData);
    setSent(sentData);
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  const isOwn = currentUserId === userId;
  const online = isOwn || isOnline(userId) || !!profile?.isOnline;
  const isFriend = !isOwn && friends.some((f) => f.id === userId);
  const hasSentRequest = !isOwn && !isFriend && sent.some((f) => f.id === userId);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAbout, setEditAbout] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (isEditing && profile) {
      setEditName(profile.displayName);
      setEditAbout(profile.about ?? '');
    }
  }, [isEditing, profile]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const updated = await profileApi.uploadAvatar(file);
      setProfile(updated);
    } catch {
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await profileApi.updateProfile({ displayName: editName, about: editAbout || null });
      setProfile(updated as UserProfile);
      setIsEditing(false);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function handleSendMessage() {
    if (!currentUserId) return;
    setSending(true);
    try {
      const dialog = await chatsApi.getOrCreateByUserId(userId);
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      navigate(`/chats/${dialog.id}`);
    } catch {
      setSending(false);
    }
  }

  async function handleAddFriend() {
    try {
      await friendsApi.add(userId);
      await fetchState();
    } catch {}
  }

  async function handleRemoveFriend() {
    try {
      await friendsApi.remove(userId);
      await fetchState();
    } catch {}
  }

  async function handleToggleFollow() {
    if (!profile) return;
    setFollowLoading(true);
    try {
      const { isFollowing } = await followApi.toggleFollow(userId);
      setProfile({ ...profile, isFollowing });
    } catch {} finally {
      setFollowLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.card}>
        <Skeleton width={96} height={96} borderRadius="50%" />
        <Skeleton width="40%" height={28} />
        <Skeleton width="20%" height={16} />
        <Skeleton width="30%" height={16} />
        <div className={styles.about}>
          <Skeleton width="100%" height={14} />
          <Skeleton width="80%" height={14} />
        </div>
        <div className={styles.currentTrack}>
          <Skeleton width={48} height={48} borderRadius="0.5rem" />
          <div className={styles.trackMeta}>
            <Skeleton width="40%" height={12} />
            <Skeleton width="60%" height={14} />
            <Skeleton width="30%" height={12} />
          </div>
        </div>
        <div className={styles.currentMovie}>
          <Skeleton width={48} height={48} borderRadius="0.5rem" />
          <div className={styles.movieMeta}>
            <Skeleton width="30%" height={12} />
            <Skeleton width="50%" height={14} />
          </div>
        </div>
        <div className={styles.actions}>
          <Skeleton width="30%" height={36} borderRadius="0.5rem" />
          <Skeleton width="30%" height={36} borderRadius="0.5rem" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className={styles.card}>{t('profile.user_not_found')}</div>;
  }

  return (
    <div className={styles.card}>
      <div className={cn(styles.avatarWrap, isEditing && styles.avatarEditable)} onClick={() => document.getElementById('avatarInput')?.click()}>
        <Avatar src={profile.avatarUrl} name={profile.displayName} size="xl" />
        {online && <span className={styles.onlineDot} />}
        {isEditing && (
          <div className={styles.avatarOverlay}>
              {uploadingAvatar ? (
                <span className={styles.overlayText}>{t('profile.uploading')}</span>
            ) : (
              <svg className={styles.plusIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </div>
        )}
        <input
          id="avatarInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className={styles.avatarInputHidden}
          onChange={handleAvatarChange}
        />
      </div>

      {isEditing ? (
        <div className={styles.editForm}>
          <Input
            label={t('profile.display_name')}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <div className={styles.inputWrap}>
            <label className={styles.inputLabel}>{t('profile.about')}</label>
            <textarea
              className={styles.textarea}
              value={editAbout}
              onChange={(e) => setEditAbout(e.target.value)}
              rows={3}
              maxLength={256}
            />
          </div>
          <div className={styles.actions}>
            <Button onClick={handleSave} isLoading={saving}>{t('profile.save')}</Button>
            <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={saving}>{t('profile.cancel')}</Button>
          </div>
        </div>
      ) : (
        <>
          <h1 className={styles.name}>{profile.displayName}</h1>

          <span className={cn(styles.status, online && styles.statusOnline)}>
            {online ? t('profile.online') : t('profile.offline')}
          </span>

          <div className={styles.stats}>
            <span className={styles.stat}><b>{profile.friendCount}</b> {t('profile.friends_label')}</span>
            {!isOwn && profile.mutualFriendCount > 0 && (
              <span className={styles.stat}><b>{profile.mutualFriendCount}</b> {t('profile.mutual_label')}</span>
            )}
          </div>

          <div className={styles.about}>
            {profile.about ? (
              <p className={styles.aboutText}>{profile.about}</p>
            ) : (
              <p className={styles.aboutEmpty}>{t('profile.no_bio')}</p>
            )}
          </div>

          {profile.currentTrack && (
            <div className={styles.currentTrack}>
              <img
                src={profile.currentTrack.cover}
                alt=""
                className={styles.trackCover}
              />
              <div className={styles.trackMeta}>
                <span className={styles.trackLabel}>{t('profile.listening_to')}</span>
                <span className={styles.trackName}>{profile.currentTrack.title}</span>
                <span className={styles.trackArtist}>{profile.currentTrack.artist}</span>
              </div>
              {!isOwn && player.hostId !== userId && (
                <button className={styles.joinBtn} onClick={() => player.joinSession(userId)}>
                  {t('profile.join')}
                </button>
              )}
              {player.hostId === userId && (
                <button className={styles.joinBtn} onClick={player.leaveSession}>
                  {t('profile.leave')}
                </button>
              )}
            </div>
          )}

          {profile.currentMovie && (
            <div className={styles.currentMovie}>
              <div className={styles.movieCover}>
                <img
                  src={moviesApi.getThumbnail(profile.currentMovie.identifier)}
                  alt=""
                  className={styles.movieCoverImg}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <Film className={styles.movieCoverFallback} size={20} />
              </div>
              <div className={styles.movieMeta}>
                <span className={styles.movieLabel}>{t('profile.watching')}</span>
                <span className={styles.movieTitle}>{profile.currentMovie.title}</span>
              </div>
              {!isOwn && moviePlayer.hostId !== userId && (
                <button
                  className={styles.joinBtn}
                  onClick={() => {
                    moviePlayer.joinSession(userId);
                    navigate('/movies');
                  }}
                >
                  {t('profile.join')}
                </button>
              )}
              {moviePlayer.hostId === userId && (
                <button className={styles.joinBtn} onClick={moviePlayer.leaveSession}>
                  {t('profile.leave')}
                </button>
              )}
            </div>
          )}

          {isOwn ? (
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>{t('profile.edit_profile')}</Button>
            </div>
          ) : (
            <div className={styles.actions}>
              {isFriend ? (
                <Button variant="secondary" onClick={handleRemoveFriend}>
                  {t('profile.friend_button')}
                </Button>
              ) : hasSentRequest ? (
                <Button variant="secondary" disabled>
                  {t('profile.request_sent')}
                </Button>
              ) : (
                <Button onClick={handleAddFriend}>
                  {t('profile.add_friend')}
                </Button>
              )}
              <Button
                variant={profile.isFollowing ? 'secondary' : 'primary'}
                onClick={handleToggleFollow}
                isLoading={followLoading}
              >
                {profile.isFollowing ? t('profile.unfollow') : t('profile.follow')}
              </Button>
              <Button variant="secondary" onClick={handleSendMessage} isLoading={sending}>
                {t('profile.send_message')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
