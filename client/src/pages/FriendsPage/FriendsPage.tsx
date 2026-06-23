import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetchFriends } from '@/shared/hooks/useFetchFriends';
import { Avatar, Button, Skeleton } from '@/shared/ui';
import styles from './FriendsPage.module.css';

export function FriendsPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { friends, incoming, suggested, isLoading, sendRequest, acceptRequest, rejectRequest, removeFriend } = useFetchFriends();

  return (
    <main className={styles.page}>
      {isLoading && (
        <>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('friends.title')}</h2>
            <div className={styles.list}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.card}>
                  <Skeleton width={48} height={48} borderRadius="50%" />
                  <div className={styles.cardInfo}>
                    <Skeleton width="40%" height={16} />
                    <Skeleton width="60%" height={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('friends.requests')}</h2>
            <div className={styles.list}>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className={styles.card}>
                  <Skeleton width={48} height={48} borderRadius="50%" />
                  <div className={styles.cardInfo}>
                    <Skeleton width="40%" height={16} />
                    <Skeleton width="60%" height={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('friends.suggestions')}</h2>
            <div className={styles.list}>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className={styles.card}>
                  <Skeleton width={48} height={48} borderRadius="50%" />
                  <div className={styles.cardInfo}>
                    <Skeleton width="40%" height={16} />
                    <Skeleton width="60%" height={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!isLoading && (
        <>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('friends.title')}</h2>
            {friends.length === 0 ? (
              <div className={styles.empty}>{t('friends.empty')}</div>
            ) : (
              <div className={styles.list}>
                {friends.map((f) => (
                  <div key={f.id} className={styles.card} onClick={() => navigate(`/profile/${f.id}`)}>
                    <Avatar src={f.avatarUrl} name={f.displayName} size="lg" />
                    <div className={styles.cardInfo}>
                      <span className={styles.cardName}>{f.displayName}</span>
                      <span className={styles.cardStatus}>{t('friends.status_friend')}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); removeFriend(f.id); }}
                    >
                      {t('friends.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {incoming.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('friends.requests')}</h2>
              <div className={styles.list}>
                {incoming.map((u) => (
                  <div key={u.id} className={styles.card} onClick={() => navigate(`/profile/${u.id}`)}>
                    <Avatar src={u.avatarUrl} name={u.displayName} size="lg" />
                    <div className={styles.cardInfo}>
                      <span className={styles.cardName}>{u.displayName}</span>
                      <span className={styles.cardStatus}>{t('friends.status_wants_to_be')}</span>
                    </div>
                    <div className={styles.cardActions}>
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); acceptRequest(u.id); }}>
                        {t('friends.accept')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); rejectRequest(u.id); }}>
                        {t('friends.reject')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggested.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('friends.suggestions')}</h2>
              <div className={styles.list}>
                {suggested.map((u) => (
                  <div key={u.id} className={styles.card} onClick={() => navigate(`/profile/${u.id}`)}>
                    <Avatar src={u.avatarUrl} name={u.displayName} size="lg" />
                    <div className={styles.cardInfo}>
                      <span className={styles.cardName}>{u.displayName}</span>
                      <span className={styles.cardStatus}>{t('friends.status_not_in_friends')}</span>
                    </div>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); sendRequest(u.id); }}>
                      {t('friends.add')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
