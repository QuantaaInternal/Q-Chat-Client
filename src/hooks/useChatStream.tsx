import { Message, SearchInfo } from '@/types/message-type';
import { parseTokenPerMin } from '@/utils/helper';
import { useState } from 'react';
import { toast } from 'sonner';
import { getAccessToken } from '@/lib/api';

interface StreamOptions {
  userInput: string;
  checkpointId: string | null;
  aiResponseId: number;
  modelName: string;
  updateMessage: (updater: (prev: Message[]) => Message[]) => void;
  setCheckpointId: (id: string) => void;
  onComplete?: (payload: {
    content: string;
    searchInfo: SearchInfo | null;
    uiContent: string | null;
  }) => void | Promise<void>;
  onError?: (error: unknown) => void;
}

const parseSseDataBlocks = (
  buffer: string,
): { events: string[]; remaining: string } => {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const chunks = normalized.split('\n\n');

  if (chunks.length === 1) {
    return { events: [], remaining: normalized };
  }

  const remaining = chunks.pop() || '';
  const events = chunks
    .map(eventBlock =>
      eventBlock
        .split('\n')
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trimStart())
        .join('\n'),
    )
    .filter(Boolean);

  return { events, remaining };
};

const parseStreamError = (rawError: string): { message: string; code?: number } => {
  const trimmed = rawError.trim();
  if (!trimmed) {
    return { message: '' };
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      error?: { message?: unknown; code?: unknown };
      message?: unknown;
      code?: unknown;
    };

    const parsedMessage =
      (typeof parsed.error?.message === 'string' && parsed.error.message) ||
      (typeof parsed.message === 'string' && parsed.message) ||
      trimmed;

    const rawCode = parsed.error?.code ?? parsed.code;
    const parsedCode =
      typeof rawCode === 'number'
        ? rawCode
        : typeof rawCode === 'string'
          ? Number(rawCode)
          : undefined;

    return {
      message: parsedMessage,
      code: Number.isFinite(parsedCode) ? parsedCode : undefined,
    };
  } catch {
    return { message: trimmed };
  }
};

const isAuthError = (message: string, code?: number) => {
  if (code === 401 || code === 403) {
    return true;
  }

  return /user not found|unauthorized|forbidden|invalid token|not authenticated/i.test(
    message,
  );
};

export const useChatStream = ({ baseURL }: { baseURL: string }) => {
  const [streaming, setStreaming] = useState(false);

  const startStream = async ({
    userInput,
    checkpointId,
    aiResponseId,
    modelName,
    updateMessage,
    setCheckpointId,
    onComplete,
    onError,
  }: StreamOptions) => {
    let streamedContent = '';
    let searchData: SearchInfo | null = null;
    let latestUiContent: string | null = null;
    let hasReceivedContent = false;
    let streamEnded = false;

    let url = `${baseURL}?message=${encodeURIComponent(userInput)}`;
    if (checkpointId) {
      url += `&checkpoint_id=${encodeURIComponent(checkpointId)}`;
    }
    url += `&model_name=${encodeURIComponent(modelName)}`;

    setStreaming(true);

    try {
      const token = await getAccessToken();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          responseText || `Stream request failed with status ${response.status}`,
        );
      }

      if (!response.body) {
        throw new Error('Missing response stream body.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';

      const handleStreamData = (rawData: string) => {
        try {
          const data = JSON.parse(rawData);

          if (data.type === 'checkpoint') {
            setCheckpointId(data.checkpoint_id);
          }

          else if (data.type === 'content') {
            streamedContent += data.content;
            hasReceivedContent = true;

            updateMessage(prev =>
              prev.map(msg =>
                msg.id === aiResponseId
                  ? {
                      ...msg,
                      content: streamedContent,
                      isLoading: false,
                    }
                  : msg,
              ),
            );
          }

          else if (data.type === 'ui_start') {
            updateMessage(prev =>
              prev.map(msg =>
                msg.id === aiResponseId
                  ? {
                      ...msg,
                      ui: { loading: true, tool: 'c1_ui_generate', content: null },
                      isLoading: false,
                    }
                  : msg,
              ),
            );
          }

          else if (data.type === 'ui_content') {
            const uiContent =
              typeof data.content === 'string'
                ? data.content
                : JSON.stringify(data.content);
            latestUiContent = uiContent;

            updateMessage(prev =>
              prev.map(msg =>
                msg.id === aiResponseId
                  ? {
                      ...msg,
                      ui: {
                        loading: false,
                        tool: 'c1_ui_generate',
                        content: uiContent,
                      },
                      isLoading: false,
                    }
                  : msg,
              ),
            );
          }

          else if (data.type === 'search_start') {
            const newSearchInfo: SearchInfo = {
              stages: ['searching'],
              query: data.query,
              urls: [],
            };
            searchData = newSearchInfo;

            updateMessage(prev =>
              prev.map(msg =>
                msg.id === aiResponseId
                  ? {
                      ...msg,
                      content: streamedContent,
                      searchInfo: newSearchInfo,
                      isLoading: false,
                    }
                  : msg,
              ),
            );
          }

          else if (data.type === 'search_results') {
            const urls =
              typeof data.urls === 'string' ? JSON.parse(data.urls) : data.urls;

            const newSearchInfo: SearchInfo = {
              stages: searchData ? [...searchData.stages, 'reading'] : ['reading'],
              query: searchData?.query || '',
              urls,
            };

            searchData = newSearchInfo;

            updateMessage(prev =>
              prev.map(msg =>
                msg.id === aiResponseId
                  ? {
                      ...msg,
                      searchInfo: newSearchInfo,
                      isLoading: false,
                    }
                  : msg,
              ),
            );
          }

          else if (data.type === 'search_error') {
            const newSearchInfo = {
              stages: searchData ? [...searchData.stages, 'error'] : ['error'],
              query: searchData?.query || '',
              error: data.error,
              urls: [],
            };
            searchData = newSearchInfo;

            updateMessage(prev =>
              prev.map(msg =>
                msg.id === aiResponseId
                  ? { ...msg, searchInfo: newSearchInfo, isLoading: false }
                  : msg,
              ),
            );
          }

          else if (data.type === 'error') {
            const raw = String(data.message || '');
            const { message: parsedMessage, code } = parseStreamError(raw);
            const { limit, requested } = parseTokenPerMin(parsedMessage);

            if (limit || requested) {
              toast.error('Rate limit exceeded', {
                description: () => (
                  <>
                    <p>{`Allowed: ${limit ?? 'unknown'} tokens per minute,`}</p>
                    <p>{`Requested: ${requested ?? 'unknown'} tokens.`}</p>
                    <p>Try shortening your input or use larger model.</p>
                  </>
                ),
                duration: 10000,
                richColors: true,
              });
              updateMessage(prev =>
                prev.map(msg =>
                  msg.id === aiResponseId
                    ? {
                        ...msg,
                        content:
                          'Rate limit exceeded, please change the model or use a smaller query.',
                        error: { raw: parsedMessage, code },
                        isLoading: false,
                      }
                    : msg,
                ),
              );
            } else if (isAuthError(parsedMessage, code)) {
              toast.error('Authentication failed', {
                description:
                  'Your session is not synced with the server. Please sign out and sign in again.',
              });
              updateMessage(prev =>
                prev.map(msg =>
                  msg.id === aiResponseId
                    ? {
                        ...msg,
                        content:
                          'Authentication error: please sign out and sign in again, then retry.',
                        error: { raw: parsedMessage, code },
                        isLoading: false,
                      }
                    : msg,
                ),
              );
            } else {
              toast.error('Request failed', {
                description: parsedMessage || 'Sorry, your request failed.',
              });
              updateMessage(prev =>
                prev.map(msg =>
                  msg.id === aiResponseId
                    ? {
                        ...msg,
                        content: parsedMessage || 'Sorry, there was an error processing your request.',
                        error: { raw: parsedMessage, code },
                        isLoading: false,
                      }
                    : msg,
                ),
              );
            }
          }

          else if (data.type === 'end') {
            if (searchData) {
              const finalSearchInfo = {
                ...searchData,
                stages: [...searchData.stages, 'writing'],
              };
              updateMessage(prev =>
                prev.map(msg =>
                  msg.id === aiResponseId
                    ? {
                        ...msg,
                        searchInfo: finalSearchInfo,
                        isLoading: false,
                      }
                    : msg,
                ),
              );
            }
            if (onComplete) {
              void onComplete({
                content: streamedContent,
                searchInfo: searchData,
                uiContent: latestUiContent,
              });
            }
            streamEnded = true;
          }
        } catch (error) {
          console.error('Error parsing stream payload:', error);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const { events, remaining } = parseSseDataBlocks(sseBuffer);
        sseBuffer = remaining;

        events.forEach(handleStreamData);
      }

      const flush = decoder.decode();
      if (flush) {
        sseBuffer += flush;
        const { events } = parseSseDataBlocks(`${sseBuffer}\n\n`);
        events.forEach(handleStreamData);
      }
    } catch (error) {
      console.error('Stream request failed:', error);
      onError?.(error);
      if (!hasReceivedContent) {
        updateMessage(prev =>
          prev.map(msg =>
            msg.id === aiResponseId
              ? {
                  ...msg,
                  content: 'Sorry, there was an error processing your request.',
                  isLoading: false,
                }
              : msg,
          ),
        );
      }
    } finally {
      if (!streamEnded && !hasReceivedContent) {
        updateMessage(prev =>
          prev.map(msg =>
            msg.id === aiResponseId
              ? {
                  ...msg,
                  isLoading: false,
                }
              : msg,
          ),
        );
      }
      setStreaming(false);
    }
  };

  return { startStream, streaming };
};
