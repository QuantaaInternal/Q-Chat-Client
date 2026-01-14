'use client';
// import useChatScroll from '@/hooks/useChatScroll';
import { useQchatStore } from '@/store/qchatStore';
import { useEffect, useState } from 'react';
import { useChatStream } from '@/hooks/useChatStream';
import { getApiBaseUrl } from '../../../api/axios';
import { Message } from '@/types/message-type';
import MessageArea from '../chat-window/MessageArea';
import GreetingMessage from '../chat-window/GreetingMessage';
import ExampleQueries from '../chat-window/ExampleQueries';
import useChatScroll from '@/hooks/useChatScroll';
import { AnimatePresence, motion } from 'motion/react';
import NavbarItemsContainer from '../chat-window/NavbarItemsContainer';
import AnimatedFileTextarea from '../chat-window/AnimatedFileTextarea';

const ConversationView = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentMessage, setCurrentMessage] = useState('');
  const [checkpointId, setCheckpointId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<string>('');
  const autoScrollRef = useChatScroll(messages);

  const { startStream } = useChatStream({
    baseURL: `${getApiBaseUrl()}/chat-stream`,
  });

  const {
    selectedModel,
    // setConversationList,
    setClearStore,
    isLoading,
  } = useQchatStore();

  useEffect(() => {
    setClearStore();
  }, [setClearStore]);

  const onSubmit = (value: string) => {
    if (!value.trim()) return;

    const newMessageId =
      messages.length > 0 ? Math.max(...messages.map(msg => msg.id)) + 1 : 1;

    setMessages(prev => [
      ...prev,
      {
        id: newMessageId,
        content: value,
        isUser: true,
        type: 'message',
        isLoading: false,
      },
    ]);
    setCurrentMessage('');

    const aiResponseId = newMessageId + 1;
    setMessages(prev => [
      ...prev,
      {
        id: aiResponseId,
        content: '',
        isUser: false,
        type: 'message',
        isLoading: true,
        searchInfo: { stages: [], query: '', urls: [] },
      },
    ]);

    startStream({
      userInput: value,
      checkpointId,
      aiResponseId,
      modelName: selectedModel?.name || '',
      updateMessage: setMessages,
      setCheckpointId,
    });
  };

  const placeholders = [
    'What is a mutual fund?',
    'How do I start investing with ₹500?',
    'What’s the difference between SIP and lumpsum?',
    'Is it better to invest in FD or mutual funds?',
    'Are mutual funds safe?',
  ];

  return (
    <div className="relative flex h-screen max-h-[calc(100vh-0px)] flex-1 bg-[#0D0D0D] px-4 md:max-h-full lg:max-h-full lg:px-0">
      <div className="pointer-events-none absolute inset-0 h-full w-auto bg-[url(/images/Background.svg)] bg-size-[auto_140vh] bg-center bg-no-repeat opacity-70 blur-3xl" />
      <AnimatePresence>
        <motion.div
          transition={{ duration: 0.5 }}
          animate={{ justifyContent: messages.length > 0 ? 'end' : 'center' }}
          className={`relative flex h-full w-full flex-1 flex-col items-center gap-4 overflow-y-auto ${messages.length > 0 ? 'justify-end' : 'justify-center'} `}
        >
          <div className="absolute top-0 z-10 w-full bg-[#0D0D0D] lg:bg-transparent">
            <NavbarItemsContainer />
          </div>
          <div
            className={`relative flex w-full flex-col items-center lg:px-1 ${messages.length > 0 ? 'h-full gap-0 pb-4' : 'h-auto gap-5 pb-0 lg:gap-12'}`}
          >
            <div
              className="scrolling-touch w-full flex-1 overflow-y-auto pt-8"
              ref={autoScrollRef}
            >
              {messages.length < 1 ? (
                <div className="flex w-full justify-center">
                  <div className="flex w-full max-w-[820px] items-start px-3">
                    <GreetingMessage />
                  </div>
                </div>
              ) : (
                <>
                  <div className="sticky top-7 left-0 z-20 lg:top-16 lg:hidden">
                    <div className="pointer-events-none h-12 w-full bg-gradient-to-b from-[#0D0D0D] to-transparent" />
                  </div>
                  <div className="mx-auto flex w-full max-w-sm flex-col md:max-w-[548px] lg:max-w-[936px]">
                    <MessageArea messages={messages} />
                  </div>
                </>
              )}
            </div>
            <div className="flex w-full max-w-[820px] flex-col gap-4">
              <AnimatedFileTextarea
                placeholders={placeholders}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCurrentMessage(e.target.value)
                }
                onSubmit={onSubmit}
                isLoading={isLoading}
                prefill={prefill}
              />
              {messages.length < 1 && (
                <div className="px-2 lg:px-3">
                  <ExampleQueries onSelect={setPrefill} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ConversationView;
