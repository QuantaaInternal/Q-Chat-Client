import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addConversationMessages,
  createConversation,
  deleteConversation,
  getConversationMessages,
  getConversations,
  renameConversation,
} from '../../../api/apiClient';

export const conversationKeys = {
  list: ['chat-conversations'] as const,
  messages: (conversationId: string | null) =>
    ['chat-conversation-messages', conversationId] as const,
};

export const useGetConversations = ({ enabled }: { enabled: boolean }) => {
  return useQuery({
    queryKey: conversationKeys.list,
    queryFn: getConversations,
    enabled,
    retry: false,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.list,
      });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.list,
      });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.messages(variables.conversationId),
      });
    },
  });
};

export const useRenameConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: renameConversation,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.list,
      });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.messages(variables.conversationId),
      });
    },
  });
};

export const useGetConversationMessages = ({
  conversationId,
  enabled,
}: {
  conversationId: string | null;
  enabled: boolean;
}) => {
  return useQuery({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: () => getConversationMessages({ conversationId: conversationId || '' }),
    enabled: enabled && Boolean(conversationId),
    retry: false,
  });
};

export const useAddConversationMessages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addConversationMessages,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.list,
      });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.messages(variables.conversationId),
      });
    },
  });
};
