import { describe, expect, it } from 'vitest';
import { messageService } from './message.service';

describe('messageService', () => {
  it('renders deleted user label when sender identity is removed', () => {
    expect(
      messageService.renderMessageSenderLabel({
        senderId: null,
        senderSnapshotName: null,
        deletedSenderLabel: true,
      }),
    ).toBe('Deleted User');
  });
});
