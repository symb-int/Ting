import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useMediaQuery } from '@librechat/client';
import type { ConversationListResponse, TConversation } from 'librechat-data-provider';
import type { InfiniteQueryObserverResult } from '@tanstack/react-query';
import type { List } from 'react-virtualized';
import {
  useConversationsInfiniteQuery,
  usePinnedConversationsQuery,
  useTitleGeneration,
} from '~/data-provider';
import { useAuthContext, useLocalize, useNavScrolling } from '~/hooks';
import useSidebarToggle from '~/hooks/Nav/useSidebarToggle';
import { Conversations } from '~/components/Conversations';
import { collectPinnedConversations } from '~/utils';
import store from '~/store';

const updatedAt = (conversation: TConversation) =>
  new Date(conversation.updatedAt ?? conversation.createdAt ?? 0).getTime();

const newestFirst = (a: TConversation, b: TConversation) => updatedAt(b) - updatedAt(a);

const ConversationsSection = memo(() => {
  const isSmallScreen = useMediaQuery('(max-width: 799px)');
  const localize = useLocalize();
  const { setSidebarOpen } = useSidebarToggle();
  const { isAuthenticated } = useAuthContext();
  const search = useRecoilValue(store.search);
  useTitleGeneration(isAuthenticated);

  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isPreviousData,
    isError,
    refetch,
  } = useConversationsInfiniteQuery(
    {
      sortBy: 'updatedAt',
      sortDirection: 'desc',
      search: search.debouncedQuery || undefined,
    },
    {
      enabled: isAuthenticated,
      staleTime: 30000,
      cacheTime: 300000,
    },
  );

  const hasNextPage = useMemo(() => {
    const lastPage = data?.pages.at(-1);
    return lastPage?.nextCursor != null;
  }, [data?.pages]);

  const fetchedConversations = useMemo(
    () => data?.pages.flatMap((page) => page.conversations) ?? [],
    [data],
  );

  const { data: pinnedData, isLoading: isPinnedLoading } = usePinnedConversationsQuery({
    enabled: isAuthenticated,
  });

  const conversations = useMemo(() => {
    const pinned = search.query
      ? fetchedConversations.filter((conversation) => conversation.pinned === true)
      : collectPinnedConversations(pinnedData?.conversations, fetchedConversations);
    const pinnedIds = new Set(pinned.map((conversation) => conversation.conversationId));
    const unpinned = fetchedConversations.filter(
      (conversation) => conversation.pinned !== true && !pinnedIds.has(conversation.conversationId),
    );

    return [...pinned].sort(newestFirst).concat(unpinned.sort(newestFirst));
  }, [fetchedConversations, pinnedData?.conversations, search.query]);

  const conversationsRef = useRef<List | null>(null);
  const { moveToTop } = useNavScrolling<ConversationListResponse>({
    fetchNextPage: async (options?) => {
      if (hasNextPage) {
        return fetchNextPage(options);
      }
      return Promise.resolve({} as InfiniteQueryObserverResult<ConversationListResponse, unknown>);
    },
    isFetchingNext: isFetchingNextPage,
  });

  const toggleNav = useCallback(
    (afterSlide?: () => void) => {
      if (isSmallScreen) {
        setSidebarOpen(false, afterSlide);
        return;
      }
      afterSlide?.();
    },
    [isSmallScreen, setSidebarOpen],
  );

  const loadMoreConversations = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const retryConversations = useCallback(() => {
    void refetch();
  }, [refetch]);
  const keepCasesExpanded = useCallback(() => undefined, []);

  const [isSearchLoading, setIsSearchLoading] = useState(
    Boolean(search.query) && (search.isTyping || isLoading || isFetching),
  );

  useEffect(() => {
    if (search.isTyping) {
      setIsSearchLoading(true);
    } else if (!isLoading && !isFetching) {
      setIsSearchLoading(false);
    } else if (search.query) {
      setIsSearchLoading(true);
    }
  }, [search.query, search.isTyping, isLoading, isFetching]);

  const [scrollViewport, setScrollViewport] = useState<HTMLDivElement | null>(null);
  const [scrollContent, setScrollContent] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollViewport) {
      scrollViewport.scrollTop = 0;
    }
  }, [search.query, scrollViewport]);

  return (
    <div
      ref={setScrollViewport}
      className="ting-sidebar__history-scroll"
      role="region"
      aria-label={localize('com_ting_cases')}
    >
      <div ref={setScrollContent} className="ting-sidebar__history-content">
        <Conversations
          conversations={conversations}
          moveToTop={moveToTop}
          toggleNav={toggleNav}
          containerRef={conversationsRef}
          loadMoreConversations={loadMoreConversations}
          isLoading={isFetchingNextPage || isLoading || (!search.query && isPinnedLoading)}
          isSearchLoading={isSearchLoading || isPreviousData}
          isChatsExpanded
          setIsChatsExpanded={keepCasesExpanded}
          hasNextPage={hasNextPage}
          isError={isError}
          onRetry={retryConversations}
          scrollViewport={scrollViewport}
          scrollContent={scrollContent}
          flatMode
        />
      </div>
    </div>
  );
});

ConversationsSection.displayName = 'ConversationsSection';

export default ConversationsSection;
