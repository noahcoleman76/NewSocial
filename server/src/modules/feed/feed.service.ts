import type { FeedAdItem, FeedItem } from '../../../../shared/types/domain';
import { filterFeedPosts, injectFeedAds } from './feed.rules';

type FeedInput = Parameters<typeof filterFeedPosts>[0];

export const buildUnifiedFeed = ({
  posts,
  mutualConnectionIds,
  ads,
  now,
}: {
  posts: FeedInput;
  mutualConnectionIds: string[];
  ads: FeedAdItem[];
  now?: Date;
}): FeedItem[] => {
  const visiblePosts = filterFeedPosts(posts, mutualConnectionIds, now);
  return injectFeedAds(visiblePosts, ads);
};
