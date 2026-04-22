import { FEED_WINDOW_DAYS } from '@shared/constants/domain';
import type { FeedAdItem, FeedItem, FeedPostItem } from '@shared/types/domain';

type FeedPostCandidate = Omit<FeedPostItem, 'type'> & {
  authorId: string;
};

export const filterFeedPosts = (
  posts: FeedPostCandidate[],
  mutualConnectionIds: string[],
  now = new Date(),
) => {
  const cutoff = new Date(now.getTime() - FEED_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  return posts
    .filter((post) => mutualConnectionIds.includes(post.authorId))
    .filter((post) => new Date(post.createdAt) >= cutoff)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map<FeedPostItem>((post) => ({
      type: 'post',
      postId: post.postId,
      createdAt: post.createdAt,
      author: post.author,
      caption: post.caption,
      images: post.images,
      commentCount: post.commentCount,
      likeCount: post.likeCount,
      likedByMe: post.likedByMe,
    }));
};

const insertAt = (items: FeedItem[], ad: FeedAdItem, index: number) => {
  const next = [...items];
  next.splice(index, 0, ad);
  return next;
};

export const injectFeedAds = (posts: FeedPostItem[], ads: FeedAdItem[]) => {
  if (posts.length === 0 || ads.length === 0) {
    return posts;
  }

  if (posts.length <= 9) {
    const middleIndex = Math.ceil(posts.length / 2);
    return insertAt(posts, ads[0], middleIndex);
  }

  const firstIndex = Math.ceil(posts.length / 3);
  const secondIndex = Math.ceil((posts.length * 2) / 3) + 1;
  const withFirst = insertAt(posts, ads[0], firstIndex);

  return insertAt(withFirst, ads[1] ?? ads[0], secondIndex);
};
