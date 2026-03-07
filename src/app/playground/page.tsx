'use client';

import AnimatedFileTextarea, {
  SearchEnebledButton,
  SubmitButton,
} from '@/components/chat-window/AnimatedFileTextarea';
import LanguageSelector from '@/components/chat-window/LanguageSelector';
import ModelSelectionDropDown from '@/components/chat-window/ModelSelection';
import FileUploader from '@/components/ui/FileUploader';
import ConversationLimitAlert from '@/components/chat-window/ConversationLimitAlert';
import { ResponseLoader } from '@/components/ui/loader';
import { useGetCurrentModel } from '@/lib/queries/chat.queries';
import { useQchatStore } from '@/store/qchatStore';
import { useState } from 'react';

const Page = () => {
  const defaultLanguage = {
    language: 'English',
    flag: 'https://kapowaz.github.io/circle-flags/flags/in.svg',
  };

  const { selectedModel, setSelectedModel, isUserAuthenticated } = useQchatStore();
  const { data: modelList } = useGetCurrentModel({
    enabled: isUserAuthenticated,
  });

  const [activeLanguage, setActiveLanguage] = useState(defaultLanguage);

  const availableLanguages = [
    {
      language: 'English',
      flag: 'https://kapowaz.github.io/circle-flags/flags/in.svg',
    },
    {
      language: 'Hindi',
      flag: 'https://kapowaz.github.io/circle-flags/flags/in.svg',
    },
    {
      language: 'Português',
      flag: 'https://kapowaz.github.io/circle-flags/flags/br.svg',
    },
    {
      language: 'Japanese',
      flag: 'https://kapowaz.github.io/circle-flags/flags/jp.svg',
    },
    {
      language: 'Spanish',
      flag: 'https://kapowaz.github.io/circle-flags/flags/es.svg',
    },
    {
      language: 'German',
      flag: 'https://kapowaz.github.io/circle-flags/flags/de.svg',
    },
  ];

  const handleSelectedFile = (file: File) => {
    console.log('Selected file:', file);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-10 bg-black">
      <h1 className="font-briColage w-full text-center text-3xl leading-10 font-semibold">
        Playground
      </h1>
      <div className="flex items-center justify-center space-x-10">
        <ModelSelectionDropDown
          modelData={modelList?.data}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
        <FileUploader onFileSelected={handleSelectedFile} />
        <SearchEnebledButton />
        <SubmitButton disabled={false} />
        <LanguageSelector
          selectedLanguage={activeLanguage}
          availableLanguages={availableLanguages}
          onLanguageChange={setActiveLanguage}
        />
        <div className="max-w-2xl rounded-3xl bg-[#404040]/30 px-5 py-[10px]">
          <ResponseLoader />
        </div>
      </div>
      <TextAreaSection />
      <ConversationLimitAlert remainingConversations={3} />
    </div>
  );
};

export default Page;

const TextAreaSection = () => {
  const placeholders = [
    'What is a mutual fund?',
    'How do I start investing with ₹500?',
    'What’s the difference between SIP and lumpsum?',
    'Is it better to invest in FD or mutual funds?',
    'Are mutual funds safe?',
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentMessage, setCurrentMessage] = useState('');

  return (
    <div className="w-full max-w-[820px]">
      <AnimatedFileTextarea
        placeholders={placeholders}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setCurrentMessage(e.target.value)
        }
        onSubmit={(value: string) => {
          if (!value.trim()) return;
        }}
      />
    </div>
  );
};
