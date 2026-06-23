import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export interface NotificationCountsByCategory {
  order: number;
  review: number;
  favorite: number;
  catering: number;
  promotion: number;
  complaint: number;
  general: number;
}

export interface NotificationBadges {
  unreadCount: number;
  byCategory: NotificationCountsByCategory;
  refresh: () => Promise<void>;
}

const defaultByCategory: NotificationCountsByCategory = {
  order: 0,
  review: 0,
  favorite: 0,
  catering: 0,
  promotion: 0,
  complaint: 0,
  general: 0,
};

export function useNotificationBadges(): NotificationBadges {
  const [unreadCount, setUnreadCount] = useState(0);
  const [byCategory, setByCategory] = useState<NotificationCountsByCategory>(defaultByCategory);

  const load = useCallback(async () => {
    try {
      const [countRes, categoryRes] = await Promise.all([
        api.get<{ unread_count: number }>('/notifications/unread-count'),
        api.get<{ by_category: Partial<NotificationCountsByCategory> }>('/notifications/unread-count-by-category'),
      ]);
      setUnreadCount(countRes.data?.unread_count ?? 0);
      setByCategory({
        ...defaultByCategory,
        ...(categoryRes.data?.by_category ?? {}),
      });
    } catch {
      setUnreadCount(0);
      setByCategory(defaultByCategory);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  return { unreadCount, byCategory, refresh: load };
}
