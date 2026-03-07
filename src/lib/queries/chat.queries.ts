import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getCurrentModel,
  getModelNames,
  getResponseFromModel,
} from '../../../api/apiClient';

export const useGetModelNames = () => {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const data = await getModelNames();
      return data;
    },
  });
};

export const useGetCurrentModel = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['currentModel'],
    queryFn: async () => {
      const data = await getCurrentModel();
      return data;
    },
    enabled,
    retry: false,
  });
};

export const useGetResponseFromModel = () => {
  return useMutation({
    mutationFn: async ({
      selectedModel,
      message,
    }: {
      selectedModel: string;
      message: string;
    }) => {
      const data = await getResponseFromModel({ selectedModel, message });
      return data;
    },
  });
};
