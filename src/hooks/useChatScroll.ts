import React from 'react';

export default function useChatScroll<T>(
  dep: T,
): React.RefObject<HTMLDivElement> {
  const ref = React.useRef<HTMLDivElement>({} as HTMLDivElement);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [dep]);

  return ref;
}
