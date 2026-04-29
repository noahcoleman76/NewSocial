import { describe, expect, it } from 'vitest';
import { buildUnifiedFeed } from './feed.service';

describe('buildUnifiedFeed', () => {
  it('filters non-connections and old posts, then injects one ad for small feeds', () => {
    const feed = buildUnifiedFeed({
      mutualConnectionIds: ['u-1'],
      ads: [
        {
          type: 'ad',
          id: 'ad-1',
          title: 'Ad',
          body: 'Body',
          imageUrl: null,
          ctaLabel: null,
          ctaUrl: null,
        },
      ],
      now: new Date('2026-04-22T00:00:00.000Z'),
      posts: [
        {
          postId: 'p-1',
          authorId: 'u-1',
          createdAt: '2026-04-21T00:00:00.000Z',
          author: { id: 'u-1', username: 'jamie', displayName: 'Jamie', profileImageUrl: null, role: 'STANDARD' },
          caption: 'Recent',
          images: [],
          commentCount: 0,
          likeCount: 0,
          likedByMe: false,
        },
        {
          postId: 'p-2',
          authorId: 'u-2',
          createdAt: '2026-04-21T00:00:00.000Z',
          author: { id: 'u-2', username: 'riley', displayName: 'Riley', profileImageUrl: null, role: 'STANDARD' },
          caption: 'Hidden',
          images: [],
          commentCount: 0,
          likeCount: 0,
          likedByMe: false,
        },
        {
          postId: 'p-3',
          authorId: 'u-1',
          createdAt: '2026-03-01T00:00:00.000Z',
          author: { id: 'u-1', username: 'jamie', displayName: 'Jamie', profileImageUrl: null, role: 'STANDARD' },
          caption: 'Old',
          images: [],
          commentCount: 0,
          likeCount: 0,
          likedByMe: false,
        },
      ],
    });

    expect(feed).toHaveLength(2);
    expect(feed[0].type).toBe('post');
    expect(feed[1].type).toBe('ad');
  });

  it('includes the viewer own recent posts even without a connection', () => {
    const feed = buildUnifiedFeed({
      viewerId: 'viewer-1',
      mutualConnectionIds: [],
      ads: [],
      now: new Date('2026-04-22T00:00:00.000Z'),
      posts: [
        {
          postId: 'own-post',
          authorId: 'viewer-1',
          createdAt: '2026-04-21T00:00:00.000Z',
          author: { id: 'viewer-1', username: 'noah', displayName: 'Noah', profileImageUrl: null, role: 'STANDARD' },
          caption: 'My post',
          images: [],
          commentCount: 0,
          likeCount: 0,
          likedByMe: false,
        },
      ],
    });

    expect(feed).toHaveLength(1);
    expect(feed[0].type).toBe('post');
  });

  it('injects two ads when the feed has ten or more posts', () => {
    const feed = buildUnifiedFeed({
      mutualConnectionIds: ['u-1'],
      ads: [
        { type: 'ad', id: 'ad-1', title: 'One', body: 'One', imageUrl: null, ctaLabel: null, ctaUrl: null },
        { type: 'ad', id: 'ad-2', title: 'Two', body: 'Two', imageUrl: null, ctaLabel: null, ctaUrl: null },
      ],
      now: new Date('2026-04-22T00:00:00.000Z'),
      posts: Array.from({ length: 10 }, (_, index) => ({
        postId: `p-${index}`,
        authorId: 'u-1',
        createdAt: `2026-04-${String(20 - index).padStart(2, '0')}T00:00:00.000Z`,
        author: { id: 'u-1', username: 'jamie', displayName: 'Jamie', profileImageUrl: null, role: 'STANDARD' as const },
        caption: `Post ${index}`,
        images: [],
        commentCount: 0,
        likeCount: 0,
        likedByMe: false,
      })),
    });

    expect(feed.filter((item) => item.type === 'ad')).toHaveLength(2);
  });
});

