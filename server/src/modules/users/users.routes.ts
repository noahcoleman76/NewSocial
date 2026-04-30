import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { validate } from '@/lib/validate';
import { authRequired } from '@/middleware/auth-required';
import { profileUpload } from '@/modules/uploads/upload.middleware';
import { usersController } from './users.controller';
import { applyFamilyCodeSchema, deleteAccountSchema, updatePasswordSchema, updateProfileSchema } from './users.schemas';

export const usersRouter = Router();

usersRouter.patch('/me', authRequired, validate(updateProfileSchema), asyncHandler(usersController.updateMe));
usersRouter.delete('/me', authRequired, validate(deleteAccountSchema), asyncHandler(usersController.deleteMe));
usersRouter.patch(
  '/me/profile-image',
  authRequired,
  profileUpload.single('image'),
  asyncHandler(usersController.updateProfileImage),
);
usersRouter.patch(
  '/me/password',
  authRequired,
  validate(updatePasswordSchema),
  asyncHandler(usersController.changePassword),
);
usersRouter.post(
  '/me/family-code',
  authRequired,
  validate(applyFamilyCodeSchema),
  asyncHandler(usersController.applyFamilyCode),
);
usersRouter.get('/search', authRequired, asyncHandler(usersController.search));
usersRouter.get('/:username', authRequired, asyncHandler(usersController.getProfile));

