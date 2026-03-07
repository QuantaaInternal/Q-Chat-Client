import React, { useState } from 'react';
import SignUpButton from './SignUpButton';
import LanguageSelector from './LanguageSelector';
import ModelSelectionDropDown from './ModelSelection';
import { useQchatStore } from '@/store/qchatStore';
import { useGetCurrentModel } from '@/lib/queries/chat.queries';
import { Branding } from '../branding/branding';
import { Button } from '../ui/button';
import { signOutUser } from '@/lib/supabase/auth';

const NavbarItemsContainer = () => {
  const defaultLanguage = {
    language: 'English',
    flag: 'https://kapowaz.github.io/circle-flags/flags/in.svg',
  };

  const {
    selectedModel,
    setSelectedModel,
    setIsSidebarOpen,
    isSidebarOpen,
    authUser,
    isUserAuthenticated,
  } = useQchatStore();
  const { data: modelList } = useGetCurrentModel({ enabled: isUserAuthenticated });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeLanguage, setActiveLanguage] = useState(defaultLanguage);

  return (
    <div className="flex w-full items-center justify-between px-0 py-4 lg:px-5 lg:py-3">
      <span className="flex md:hidden lg:hidden">
        <Branding onClickFn={() => setIsSidebarOpen(!isSidebarOpen)} />
      </span>

      <span className="hidden md:flex lg:flex">
        <ModelSelectionDropDown
          modelData={modelList?.data}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </span>
      <div className="flex items-center space-x-4 lg:space-x-3">
        <LanguageSelector selectedLanguage={activeLanguage} />
        {authUser ? <UserBadge /> : <SignUpButton />}
      </div>
    </div>
  );
};

export default NavbarItemsContainer;

const UserBadge = () => {
  const {
    authUser,
    setAuthUser,
    setIsUserAuthenticated,
    setClearStore,
  } = useQchatStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  if (!authUser) return null;

  const initials =
    authUser.fullName
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(name => name[0]?.toUpperCase())
      .join('') || authUser.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="flex items-center gap-2 rounded-full border border-[#404040] bg-[#1A1A1A]/90 px-2.5 py-1.5">
      {authUser.avatarUrl ? (
        <img
          src={authUser.avatarUrl}
          alt={authUser.fullName || authUser.email || 'User avatar'}
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : (
        <div className="font-briColage flex h-7 w-7 items-center justify-center rounded-full bg-[#66DE8B] text-xs font-bold text-[#1F2C1E]">
          {initials}
        </div>
      )}
      <div className="max-w-28">
        <p className="font-briColage truncate text-xs leading-4 font-semibold text-[#D9D9D9]">
          {authUser.fullName || 'Qchat User'}
        </p>
        <p className="font-briColage truncate text-[11px] leading-4 text-[#A1A1A1]">
          {authUser.email || ''}
        </p>
      </div>
      <Button
        onClick={async () => {
          if (isLoggingOut) return;

          setLogoutError(null);
          setIsLoggingOut(true);
          try {
            await signOutUser();
            setAuthUser(null);
            setIsUserAuthenticated(false);
            setClearStore();
          } catch (error) {
            setLogoutError(
              error instanceof Error ? error.message : 'Failed to log out',
            );
          } finally {
            setIsLoggingOut(false);
          }
        }}
        disabled={isLoggingOut}
        className="font-briColage h-7 rounded-full bg-[#2B2B2B] px-3 text-[11px] font-semibold text-[#EFEFEF] hover:bg-[#3A3A3A] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </Button>
      {logoutError && (
        <p className="font-briColage max-w-28 text-[10px] leading-3 text-red-400">
          {logoutError}
        </p>
      )}
    </div>
  );
};
