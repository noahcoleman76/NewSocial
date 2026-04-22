export type MessageAuthorSnapshot = {
  senderId: string | null;
  senderSnapshotName: string | null;
  deletedSenderLabel: boolean;
};

export const renderMessageSenderLabel = (message: MessageAuthorSnapshot) => {
  if (message.deletedSenderLabel || message.senderId === null) {
    return 'Deleted User';
  }

  return message.senderSnapshotName ?? 'Deleted User';
};
