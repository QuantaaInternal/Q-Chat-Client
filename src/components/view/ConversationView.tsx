'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { Message } from '@/types/message-type';
import useChatScroll from '@/hooks/useChatScroll';
import { useChatStream } from '@/hooks/useChatStream';
import { ApiError, buildApiUrl } from '@/lib/api';
import { syncAuth } from '../../../api/apiClient';
import {
  useAddConversationMessages,
  useCreateConversation,
  useGetConversationMessages,
} from '@/lib/queries/history.queries';
import { useQchatStore } from '@/store/qchatStore';
import MessageArea from '../chat-window/MessageArea';
import GreetingMessage from '../chat-window/GreetingMessage';
import ExampleQueries from '../chat-window/ExampleQueries';
import NavbarItemsContainer from '../chat-window/NavbarItemsContainer';
import AnimatedFileTextarea from '../chat-window/AnimatedFileTextarea';

const mapHistoryToUiMessages = (history: {
  data: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
  }>;
}) => {
  return history.data
    .filter(message => message.role === 'user' || message.role === 'assistant')
    .map((message, index) => ({
      id: index + 1,
      content: message.content,
      isUser: message.role === 'user',
      type: 'message',
      isLoading: false,
    }));
};

const ConversationView = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [prefill, setPrefill] = useState<string>('');
  const lastAuthSyncAtRef = useRef<number>(0);
  const autoScrollRef = useChatScroll(messages);

  const {
    selectedModel,
    isLoading,
    isUserAuthenticated,
    activeConversationId,
    setActiveConversationId,
    chatResetKey,
    setIsSignInDrawerOpen,
  } = useQchatStore();

  const { startStream } = useChatStream({
    baseURL: buildApiUrl('/chat-stream'),
  });
  const { mutateAsync: createConversationAsync } = useCreateConversation();
  const { mutateAsync: addMessagesAsync } = useAddConversationMessages();

  const { data: conversationMessages } = useGetConversationMessages({
    conversationId: activeConversationId,
    enabled: isUserAuthenticated,
  });

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    if (!conversationMessages) return;
    setMessages(mapHistoryToUiMessages(conversationMessages));
  }, [activeConversationId, conversationMessages]);

  useEffect(() => {
    setMessages([]);
    setCurrentMessage('');
    setPrefill('');
  }, [chatResetKey]);

  const ensureConversationId = async (firstUserMessage: string) => {
    if (activeConversationId) return activeConversationId;

    const createdConversation = await createConversationAsync({
      title: firstUserMessage.slice(0, 80),
    });
    setActiveConversationId(createdConversation.id);
    return createdConversation.id;
  };

  const ensureBackendAuthSynced = async () => {
    const syncCooldownMs = 10_000;
    const now = Date.now();
    if (now - lastAuthSyncAtRef.current < syncCooldownMs) {
      return;
    }

    await syncAuth();
    lastAuthSyncAtRef.current = now;
  };

  const onSubmit = async (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    if (!isUserAuthenticated) {
      setIsSignInDrawerOpen(true);
      toast.error('Please log in to save and continue your chats.');
      return;
    }

    try {
      await ensureBackendAuthSynced();
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setIsSignInDrawerOpen(true);
      }
      toast.error(
        error instanceof Error
          ? error.message
          : 'Authentication failed. Please log in again.',
      );
      return;
    }

    const modelName = selectedModel?.name || '';
    if (!modelName) {
      toast.error('Please select a model before sending your message.');
      return;
    }

    let conversationIdForStream: string;
    try {
      conversationIdForStream = await ensureConversationId(trimmedValue);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create a chat conversation.',
      );
      return;
    }

    const newMessageId =
      messages.length > 0 ? Math.max(...messages.map(msg => msg.id)) + 1 : 1;

    setMessages(prev => [
      ...prev,
      {
        id: newMessageId,
        content: trimmedValue,
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

    const resolvedConversationIdRef = { current: conversationIdForStream };
    const persistMessages = async ({
      userMessage,
      assistantMessage,
    }: {
      userMessage: string;
      assistantMessage?: string;
    }) => {
      const targetConversationId = resolvedConversationIdRef.current;
      if (!targetConversationId) return;

      const payloadMessages: Array<{
        role: 'user' | 'assistant';
        content: string;
        metadata: Record<string, unknown>;
      }> = [
        {
          role: 'user',
          content: userMessage,
          metadata: {},
        },
      ];

      if (assistantMessage && assistantMessage.trim()) {
        payloadMessages.push({
          role: 'assistant',
          content: assistantMessage,
          metadata: {},
        });
      }

      try {
        await addMessagesAsync({
          conversationId: targetConversationId,
          messages: payloadMessages,
        });
      } catch (error) {
        console.error('Failed to persist chat messages:', error);
      }
    };

    void startStream({
      userInput: trimmedValue,
      checkpointId: conversationIdForStream,
      aiResponseId,
      modelName,
      updateMessage: setMessages,
      setCheckpointId: latestCheckpointId => {
        setActiveConversationId(latestCheckpointId);
        resolvedConversationIdRef.current = latestCheckpointId;
      },
      onComplete: async ({ content }) => {
        await persistMessages({
          userMessage: trimmedValue,
          assistantMessage: content,
        });
      },
      onError: async () => {
        await persistMessages({
          userMessage: trimmedValue,
        });
      },
    });
  };

  const placeholders = useMemo(
    () => [
      'What is a mutual fund?',
      'How do I start investing with ₹500?',
      'What’s the difference between SIP and lumpsum?',
      'Is it better to invest in FD or mutual funds?',
      'Are mutual funds safe?',
    ],
    [],
  );

  return (
    <div className="relative flex h-screen max-h-[calc(100vh-0px)] flex-1 bg-[#0D0D0D] px-4 md:max-h-full lg:max-h-full lg:px-0">
      <div className="pointer-events-none absolute inset-0 h-full w-auto bg-[url(/images/Background.svg)] bg-size-[auto_140vh] bg-center bg-no-repeat opacity-70 blur-3xl" />
      <AnimatePresence>
        <motion.div
          transition={{ duration: 0.5 }}
          animate={{ justifyContent: messages.length > 0 ? 'end' : 'center' }}
          className={`relative flex h-full w-full flex-1 flex-col items-center gap-4 overflow-y-auto ${
            messages.length > 0 ? 'justify-end' : 'justify-center'
          } `}
        >
          <div className="absolute top-0 z-10 w-full bg-[#0D0D0D] lg:bg-transparent">
            <NavbarItemsContainer />
          </div>
          <div
            className={`relative flex w-full flex-col items-center lg:px-1 ${
              messages.length > 0 ? 'h-full gap-0 pb-4' : 'h-auto gap-5 pb-0 lg:gap-12'
            }`}
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
                onSubmit={value => {
                  void onSubmit(value);
                }}
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
