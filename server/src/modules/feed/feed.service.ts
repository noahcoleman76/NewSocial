import type { FeedAdItem, FeedItem } from '../../../../shared/types/domain';
import { connectionRepository } from '@/modules/connections/connection.repository';
import { feedRepository } from './feed.repository';
import { filterFeedPosts } from './feed.rules';

type FeedInput = Parameters<typeof filterFeedPosts>[0];

export const buildUnifiedFeed = ({
  posts,
  mutualConnectionIds,
  ads,
  now,
  viewerId,
}: {
  posts: FeedInput;
  mutualConnectionIds: string[];
  ads: FeedAdItem[];
  now?: Date;
  viewerId?: string;
}): FeedItem[] => {
  return filterFeedPosts(posts, mutualConnectionIds, now, viewerId);
};

export const feedService = {
  getFeed: async (userId: string) => {
    const [posts, activeConnectionIds, familyConnectionIds] = await Promise.all([
      feedRepository.listFeedPosts(userId),
      connectionRepository.listActiveConnectionIds(userId),
      connectionRepository.listFamilyConnectionIds(userId),
    ]);

    const visibleConnectionIds = [...new Set([...activeConnectionIds, ...familyConnectionIds])];

    return buildUnifiedFeed({
      posts: posts.map((post) => ({
        postId: post.id,
        authorId: post.author.id,
        createdAt: post.createdAt.toISOString(),
        author: post.author,
        caption: post.caption,
        images: post.images.map((image) => image.imageUrl),
        commentCount: post._count.comments,
        likeCount: post._count.likes,
        likedByMe: post.likes.length > 0,
        canDelete: post.author.id === userId,
      })),
      mutualConnectionIds: visibleConnectionIds,
      viewerId: userId,
      ads: [],
    });
  },
};


