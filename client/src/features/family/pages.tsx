import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageCard } from '@/components/page-card';

type FamilyCodeResponse = {
  code: {
    value: string;
  } | null;
};

type FamilyChild = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  createdAt: string;
};

type FamilyChildrenResponse = {
  children: FamilyChild[];
};

type FamilyChildResponse = {
  child: FamilyChild & {
    bio: string | null;
    profileImageUrl: string | null;
  };
};

export const FamilyPage = () => {
  const codeQuery = useQuery({
    queryKey: ['family', 'code'],
    queryFn: async () => {
      const { data } = await api.get<FamilyCodeResponse>('/family/code');
      return data.code;
    },
  });

  const childrenQuery = useQuery({
    queryKey: ['family', 'children'],
    queryFn: async () => {
      const { data } = await api.get<FamilyChildrenResponse>('/family/children');
      return data.children;
    },
  });

  return (
    <div className="space-y-6">
      <PageCard
        title="Family"
        subtitle="Manage a family from here. Share your fixed family code when you want a new child account linked under your management."
      >
        <div className="space-y-4">
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Any standard account can manage family-linked child accounts. Use your family code in the normal create-account
            form for the child. A valid code creates the new account as a child account connected to you.
          </p>
          {codeQuery.isLoading ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              Loading your family code...
            </div>
          ) : null}
          {codeQuery.data ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Family code</p>
              <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.18em] text-slate-900">
                {codeQuery.data.value}
              </p>
              <p className="mt-2 text-sm text-slate-500">This code stays fixed for your account until we add code rotation.</p>
            </div>
          ) : null}
          {codeQuery.isError ? <p className="text-sm text-rose-600">Could not load your family code right now.</p> : null}
        </div>
      </PageCard>
      <PageCard title="Linked Children" subtitle="Accounts created with your family code appear here.">
        {childrenQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading child accounts...</p>
        ) : null}
        {childrenQuery.isError ? (
          <p className="text-sm text-rose-600">Could not load linked child accounts right now.</p>
        ) : null}
        {childrenQuery.data?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {childrenQuery.data.map((child) => (
              <Link
                key={child.id}
                className="rounded-[1.5rem] border border-slate-200 p-5 transition hover:border-slate-300 hover:bg-slate-50"
                to={`/family/child/${child.id}`}
              >
                <p className="font-medium text-slate-900">{child.displayName}</p>
                <p className="mt-1 text-sm text-slate-500">@{child.username}</p>
                <p className="mt-3 text-sm text-slate-600">{child.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  Joined {new Date(child.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : null}
        {childrenQuery.data && childrenQuery.data.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
            No child accounts are linked yet. Share your family code on the create-account page to connect a new child account here.
          </div>
        ) : null}
      </PageCard>
      <PageCard title="How Family Signup Works" subtitle="There is now one account-creation flow for everyone.">
        <div className="space-y-3 text-sm leading-7 text-slate-600">
          <p>1. Open this page and copy your family code.</p>
          <p>2. Open the normal create-account page.</p>
          <p>3. Fill in email, username, display name, password, and the optional family code.</p>
          <p>4. If the code is valid, the new account becomes a child account linked to you.</p>
        </div>
      </PageCard>
    </div>
  );
};

export const FamilyChildPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { childId = '' } = useParams();

  const childQuery = useQuery({
    queryKey: ['family', 'children', childId],
    queryFn: async () => {
      const { data } = await api.get<FamilyChildResponse>(`/family/children/${childId}`);
      return data.child;
    },
    enabled: Boolean(childId),
  });

  const releaseMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/family/children/${childId}/release`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['family', 'children'] });
      navigate('/family', { replace: true });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/family/children/${childId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['family', 'children'] });
      navigate('/family', { replace: true });
    },
  });

  const handleRelease = () => {
    if (!childQuery.data) {
      return;
    }

    const confirmed = window.confirm(
      `Release ${childQuery.data.displayName} from your family? This will convert the account into a standard account.`,
    );

    if (confirmed) {
      releaseMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (!childQuery.data) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${childQuery.data.displayName} permanently? This action cannot be undone.`,
    );

    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <PageCard title="Child account" subtitle="Release this account into a standard account or delete it permanently.">
        {childQuery.isLoading ? <p className="text-sm text-slate-500">Loading child account...</p> : null}
        {childQuery.isError ? <p className="text-sm text-rose-600">Could not load this child account right now.</p> : null}
        {childQuery.data ? (
          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="font-medium text-slate-900">{childQuery.data.displayName}</p>
              <p className="mt-1 text-sm text-slate-500">@{childQuery.data.username}</p>
              <p className="mt-3 text-sm text-slate-600">{childQuery.data.email}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                Joined {new Date(childQuery.data.createdAt).toLocaleDateString()}
              </p>
              {childQuery.data.bio ? <p className="mt-4 text-sm leading-7 text-slate-600">{childQuery.data.bio}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full border border-amber-200 px-5 py-3 text-sm font-medium text-amber-700 disabled:opacity-60"
                disabled={releaseMutation.isPending || deleteMutation.isPending}
                onClick={handleRelease}
                type="button"
              >
                {releaseMutation.isPending ? 'Releasing...' : 'Release child account'}
              </button>
              <button
                className="rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700 disabled:opacity-60"
                disabled={releaseMutation.isPending || deleteMutation.isPending}
                onClick={handleDelete}
                type="button"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete child account'}
              </button>
            </div>
            {releaseMutation.isError ? (
              <p className="text-sm text-rose-600">Could not release this child account right now.</p>
            ) : null}
            {deleteMutation.isError ? (
              <p className="text-sm text-rose-600">Could not delete this child account right now.</p>
            ) : null}
          </div>
        ) : null}
      </PageCard>
      <PageCard title="What These Actions Do" subtitle="These controls change the account relationship, not just the current view.">
        <div className="space-y-3 text-sm leading-7 text-slate-600">
          <p>Release converts the child account into a standard account and removes it from your family.</p>
          <p>Delete permanently removes the child account from the platform.</p>
          <p>Only standard accounts with linked children can manage family accounts.</p>
        </div>
      </PageCard>
    </div>
  );
};

export const FamilyChildMessagesPage = () => (
  <PageCard title="Child messages" subtitle="Family manager visibility is read-only and covers all direct messages.">
    <div className="rounded-[1.5rem] border border-slate-200 p-4">
      <p className="text-sm text-slate-500">Jamie Brooks</p>
      <p className="mt-2">Checking in after school.</p>
    </div>
  </PageCard>
);

export const FamilyChildConnectionsPage = () => (
  <PageCard title="Child connections" subtitle="Managers can review, request, and cancel child connection requests.">
    <div className="rounded-[1.5rem] border border-slate-200 p-4 text-sm text-slate-600">
      Family-linked connection requests disclose that family visibility may apply.
    </div>
  </PageCard>
);
