import { Router } from 'express';
import { asyncHandler } from '@/lib/async-handler';
import { validate } from '@/lib/validate';
import { authRequired } from '@/middleware/auth-required';
import { messageUpload } from '@/modules/uploads/upload.middleware';
import { messagesController } from './messages.controller';
import {
  conversationParamsSchema,
  createConversationSchema,
  createMessageSchema,
  userParamsSchema,
} from './messages.schemas';

export const messagesRouter = Router();

messagesRouter.get('/', authRequired, asyncHandler(messagesController.listConversations));
messagesRouter.post('/', authRequired, validate(createConversationSchema), asyncHandler(messagesController.getOrCreateConversation));
messagesRouter.get(
  '/with/:userId',
  authRequired,
  validate(userParamsSchema, 'params'),
  asyncHandler(messagesController.getOrCreateConversationWithUser),
);
messagesRouter.get(
  '/:conversationId',
  authRequired,
  validate(conversationParamsSchema, 'params'),
  asyncHandler(messagesController.getConversation),
);
messagesRouter.post(
  '/:conversationId/open',
  authRequired,
  validate(conversationParamsSchema, 'params'),
  asyncHandler(messagesController.openConversation),
);
messagesRouter.post(
  '/:conversationId/messages',
  authRequired,
  messageUpload.array('images', 3),
  validate(conversationParamsSchema, 'params'),
  validate(createMessageSchema),
  asyncHandler(messagesController.sendMessage),
);

