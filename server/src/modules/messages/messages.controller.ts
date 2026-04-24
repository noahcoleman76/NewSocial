import type { Request, Response } from 'express';
import { AppError } from '@/lib/errors';
import { messageService } from './message.service';

const getConversationId = (req: Request) => {
  const { conversationId } = req.params;
  return Array.isArray(conversationId) ? conversationId[0] : conversationId;
};

const getUserId = (req: Request) => {
  const { userId } = req.params;
  return Array.isArray(userId) ? userId[0] : userId;
};

export const messagesController = {
  listConversations: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const conversations = await messageService.listConversations(req.auth.sub);
    res.json({ conversations });
  },

  getConversation: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const conversation = await messageService.getConversation(req.auth.sub, getConversationId(req));
    res.json({ conversation });
  },

  getOrCreateConversation: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const conversation = await messageService.getOrCreateConversationWithUser(req.auth.sub, req.body.userId);
    res.status(201).json({ conversation });
  },

  getOrCreateConversationWithUser: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const conversation = await messageService.getOrCreateConversationWithUser(req.auth.sub, getUserId(req));
    res.json({ conversation });
  },

  openConversation: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    await messageService.openConversation(req.auth.sub, getConversationId(req));
    res.status(204).send();
  },

  sendMessage: async (req: Request, res: Response) => {
    if (!req.auth?.sub) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const files = Array.isArray(req.files) ? req.files : [];
    const message = await messageService.sendMessage({
      conversationId: getConversationId(req),
      senderId: req.auth.sub,
      body: typeof req.body.body === 'string' ? req.body.body : null,
      files,
    });

    res.status(201).json({ message });
  },
};

