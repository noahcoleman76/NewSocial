export const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,20}$/;

export const BIO_MAX_LENGTH = 250;
export const CAPTION_MAX_LENGTH = 1000;
export const COMMENT_MAX_LENGTH = 1000;
export const MESSAGE_MAX_LENGTH = 1000;
export const POST_IMAGE_LIMIT = 5;
export const MESSAGE_IMAGE_LIMIT = 3;
export const FEED_WINDOW_DAYS = 14;
export const CHILD_ACCESS_CODE_LENGTH = 8;
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_RATE_LIMIT_MAX = 25;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
