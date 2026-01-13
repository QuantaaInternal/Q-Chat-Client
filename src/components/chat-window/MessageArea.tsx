'use client';

import { Message, SearchInfo } from '@/types/message-type';
import { ResponseLoader } from '../ui/loader';
import { TextShimmer } from '../motion-primitives/text-shimmer';
import {
  GlobeIcon,
  LibraryIcon,
  PaintbrushIcon,
  PencilRulerIcon,
  SearchIcon,
} from 'lucide-react';
import { useQchatStore } from '@/store/qchatStore';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { MarkdownRenderer } from '../ui/markdown-renderer';
import dynamic from 'next/dynamic';

const C1Component = dynamic(
  () => import('@thesysai/genui-sdk').then(mod => mod.C1Component),
  { ssr: false },
);

const ThemeProvider = dynamic(
  () => import('@thesysai/genui-sdk').then(mod => mod.ThemeProvider),
  { ssr: false },
);

const SearchStages = ({ searchInfo }: { searchInfo: SearchInfo | null }) => {
  if (!searchInfo || !searchInfo.stages || searchInfo.stages.length === 0)
    return null;

  return (
    <div className="relative mt-1 mb-3 pl-4">
      {/* Search Process UI */}
      <div className="flex flex-col space-y-4 text-sm text-gray-700">
        {/* Searching Stage */}
        {searchInfo.stages.includes('searching') && (
          <div className="relative">
            <span className="absolute top-0 -left-4 z-10 text-[#D1D6DC]">
              <GlobeIcon size={18} strokeWidth={2} className="h-4.5 w-4.5" />
            </span>
            {/* Connecting line to next item if reading exists */}
            {searchInfo.stages.includes('reading') && (
              <div className="absolute top-5 -left-[8px] h-[calc(85%+0.2rem)] w-[1.5px] rounded-xl bg-gradient-to-b from-[#239BA7]/20 to-[#3DDBB0]/80"></div>
            )}

            <div className="flex flex-col">
              <span className="font-briColage mb-2 ml-3 text-xs leading-5 font-medium text-[#D1D6DC]">
                Searching the web
              </span>

              {/* Search Query */}
              <div className="mt-1 flex flex-wrap gap-2 pl-2">
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#0C0C0D]/30 px-3 py-1.5 font-medium">
                  <SearchIcon
                    size={12}
                    strokeWidth={3}
                    className="min-h-3 min-w-3 text-[#6A7282]"
                  />
                  <TextShimmer className="font-briColage pt-[2px] text-xs leading-3 font-medium">
                    {searchInfo.query}
                  </TextShimmer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reading Stage */}
        {searchInfo.stages.includes('reading') && (
          <div className="relative">
            <span className="absolute top-0 -left-4 z-10 text-white">
              <LibraryIcon size={18} strokeWidth={2} className="h-4.5 w-4.5" />
            </span>
            <div className="flex flex-col">
              <span className="font-briColage mb-2 ml-3 text-xs leading-5 font-medium text-[#D1D6DC]">
                Reading
              </span>
              {searchInfo.stages.includes('reading') && (
                <div className="absolute top-6 -left-[8px] h-[calc(72%+1rem)] w-[1.5px] rounded-xl bg-gradient-to-b from-[#3DDBB0]/80 to-[#89E06C]"></div>
              )}

              {/* Search Results */}
              {searchInfo.urls && searchInfo.urls.length > 0 && (
                <div className="max-w-2xl space-y-1 pl-2">
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(searchInfo.urls) ? (
                      searchInfo.urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-briColage max-w-40 truncate rounded-full border bg-[#404040]/40 px-3 py-2 text-[10px] leading-3.5 font-medium text-[#BAC0CC] transition-all duration-300 ease-in-out hover:underline lg:max-w-48 lg:text-xs dark:border-neutral-700/10"
                        >
                          {typeof url === 'string'
                            ? url
                            : JSON.stringify(url).substring(0, 30)}
                        </a>
                      ))
                    ) : (
                      <div className="text-muted-foreground max-w-36 truncate rounded-full border px-3 py-1.5 text-xs transition-all duration-200 hover:bg-gray-50 lg:max-w-48 dark:border-neutral-700/10 dark:bg-[#2a2929]">
                        {typeof searchInfo.urls === 'string'
                          ? (searchInfo.urls as string).substring(0, 30)
                          : JSON.stringify(searchInfo.urls).substring(0, 30)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Writing Stage */}
        {searchInfo.stages.includes('writing') && (
          <div className="relative">
            <PencilRulerIcon
              size={18}
              strokeWidth={1.5}
              className="absolute top-0 -left-4 h-4.5 w-4.5 text-[#D1D6DC]"
            />
            <span className="font-briColage ml-3 text-xs leading-5 font-medium text-[#D1D6DC]">
              Writing answer
            </span>
          </div>
        )}

        {/* Error Message */}
        {searchInfo.stages.includes('error') && (
          <div className="relative">
            {/* Red dot over the vertical line */}
            <div className="absolute top-1 -left-3 z-10 h-2.5 w-2.5 rounded-full bg-red-400 shadow-sm"></div>
            <span className="font-medium">Search error</span>
            <div className="mt-1 pl-4 text-xs text-red-500">
              {searchInfo.error || 'An error occurred during search.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageArea = ({ messages }: { messages: Message[] }) => {
  const { setIsLoading } = useQchatStore();

  useEffect(() => {
    const anyLoading = messages.some(msg => msg.isLoading);
    setIsLoading(anyLoading);
  }, [messages, setIsLoading]);

  return (
    <>
      {messages.map(message => (
        <div
          key={message.id}
          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-5`}
        >
          <div className="flex max-w-4xl flex-col">
            {/* Search Status Display - Now ABOVE the message */}
            {!message.isUser && message.searchInfo && (
              <SearchStages searchInfo={message.searchInfo} />
            )}

            {!message.isUser && message.ui && (
              <ThemeProvider
                darkTheme={{
                  fontBody: 'font-briColage',
                  fontHeadingLarge: 'font-briColage',
                  fontHeadingMedium: 'font-briColage',
                  fontHeadingSmall: 'font-briColage',
                  fontHeadingExtraSmall: 'font-briColage',
                  fontBodyHeavy: 'font-briColage',
                  backgroundFills: 'bg-[#404040]/30',
                }}
                mode="dark"
              >
                <div className="mb-3 w-full">
                  {message.ui.loading ? (
                    <div className="flex items-center py-2 text-[#D1D6DC]">
                      <PaintbrushIcon
                        size={18}
                        strokeWidth={1.5}
                        className="h-4.5 w-4.5"
                      />
                      <span className="font-briColage ml-2 text-xs leading-5 font-medium">
                        Generating UI
                      </span>
                    </div>
                  ) : (
                    message.ui.content && (
                      <C1Component
                        c1Response={message.ui.content}
                        isStreaming={message.isLoading}
                      />
                    )
                  )}
                </div>
              </ThemeProvider>
            )}

            {/* Message Content */}
            <div
              className={`font-briColage flex w-fit flex-col items-start gap-2 font-medium ${
                message.isUser
                  ? 'max-w-2xl rounded-3xl bg-[#404040]/30 px-5 py-[10px]'
                  : ''
              }`}
            >
              {!message.content || message.isLoading ? (
                <ResponseLoader />
              ) : (
                <ThemeProvider mode="dark">
                  <ReactMarkdown
                    components={MarkdownRenderer}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </ThemeProvider>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default MessageArea;
