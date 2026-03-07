import { apiRequest, protectedApiRequest } from '../src/lib/api';

type AuthSyncResponse = {
  id: string;
  email: string | null;
  name: string | null;
  auth_provider: string | null;
};

type ModelOption = {
  name: string;
  description?: string;
};

type ModelListResponse = {
  data: ModelOption[];
};

export type MeResponse = {
  user: {
    user_id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
};

export type ConversationResponse = {
  id: string;
  title: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_message_at: string | null;
};

export type ConversationListResponse = {
  data: ConversationResponse[];
};

export type ConversationMessageResponse = {
  id: string;
  conversation_id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

export type ConversationMessageListResponse = {
  data: ConversationMessageResponse[];
};

// get all active model names and desc
export const getModelNames = async () => {
  return apiRequest<ModelListResponse>('/qchat/models');
};

export const getCurrentModel = async () => {
  return protectedApiRequest<ModelListResponse>('/getModelName');
};

// get response from the llm
export const getResponseFromModel = async ({
  selectedModel,
  message,
}: {
  selectedModel: string;
  message: string;
}) => {
  return apiRequest('/qchat/conversations', {
    method: 'POST',
    body: {
      modelName: selectedModel,
      message: message,
    },
  });
};

export const syncAuth = async () => {
  return protectedApiRequest<AuthSyncResponse>('/auth/sync', {
    method: 'POST',
  });
};

export const getMe = async () => {
  return protectedApiRequest<MeResponse>('/me', {
    method: 'GET',
  });
};

export const getConversations = async () => {
  return protectedApiRequest<ConversationListResponse>('/conversations?limit=100', {
    method: 'GET',
  });
};

export const createConversation = async ({ title }: { title?: string }) => {
  return protectedApiRequest<ConversationResponse>('/conversations', {
    method: 'POST',
    body: {
      title: title?.trim() || null,
    },
  });
};

export const deleteConversation = async ({
  conversationId,
}: {
  conversationId: string;
}) => {
  return protectedApiRequest<void>(`/conversations/${conversationId}`, {
    method: 'DELETE',
  });
};

export const renameConversation = async ({
  conversationId,
  title,
}: {
  conversationId: string;
  title: string;
}) => {
  return protectedApiRequest<ConversationResponse>(`/conversations/${conversationId}`, {
    method: 'PATCH',
    body: {
      title,
    },
  });
};

export const getConversationMessages = async ({
  conversationId,
}: {
  conversationId: string;
}) => {
  return protectedApiRequest<ConversationMessageListResponse>(
    `/conversations/${conversationId}/messages?limit=500`,
    {
      method: 'GET',
    },
  );
};

export const addConversationMessages = async ({
  conversationId,
  messages,
}: {
  conversationId: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    metadata?: Record<string, unknown> | null;
  }>;
}) => {
  return protectedApiRequest<ConversationMessageListResponse>(
    `/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: {
        messages,
      },
    },
  );
};
