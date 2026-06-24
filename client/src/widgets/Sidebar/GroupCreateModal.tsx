import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react';
import { Avatar, Button } from '@/shared/ui';
import { friendsApi } from '@/shared/api/friends.api';
import { chatsApi } from '@/shared/api/chats.api';
import type { User } from '@/shared/types';
import styles from './Sidebar.module.css';

interface Props {
  onClose: () => void;
}

export function GroupCreateModal({ onClose }: Props) {
  const { t } = useTranslation('chat');
  const navigate = useNavigate();
  const [friends, setFriends] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    friendsApi.getAll().then(setFriends).catch(() => {});
  }, []);

  const hasSelected = Object.values(selectedIds).some(Boolean);
  const canCreate = groupName.trim().length > 0 && hasSelected;

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const ids = Object.keys(selectedIds).filter((id) => selectedIds[id]);
      const dialog = await chatsApi.create({ participantIds: ids, name: groupName.trim() });
      onClose();
      navigate(`/chats/${dialog.id}`);
    } catch {}
    setCreating(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.groupModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.groupModalHeader}>
          <h3>{t('create_group')}</h3>
          <button className={styles.groupModalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <input
          className={styles.groupNameInput}
          placeholder={t('group_name')}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          autoFocus
        />

        <div className={styles.friendList}>
          {friends.length === 0 && <div className={styles.empty}>{t('no_friends')}</div>}
          {friends.map((f) => {
            const selected = !!selectedIds[f.id];
            return (
              <button
                key={f.id}
                className={`${styles.friendItem} ${selected ? styles.friendSelected : ''}`}
                onClick={() => setSelectedIds((prev) => ({ ...prev, [f.id]: !prev[f.id] }))}
              >
                <Avatar src={f.avatarUrl} name={f.displayName} size="sm" />
                <span className={styles.friendName}>{f.displayName}</span>
                <div className={`${styles.checkbox} ${selected ? styles.checkboxOn : ''}`}>
                  {selected && <Check size={12} />}
                </div>
              </button>
            );
          })}
        </div>

        <Button
          fullWidth
          disabled={!canCreate}
          isLoading={creating}
          onClick={handleCreate}
        >
          {t('create')}
        </Button>
      </div>
    </div>
  );
}
