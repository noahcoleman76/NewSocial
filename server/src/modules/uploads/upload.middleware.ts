import multer from 'multer';
import * as domainConstants from '../../../../shared/constants/domain';
import { AppError } from '@/lib/errors';

const { IMAGE_MIME_TYPES, POST_IMAGE_MAX_BYTES, PROFILE_IMAGE_MAX_BYTES } = domainConstants;

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
    callback(new AppError('INVALID_FILE_TYPE', 'Only JPEG, PNG, and WebP images are allowed', 400));
    return;
  }

  callback(null, true);
};

export const postUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: POST_IMAGE_MAX_BYTES, files: 5 },
});

export const messageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: POST_IMAGE_MAX_BYTES, files: 3 },
});

export const profileUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: PROFILE_IMAGE_MAX_BYTES, files: 1 },
});
