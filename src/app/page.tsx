'use client';

export const dynamic = "force-dynamic";


import { Branding } from '@/components/branding/branding';
import ChatHistoryList from '@/components/chat-window/ChatHistoryList';
import NewChatButton from '@/components/chat-window/NewChatButton';
import SearchChatButton from '@/components/chat-window/SearchChatButton';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarBody } from '@/components/ui/sidebar';
import ConversationView from '@/components/view/ConversationView';
import { cn } from '@/lib/utils';
import { useQchatStore } from '@/store/qchatStore';
import { IconLayoutSidebarLeftCollapse, IconX } from '@tabler/icons-react';
// import { ArrowUpRightIcon } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
// import Image from 'next/image';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { checkServerStatus } from '../../api/axios';
import SignInDrawer from '@/components/chat-window/SignInDrawer';

export default function Home() {
  // const [open, setOpen] = useState(true);
  const {
    setIsMobileView,
    isSidebarOpen,
    setIsSidebarOpen,
    isSignInDrawerOpen,
    setIsSignInDrawerOpen,
  } = useQchatStore();

  // checks the server status by pinging the health endpoint.
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

    const checkStatus = () => {
      checkServerStatus({ apiUrl }).then(isHealthy => {
        if (!isHealthy) {
          toast.error('Something went wrong', {
            description: () => (
              <p>
                Please check your connection or try again shortly. Reach us to
                report the issue{' '}
                <a
                  href="mailto:iam.paulsayantan06@gmail.com"
                  className="underline"
                >
                  iam.paulsayantan06@gmail.com
                </a>
              </p>
            ),
            duration: 10000,
            richColors: true,
          });
        } else {
          console.log('Server is healthy');
        }
      });
    };

    checkStatus();
  }, []);

  // sets the isMobileView state based on the window width
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobileView]);

  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-1 flex-col overflow-hidden border-neutral-200 bg-gray-100 md:flex-row dark:bg-neutral-800',
        'h-screen',
      )}
    >
      <Sidebar
        open={isSidebarOpen}
        setOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <SidebarBody className="justify-between">
          <div className="flex flex-1 flex-col gap-9 overflow-x-hidden overflow-y-auto">
            <div className="flex items-center justify-between">
              <Branding onClickFn={() => setIsSidebarOpen(!isSidebarOpen)} />
              {isSidebarOpen && (
                <CloseSidebarButton setOpen={setIsSidebarOpen} />
              )}
            </div>
            <div className="flex h-min flex-col gap-4">
              <NewChatButton />
              <SearchChatButton />
            </div>
            <AnimatePresence>
              {isSidebarOpen && <ChatHistoryList />}
            </AnimatePresence>
          </div>
          {/* <RedirectToGithub /> */}
        </SidebarBody>
      </Sidebar>
      <div
        vaul-drawer-wrapper=""
        className="w-full flex-1 overflow-hidden lg:my-[10px] lg:mr-[10px] lg:rounded-xl"
      >
        <ConversationView />
      </div>
      <SignInDrawer
        open={isSignInDrawerOpen}
        setOpen={() => setIsSignInDrawerOpen(!isSignInDrawerOpen)}
      />
    </div>
  );
}

const CloseSidebarButton = ({
  setOpen,
}: {
  setOpen: (open: boolean) => void;
}) => {
  const { isUserAuthenticated, isMobileView } = useQchatStore();

  const shouldDisable = isUserAuthenticated;

  return (
    <Button
      onClick={() => setOpen(!open)}
      className="h-9 w-9 cursor-pointer rounded-[14px] duration-200 ease-in-out disabled:cursor-not-allowed lg:h-10 lg:w-10 dark:bg-[#404040]/40 hover:dark:bg-[#404040]"
      variant="ghost"
      disabled={shouldDisable}
    >
      {!isMobileView ? (
        <IconLayoutSidebarLeftCollapse
          stroke={2}
          size={22}
          className="min-h-5 min-w-5 object-fill lg:min-h-[22px] lg:min-w-[22px]"
        />
      ) : (
        <IconX stroke={2} size={20} className="min-h-5 min-w-5 object-fill" />
      )}
    </Button>
  );
};

// const RedirectToGithub = () => {
//   const { isSidebarOpen } = useQchatStore();

//   return (
//     <button
//       className={`flex h-10 w-full flex-nowrap items-center justify-between rounded-2xl bg-[#404040]/40 ${isSidebarOpen ? 'px-4' : 'pl-[10px]'} py-2 duration-200 ease-in-out hover:bg-[#404040]/80`}
//       onClick={() =>
//         window.open(
//           'https://github.com/SayantanmPaul?tab=repositories',
//           '_blank',
//         )
//       }
//     >
//       <span className="flex items-center gap-3">
//         <Image
//           src="/logo/github-mark-white.svg"
//           alt="GitHub"
//           width={20}
//           height={19}
//           draggable={false}
//           className="h-5 w-5"
//         />
//         <AnimatePresence>
//           {isSidebarOpen && (
//             <motion.p
//               initial={{ opacity: 1 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               transition={{
//                 delay: 0,
//                 duration: 0.2,
//                 ease: 'anticipate',
//               }}
//               className="font-briColage text-sm font-medium whitespace-nowrap text-[#EFEFEF]"
//             >
//               Proudly Open Source
//             </motion.p>
//           )}
//         </AnimatePresence>
//       </span>
//       {isSidebarOpen && (
//         <ArrowUpRightIcon
//           size={20}
//           strokeWidth={2}
//           className="text-[#EFEFEF]"
//         />
//       )}
//     </button>
//   );
// };
