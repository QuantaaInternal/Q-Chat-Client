import React from 'react';

import Image from 'next/image';
import { Button } from '../ui/button';
import { Credenza, CredenzaContent, CredenzaTitle } from '../ui/credenza';
import ShaderBG from '../motion-primitives/shader-bg';
import { useQchatStore } from '@/store/qchatStore';
import { continueWithGoogle, getGooglePopupOAuthUrl } from '@/lib/supabase/auth';

const SignInDrawer = ({
  open,
  setOpen,
}: {
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { isMobileView, setIsSignInDrawerOpen } = useQchatStore();
  const [isSyncingGoogle, setIsSyncingGoogle] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  const openCenteredPopup = (url: string) => {
    const width = 520;
    const height = 680;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    return window.open(
      url,
      'qchat_google_oauth',
      `popup=yes,width=${width},height=${height},left=${Math.max(0, left)},top=${Math.max(0, top)},resizable=yes,scrollbars=yes`,
    );
  };

  const continueWithGooglePopup = async () => {
    const oauthUrl = await getGooglePopupOAuthUrl();
    const popup = openCenteredPopup(oauthUrl);

    if (!popup) {
      await continueWithGoogle();
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('Google sign-in timed out. Please try again.'));
      }, 120000);

      const interval = window.setInterval(() => {
        if (popup.closed) {
          cleanup();
          reject(new Error('Sign-in window was closed before completion.'));
        }
      }, 500);

      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        const data = event.data as
          | { type?: string; ok?: boolean; error?: string | null }
          | undefined;
        if (!data || data.type !== 'qchat:oauth') return;

        cleanup();
        if (data.ok) {
          window.dispatchEvent(new Event('qchat:auth-updated'));
          setIsSignInDrawerOpen(false);
          resolve();
          return;
        }
        reject(new Error(data.error || 'Google sign-in failed.'));
      };

      const cleanup = () => {
        window.clearTimeout(timeout);
        window.clearInterval(interval);
        window.removeEventListener('message', onMessage);
      };

      window.addEventListener('message', onMessage);
    });
  };

  const handleGoogleContinue = async () => {
    if (isSyncingGoogle) return;
    setSyncError(null);
    setIsSyncingGoogle(true);
    try {
      await continueWithGooglePopup();
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : 'Failed to sign in with Google',
      );
    } finally {
      setIsSyncingGoogle(false);
    }
  };
  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaContent className="flex h-[60vh] w-screen max-w-screen items-center overflow-hidden bg-[#0D0D0D] backdrop-blur-3xl lg:h-screen lg:justify-center lg:rounded-none">
        <ShaderBG />
        {isMobileView && (
          <div className="pointer-events-none absolute inset-0 h-full w-auto bg-[url(/images/sign-up.svg)] bg-cover bg-center bg-no-repeat" />
        )}
        <div className="z-10 my-6 flex h-full w-full max-w-sm flex-col space-y-8 lg:h-max lg:max-w-[400px] lg:space-y-6">
          {/* header */}
          <span className="flex flex-col items-center space-y-5 lg:space-y-4">
            <CredenzaTitle className="font-briColage cursor-default overflow-clip bg-gradient-to-br from-[#3DDBB0] to-[#94E162] bg-clip-text text-[26px] leading-6 font-bold text-transparent lg:text-[32px] lg:leading-10 lg:font-semibold">
              Log in or Sign up
            </CredenzaTitle>

            <h3 className="font-briColage cursor-default text-center text-base leading-6 font-semibold text-[#D9D9D9] lg:text-[20px]">
              Unlock the full potential of Qchat{' '}
              <br className="hidden lg:block" />
              get latest update and more
            </h3>
          </span>
          <GoogleLoginOption
            onGoogleContinue={handleGoogleContinue}
            isGoogleLoading={isSyncingGoogle}
            errorMessage={syncError}
          />
        </div>
      </CredenzaContent>
    </Credenza>
  );
};

export default SignInDrawer;

const GoogleLoginOption = ({
  onGoogleContinue,
  isGoogleLoading,
  errorMessage,
}: {
  onGoogleContinue: () => void;
  isGoogleLoading: boolean;
  errorMessage: string | null;
}) => {
  return (
    <div className="boreder flex w-full flex-col items-center gap-4 border-red-500">
      <span className="flex h-10 w-full flex-col items-center justify-between gap-4 lg:h-12">
        <Button
          onClick={onGoogleContinue}
          disabled={isGoogleLoading}
          className="flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-3xl bg-[#EFEFEF] duration-300 ease-in-out hover:bg-[#EFEFEF] hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Image
            src="/logo/google.svg"
            alt="Google"
            width={20}
            height={20}
            className="h-4 w-4 lg:h-5 lg:w-5"
          />
          <p className="font-briColage text-base leading-5 font-bold text-[#404040] lg:text-lg">
            {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
          </p>
        </Button>
      </span>
      {errorMessage && (
        <p className="font-briColage text-center text-xs leading-5 text-red-400 lg:text-sm">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
