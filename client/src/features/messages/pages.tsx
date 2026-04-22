import { useParams } from 'react-router-dom';
import { demoSnapshot } from '@/lib/mock-data';
import { PageCard } from '@/components/page-card';

export const MessagesPage = () => (
  <PageCard title="Messages" subtitle="Direct messages only. Unread state is shown at the conversation level.">
    <div className="space-y-3">
      {demoSnapshot.conversations.map((conversation) => (
        <div key={conversation.id} className="rounded-[1.5rem] border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">{conversation.title}</p>
            {conversation.unread ? <span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-white">Unread</span> : null}
          </div>
          <p className="mt-2 text-sm text-slate-500">{conversation.preview}</p>
        </div>
      ))}
    </div>
  </PageCard>
);

export const ConversationPage = () => {
  const { conversationId } = useParams();

  return (
    <PageCard title="Conversation" subtitle={`Conversation ID: ${conversationId}`}>
      <div className="space-y-3">
        <div className="rounded-[1.5rem] border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Jamie Brooks</p>
          <p className="mt-2">Checking in before dinner.</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Deleted User</p>
          <p className="mt-2">This message remains after deletion.</p>
        </div>
      </div>
      <form className="mt-6 space-y-4">
        <textarea className="min-h-28 w-full rounded-[1.5rem] border border-slate-200 px-4 py-3" placeholder="Write a message" />
        <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">Send message</button>
      </form>
    </PageCard>
  );
};
