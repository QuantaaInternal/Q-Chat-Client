'use client';

import { useEffect } from 'react';
import { useQchatStore } from '@/store/qchatStore';
import { getSupabaseBrowserClient } from '@/lib/supabase/browserClient';
import { getMe, syncAuth } from '../../../api/apiClient';
import { ApiError } from '@/lib/api';

const syncInFlightByUser = new Map<string, Promise<void>>();
const syncCooldownMs = 10_000;
const lastSyncAtByUser = new Map<string, number>();

const isAuthError = (error: unknown) => {
  return (
    error instanceof ApiError && (error.status === 401 || error.status === 403)
  );
};

const ensureAuthSynced = async (userId: string) => {
  const lastSyncedAt = lastSyncAtByUser.get(userId);
  if (lastSyncedAt && Date.now() - lastSyncedAt < syncCooldownMs) {
    return;
  }

  const existingSyncPromise = syncInFlightByUser.get(userId);
  if (existingSyncPromise) {
    await existingSyncPromise;
    return;
  }

  const syncPromise = (async () => {
    await syncAuth();
    lastSyncAtByUser.set(userId, Date.now());
  })();

  syncInFlightByUser.set(userId, syncPromise);
  try {
    await syncPromise;
  } finally {
    syncInFlightByUser.delete(userId);
  }
};

const AuthSessionSync = () => {
  const { setAuthUser, setIsUserAuthenticated } = useQchatStore();

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    const clearAuthState = () => {
      if (!isMounted) return;
      setAuthUser(null);
      setIsUserAuthenticated(false);
    };

    const hydrateUser = async (userId: string) => {
      try {
        await ensureAuthSynced(userId);
      } catch (error) {
        if (isAuthError(error)) {
          clearAuthState();
          return;
        }
        console.error('Auth sync failed:', error);
      }

      try {
        const data = await getMe();
        if (!isMounted) return;

        const fullName = data.profile?.full_name ?? data.user.full_name ?? null;
        const avatarUrl =
          data.profile?.avatar_url ?? data.user.avatar_url ?? null;

        setAuthUser({
          id: data.user.user_id,
          email: data.user.email ?? data.profile?.email ?? null,
          fullName,
          avatarUrl,
        });
        setIsUserAuthenticated(true);
      } catch (error) {
        if (isAuthError(error)) {
          clearAuthState();
          return;
        }
        console.error('Failed to hydrate auth user:', error);
      }
    };

    const syncFromSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.user?.id) {
        clearAuthState();
        return;
      }

      await hydrateUser(data.session.user.id);
    };

    void syncFromSession();
    const handleAuthUpdated = () => {
      void syncFromSession();
    };
    window.addEventListener('qchat:auth-updated', handleAuthUpdated);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user?.id) {
        clearAuthState();
        return;
      }

      void hydrateUser(session.user.id);
    });

    return () => {
      isMounted = false;
      window.removeEventListener('qchat:auth-updated', handleAuthUpdated);
      subscription.unsubscribe();
    };
  }, [setAuthUser, setIsUserAuthenticated]);

  return null;
};

export default AuthSessionSync;
