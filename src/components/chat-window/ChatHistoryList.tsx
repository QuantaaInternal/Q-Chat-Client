import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import React from 'react';
import { useQchatStore } from '@/store/qchatStore';
import {
  useDeleteConversation,
  useGetConversations,
  useRenameConversation,
} from '@/lib/queries/history.queries';

const ChatHistoryList = () => {
  const { isUserAuthenticated } = useQchatStore();
  const { data, isLoading } = useGetConversations({
    enabled: isUserAuthenticated,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        delay: 0.1,
        duration: 0.2,
        ease: 'anticipate',
      }}
      className={cn('flex flex-col gap-3')}
    >
      <h3 className="font-departureMono overflow-hidden px-2 text-sm leading-4 font-semibold whitespace-nowrap text-[#A1A1A1] uppercase">
        chat history
      </h3>
      <div
        className={`flex flex-col gap-1 py-2 ${
          !isUserAuthenticated && 'cursor-not-allowed rounded-2xl bg-[#404040]/40'
        }`}
      >
        {isUserAuthenticated && isLoading && (
          <p className="font-briColage px-3 text-xs text-[#A1A1A1]">Loading chats...</p>
        )}

        {isUserAuthenticated && !isLoading && (data?.data?.length || 0) === 0 && (
          <p className="font-briColage px-3 text-xs text-[#A1A1A1]">
            No chat history yet. Start a new chat.
          </p>
        )}

        {isUserAuthenticated &&
          (data?.data || []).map(conversation => (
            <ChatHistoryItem
              key={conversation.id}
              conversationId={conversation.id}
              title={conversation.title || 'Untitled chat'}
            />
          ))}
      </div>
      {!isUserAuthenticated && <AskUserToLogin />}
    </motion.div>
  );
};

export default ChatHistoryList;

const ChatHistoryItem = ({
  conversationId,
  title,
}: {
  conversationId: string;
  title: string;
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { mutateAsync: removeConversation, isPending: isDeleting } =
    useDeleteConversation();
  const { mutateAsync: renameConversationAsync } = useRenameConversation();
  const {
    isUserAuthenticated,
    activeConversationId,
    setActiveConversationId,
    setClearStore,
  } = useQchatStore();

  const isActive = activeConversationId === conversationId;

  return (
    <div
      className={cn(
        'group flex w-full items-center justify-between rounded-md py-1 pr-2 pl-4 transition-colors',
        isMenuOpen || isActive ? 'dark:bg-[#161616]' : 'bg-transparent',
      )}
    >
      <Button
        disabled={!isUserAuthenticated}
        variant="ghost"
        onClick={() => setActiveConversationId(conversationId)}
        className={cn(
          'font-briColage flex-1 truncate px-0 text-left font-normal hover:dark:bg-transparent',
          isActive ? 'text-[#D9D9D9]' : 'text-[#D9D9D9]/70',
          !isUserAuthenticated && 'select-none',
        )}
      >
        <span className="block w-full truncate overflow-hidden whitespace-nowrap">
          {title}
        </span>
      </Button>
      <div className={cn(`${isMenuOpen ? 'visible' : 'invisible group-hover:visible'}`)}>
        <ChatHistoryItemMenu
          open={isMenuOpen}
          setOpen={setIsMenuOpen}
          disabled={!isUserAuthenticated || isDeleting}
          onRename={async () => {
            const proposedTitle = window.prompt('Rename conversation', title);
            if (proposedTitle === null) return;
            const trimmedTitle = proposedTitle.trim();
            if (!trimmedTitle) return;
            await renameConversationAsync({
              conversationId,
              title: trimmedTitle,
            });
          }}
          onDelete={async () => {
            await removeConversation({ conversationId });
            if (isActive) {
              setClearStore();
            }
          }}
        />
      </div>
    </div>
  );
};

const ChatHistoryItemMenu = ({
  open,
  setOpen,
  disabled,
  onRename,
  onDelete,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled?: boolean;
  onRename: () => Promise<void>;
  onDelete: () => Promise<void>;
}) => {
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button variant="ghost" size="icon" className="hover:dark:bg-transparent">
          <IconDots stroke={2.8} className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={12}
        className="w-48 font-mono font-medium"
        align="start"
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={async () => {
              await onRename();
            }}
            className="flex items-center gap-2"
          >
            <IconEdit className="h-3 w-3" stroke={1.5} />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              await onDelete();
            }}
            className="flex items-center gap-2 text-red-500 hover:dark:text-red-500"
          >
            <IconTrash
              className="h-3 w-3 text-red-500 hover:dark:text-red-500"
              stroke={1.5}
            />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AskUserToLogin = () => {
  const {
    isSignInDrawerOpen,
    setIsSignInDrawerOpen,
    isMobileView,
    setIsSidebarOpen,
  } = useQchatStore();

  return (
    <span className="font-briColage px-1 text-sm font-medium text-[#BAC0CC] lg:text-nowrap">
      To access the chat history please <br className="hidden md:block lg:block" />
      <button
        className="cursor-pointer text-[#7DDF77] underline"
        onClick={() => {
          if (isMobileView) setIsSidebarOpen(false);
          setIsSignInDrawerOpen(!isSignInDrawerOpen);
        }}
      >
        log in/ sign up
      </button>{' '}
      with our app.
    </span>
  );
};
