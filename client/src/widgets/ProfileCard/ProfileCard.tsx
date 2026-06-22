import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { useFetchProfile } from '@/shared/hooks/useFetchProfile';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { profileApi } from '@/shared/api/profile.api';
import { friendsApi } from '@/shared/api/friends.api';
import { chatsApi } from '@/shared/api/chats.api';
import { cn } from '@/shared/lib/helpers';
import { Avatar, Button, Input, Skeleton } from '@/shared/ui';
import type { User, UserProfile } from '@/shared/types';
import styles from './ProfileCard.module.css';

interface ProfileCardProps {
  userId: string;
}

export function ProfileCard({ userId }: ProfileCardProps) {
  const { profile, isLoading, setProfile } = useFetchProfile(userId);
  const { isOnline } = useOnlineStatus();
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);
  const navigate = useNavigate();
  const [friends, setFriends] = useState<User[]>([]);
  const [sent, setSent] = useState<User[]>([]);
  const [sending, setSending] = useState(false);

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

  if (isLoading) {
    return (
      <div className={styles.card}>
        <Skeleton width={96} height={96} borderRadius="50%" />
        <Skeleton width="40%" height={22} />
        <Skeleton width="60%" height={14} />
      </div>
    );
  }

  if (!profile) {
    return <div className={styles.card}>User not found</div>;
  }

  return (
    <div className={styles.card}>
      <div className={cn(styles.avatarWrap, isEditing && styles.avatarEditable)} onClick={() => document.getElementById('avatarInput')?.click()}>
        <Avatar src={profile.avatarUrl} name={profile.displayName} size="xl" />
        {online && <span className={styles.onlineDot} />}
        {isEditing && (
          <div className={styles.avatarOverlay}>
            {uploadingAvatar ? (
              <span className={styles.overlayText}>Uploading...</span>
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
            label="Display name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <div className={styles.inputWrap}>
            <label className={styles.inputLabel}>About</label>
            <textarea
              className={styles.textarea}
              value={editAbout}
              onChange={(e) => setEditAbout(e.target.value)}
              rows={3}
              maxLength={256}
            />
          </div>
          <div className={styles.actions}>
            <Button onClick={handleSave} isLoading={saving}>Save</Button>
            <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={saving}>Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          <h1 className={styles.name}>{profile.displayName}</h1>

          <span className={cn(styles.status, online && styles.statusOnline)}>
            {online ? 'Online' : 'Offline'}
          </span>

          <div className={styles.stats}>
            <span className={styles.stat}><b>{profile.friendCount}</b> friends</span>
            {!isOwn && profile.mutualFriendCount > 0 && (
              <span className={styles.stat}><b>{profile.mutualFriendCount}</b> mutual</span>
            )}
          </div>

          <div className={styles.about}>
            {profile.about ? (
              <p className={styles.aboutText}>{profile.about}</p>
            ) : (
              <p className={styles.aboutEmpty}>No bio yet</p>
            )}
          </div>

          {isOwn ? (
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit profile</Button>
            </div>
          ) : (
            <div className={styles.actions}>
              {isFriend ? (
                <Button variant="secondary" onClick={handleRemoveFriend}>
                  Friends
                </Button>
              ) : hasSentRequest ? (
                <Button variant="secondary" disabled>
                  Request sent
                </Button>
              ) : (
                <Button onClick={handleAddFriend}>
                  Add friend
                </Button>
              )}
              <Button variant="secondary" onClick={handleSendMessage} isLoading={sending}>
                Send message
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
