import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastMessageAt: string | null;
}

export interface QChatStoreType {
  selectedModel: { name: string; description?: string } | null;
  setSelectedModel: (model: { name: string; description?: string }) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  conversationList: ChatMessage[];
  setConversationList: (list: ChatMessage[]) => void;

  isUserAuthenticated: boolean;
  setIsUserAuthenticated: (auth: boolean) => void;
  authUser: AuthUser | null;
  setAuthUser: (user: AuthUser | null) => void;
  activeConversationId: string | null;
  setActiveConversationId: (conversationId: string | null) => void;
  chatResetKey: number;

  isMobileView: boolean;
  setIsMobileView: (view: boolean) => void;

  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;

  isSignInDrawerOpen: boolean;
  setIsSignInDrawerOpen: (open: boolean) => void;

  setClearStore: () => void;
}

export const useQchatStore = create<QChatStoreType>()(
  persist(
    set => ({
      selectedModel: null,
      isLoading: false,
      conversationList: [],

      setSelectedModel: model => set({ selectedModel: model }),
      setIsLoading: loading => set({ isLoading: loading }),
      setConversationList: list => set({ conversationList: list }),

      isUserAuthenticated: false,
      setIsUserAuthenticated: auth => set({ isUserAuthenticated: auth }),
      authUser: null,
      setAuthUser: user => set({ authUser: user }),
      activeConversationId: null,
      setActiveConversationId: conversationId =>
        set({ activeConversationId: conversationId }),
      chatResetKey: 0,

      isMobileView: false,
      setIsMobileView: view => set({ isMobileView: view }),

      isSidebarOpen: true,
      setIsSidebarOpen: open => set({ isSidebarOpen: open }),

      isSignInDrawerOpen: false,
      setIsSignInDrawerOpen: open => set({ isSignInDrawerOpen: open }),

      setClearStore() {
        set(state => ({
          selectedModel: null,
          isLoading: false,
          conversationList: [],
          activeConversationId: null,
          chatResetKey: state.chatResetKey + 1,
        }));
      },
    }),
    {
      name: 'qchat-store',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        selectedModel: state.selectedModel,
        conversationList: state.conversationList,
        isUserAuthenticated: state.isUserAuthenticated,
        authUser: state.authUser,
        activeConversationId: state.activeConversationId,
        isMobileView: state.isMobileView,
        isSidebarOpen: state.isSidebarOpen,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<QChatStoreType>),
        isLoading: false,
        isSignInDrawerOpen: false,
      }),
    },
  ),
);
