import { AppError } from '@/lib/errors';

export type ConnectionRequestShape = {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELED' | 'AUTO_ACCEPTED';
};

export const normalizeConnectionPair = (userOneId: string, userTwoId: string) =>
  [userOneId, userTwoId].sort() as [string, string];

export const resolveConnectionRequestOutcome = ({
  senderId,
  receiverId,
  reverseRequest,
  managerApprovalRequired = false,
  approvingManagerId = null,
}: {
  senderId: string;
  receiverId: string;
  reverseRequest: ConnectionRequestShape | null;
  managerApprovalRequired?: boolean;
  approvingManagerId?: string | null;
}) => {
  if (senderId === receiverId) {
    throw new AppError('INVALID_CONNECTION', 'Users cannot connect with themselves', 422);
  }

  if (reverseRequest && reverseRequest.status === 'PENDING') {
    const [userAId, userBId] = normalizeConnectionPair(senderId, receiverId);

    return {
      mode: 'AUTO_ACCEPT',
      connection: {
        userAId,
        userBId,
        status: managerApprovalRequired ? ('PENDING_MANAGER_APPROVAL' as const) : ('ACTIVE' as const),
        approvingManagerId: managerApprovalRequired ? approvingManagerId : null,
      },
      updates: [
        { requestId: reverseRequest.id, status: 'AUTO_ACCEPTED' as const },
        { senderId, receiverId, status: 'AUTO_ACCEPTED' as const },
      ],
    };
  }

  return {
    mode: 'PENDING',
    updates: [{ senderId, receiverId, status: 'PENDING' as const }],
  };
};
