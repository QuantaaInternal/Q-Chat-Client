'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { continueWithGoogle } from '@/lib/supabase/auth';

const LoginPageContent = () => {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(searchParams.get('error'));

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      await continueWithGoogle();
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : 'Failed to continue with Google',
      );
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#404040] bg-[#151515]/90 p-8 backdrop-blur-sm">
        <h1 className="font-briColage text-center text-2xl font-bold text-[#EFEFEF] lg:text-3xl">
          Log in to Qchat
        </h1>
        <p className="font-briColage mt-3 text-center text-sm text-[#A1A1A1]">
          Continue with Google to unlock your personalized experience.
        </p>

        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-3xl bg-[#EFEFEF] text-[#404040] hover:bg-[#EFEFEF]/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Image src="/logo/google.svg" alt="Google" width={20} height={20} />
          <span className="font-briColage text-base font-bold">
            {isLoading ? 'Connecting...' : 'Continue with Google'}
          </span>
        </Button>

        {error && (
          <p className="font-briColage mt-4 text-center text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    </main>
  );
};

const LoginPage = () => {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
};

export default LoginPage;
