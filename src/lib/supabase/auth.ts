import { getSupabaseBrowserClient } from './browserClient';

const getAppUrl = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured');
  }
  return appUrl.replace(/\/$/, '');
};

export const continueWithGoogle = async () => {
  const supabase = getSupabaseBrowserClient();
  const redirectTo = `${getAppUrl()}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

export const getGooglePopupOAuthUrl = async () => {
  const supabase = getSupabaseBrowserClient();
  const redirectTo = `${getAppUrl()}/auth/callback?popup=1`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error('Failed to get Google OAuth URL');
  }

  return data.url;
};

export const signOutUser = async () => {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};
